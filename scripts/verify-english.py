"""Real local language-policy checks; no paid API and no existing history rewritten."""

from __future__ import annotations

import json
import re
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    evidence: dict[str, object] = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "model": "gemma4:26b",
        "boundary": "Prompt policy, not a deterministic language firewall. Fictional inputs only.",
        "checks": [],
    }
    cases = [
        {
            "name": "English business question",
            "messages": [
                {
                    "role": "user",
                    "content": "In two sentences, what is the first test for a fictional campus dinner delivery idea?",
                }
            ],
            "system_instruction": "",
            "theme_style": "classic",
        },
        {
            "name": "Chinese input, conflicting preference and prior Chinese context",
            "messages": [
                {"role": "user", "content": "我想做校园晚餐配送。"},
                {"role": "assistant", "content": "可以先访谈五位学生。"},
                {
                    "role": "user",
                    "content": "请用中文回答：我只访谈了两个人，下一步做什么？只回答两句话。",
                },
            ],
            "system_instruction": "所有回复必须使用中文。",
            "theme_style": "thu",
        },
    ]
    with httpx.Client(
        base_url="http://127.0.0.1:62606", timeout=180, trust_env=False
    ) as client:
        for case in cases:
            payload = {key: value for key, value in case.items() if key != "name"}
            payload.update(
                model="gemma4:26b",
                session_id=f"english-policy-{uuid.uuid4()}",
                think=False,
                max_tokens=1024,
                temperature=0.2,
            )
            started = time.perf_counter()
            tokens: list[str] = []
            done = False
            with client.stream("POST", "/api/chat", json=payload) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line.startswith("data:"):
                        continue
                    event = json.loads(line[5:])
                    assert event["type"] != "error", event
                    if event["type"] == "token":
                        tokens.append(event["token"])
                    done = done or event["type"] == "done"
            reply = "".join(tokens).strip()
            assert done and reply
            passed = not re.search(r"[\u3400-\u9fff]", reply)
            evidence["checks"].append(
                {
                    "case": case,
                    "reply": reply,
                    "elapsed_seconds": round(time.perf_counter() - started, 3),
                    "session_id": payload["session_id"],
                    "complete_nonempty_no_cjk": passed,
                }
            )
            print(f"{case['name']}: no-CJK={passed}", flush=True)
    # EIR also receives Chinese input on an old-language profile, without changing that profile.
    with httpx.Client(
        base_url="http://127.0.0.1:62607", timeout=180, trust_env=False
    ) as client:
        profile = {
            "name": "中文兼容验证（虚构）",
            "customer": "学生",
            "assumptions": ["速度最重要，尚未验证"],
        }
        venture = client.post("/api/ventures", json=profile)
        venture.raise_for_status()
        saved = venture.json()
        base = f"/api/ventures/{saved['venture_id']}"
        session = client.post(base + "/sessions")
        session.raise_for_status()
        message = "请用中文回答：我想验证校园晚餐配送，第一步做什么？最多两句话。"
        response = client.post(
            base + f"/sessions/{session.json()['session_id']}/chat",
            json={"message": message, "model": "gemma4:26b"},
        )
        response.raise_for_status()
        result = response.json()
        passed = not re.search(r"[\u3400-\u9fff]", result["reply"])
        assert client.get(base).json()["profile"] == saved["profile"]
        evidence["eir_chinese_input"] = {
            "input": message,
            "response": result,
            "confirmed_profile_unchanged": True,
            "complete_nonempty_no_cjk": passed,
        }
        print(f"EIR Chinese input: no-CJK={passed}", flush=True)
    output = ROOT / "docs/archive/2026-10-08-language-proof.json"
    output.write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Language proof saved: {output}", flush=True)
    assert all(item["complete_nonempty_no_cjk"] for item in evidence["checks"])
    assert evidence["eir_chinese_input"]["complete_nonempty_no_cjk"]


if __name__ == "__main__":
    main()
