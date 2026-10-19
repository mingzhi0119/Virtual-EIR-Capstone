"""Backend-only official OpenAI Responses adapter; no remote conversation state."""

from __future__ import annotations

import re

import httpx

from eir.coaching import ModelUnavailable, coaching_context
from eir.models import ChatInput, Session, Venture


class OpenAIClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        transport: httpx.AsyncBaseTransport | None = None,
        *,
        allowed_models: list[str] | None = None,
    ) -> None:
        if not api_key or any(c.isspace() for c in api_key):
            raise ValueError("Configure OPENAI_API_KEY in the private local config.")
        models = list(dict.fromkeys([model, *(allowed_models or [])]))
        if any(not re.fullmatch(r"[A-Za-z0-9._:-]{1,120}", item) for item in models):
            raise ValueError("OpenAI settings must contain valid model identifiers.")
        self._api_key = api_key
        self.model = model
        self.allowed_models = tuple(models)
        self.transport = transport

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=httpx.Timeout(120, connect=15),
                trust_env=False,
                follow_redirects=False,
            ) as client:
                response = await client.request(
                    method,
                    "https://api.openai.com/v1/" + path,
                    headers={"Authorization": "Bearer " + self._api_key},
                    **kwargs,
                )
            if response.status_code != 200:
                guidance = {
                    401: "Check the local API key.",
                    403: "Check project permissions for the configured model.",
                    404: "Check the configured model and project access.",
                    429: "Check API billing, quota, or rate limits before retrying.",
                }.get(response.status_code, "Check the API service and configuration.")
                raise ModelUnavailable(
                    f"OpenAI request failed (HTTP {response.status_code}). {guidance} No model output was saved."
                )
            data = response.json()
            if not isinstance(data, dict):
                raise ValueError("Invalid response shape")
            return data
        except (httpx.HTTPError, ValueError):
            # Never include remote bodies, headers, or credential-bearing exceptions.
            raise ModelUnavailable(
                "OpenAI connection failed or returned invalid data. No model output was saved."
            ) from None

    async def models(self) -> list[str]:
        for model in self.allowed_models:
            data = await self._request("GET", "models/" + model)
            if data.get("id") != model:
                raise ModelUnavailable("OpenAI did not confirm a configured model.")
        return list(self.allowed_models)

    async def reply(
        self,
        *,
        venture: Venture,
        session: Session,
        request: ChatInput,
        instructions: str = "",
        workspace: dict | None = None,
        response_schema: dict | None = None,
    ) -> str:
        if request.model not in self.allowed_models:
            raise ModelUnavailable("Select the configured OpenAI model and retry.")
        data = await self._request(
            "POST",
            "responses",
            json={
                "model": request.model,
                "instructions": coaching_context(venture, instructions, workspace),
                "input": [turn.model_dump() for turn in session.turns]
                + [{"role": "user", "content": request.message}],
                "store": False,
                "max_output_tokens": 4096,
                **(
                    {"reasoning": {"effort": "medium"}}
                    if request.model in {"gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"}
                    else {}
                ),
                **(
                    {
                        "text": {
                            "format": {
                                "type": "json_schema",
                                "name": "eir_plan",
                                "strict": True,
                                "schema": response_schema,
                            }
                        }
                    }
                    if response_schema
                    else {}
                ),
            },
        )
        try:
            if data.get("status") != "completed" or data.get("error"):
                raise ValueError("Incomplete response")
            parts = []
            for item in data["output"]:
                if item.get("type") != "message":
                    continue
                if item.get("status") != "completed" or item.get("role") != "assistant":
                    raise ValueError("Incomplete message")
                for content in item["content"]:
                    if content.get("type") != "output_text":
                        raise ValueError("Refusal or unexpected output")
                    if not isinstance(content.get("text"), str):
                        raise ValueError("Invalid text")
                    parts.append(content["text"])
            reply = "".join(parts).strip()
            if not reply:
                raise ValueError("Empty response")
            return reply
        except (ValueError, KeyError, TypeError, AttributeError):
            raise ModelUnavailable(
                "OpenAI did not finish a usable text response. No model output was saved."
            ) from None
