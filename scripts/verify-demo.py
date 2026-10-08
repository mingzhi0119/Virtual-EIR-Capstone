"""Run two real local-model sessions and retain only fictional demo evidence."""

from __future__ import annotations

import json
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    evidence: dict[str, object] = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "case": "Fictional campus dinner delivery; no real founder data",
        "model": "gemma4:26b",
    }
    with httpx.Client(
        base_url="http://127.0.0.1:62607", timeout=240, trust_env=False
    ) as client:

        def call(
            path: str, method: str = "GET", body: dict | None = None
        ) -> dict | list:
            response = client.request(method, path, json=body)
            response.raise_for_status()
            return response.json()

        venture = call(
            "/api/ventures",
            "POST",
            {
                "name": "Campus dinner delivery (English verification, fictional)",
                "customer": "Students studying on campus in the evening",
                "problem": "Getting an affordable dinner during evening study may be inconvenient",
                "assumptions": ["Delivery speed matters most; not yet tested"],
            },
        )
        base = f"/api/ventures/{venture['venture_id']}"
        first = call(base + "/sessions", "POST")
        initial_input = "I want to offer campus dinner delivery. This is only an idea; I have no interviews yet. I assume students care most about speed. I can interview at most five people this week. Ask two useful questions and propose one concrete validation action for this week."
        started = time.perf_counter()
        initial = call(
            base + f"/sessions/{first['session_id']}/chat",
            "POST",
            {
                "message": initial_input,
                "model": "gemma4:26b",
            },
        )
        print(
            f"Initial real reply saved in {time.perf_counter() - started:.1f}s",
            flush=True,
        )
        evidence["initial_input"] = initial_input
        evidence["initial_response"] = initial
        assert not re.search(r"[\u3400-\u9fff]", initial["reply"])
        profile = venture["profile"]
        profile["actions"] = [
            {
                "description": "Interview five students studying on campus in the evening about their most recent dinner purchase, alternatives, cost and speed concerns. Record their actual words and context.",
                "target_count": 5,
                "completed_count": 0,
            }
        ]
        confirmed_plan = call(base, "PUT", {"profile": profile, "expected_revision": 1})
        evidence["confirmed_plan"] = confirmed_plan
        profile["actions"][0]["completed_count"] = 2
        profile["actions"][0]["result"] = (
            "Only two interviews completed; both students reported that price mattered more than speed."
        )
        profile["evidence"] = [
            {
                "observation": "Two students reported that price mattered more than speed.",
                "sample_size": 2,
                "source": "Fictional case: founder-confirmed report",
                "limitation": "Only two convenience samples; not representative and not evidence of willingness to pay.",
            }
        ]
        confirmed_result = call(
            base, "PUT", {"profile": profile, "expected_revision": 2}
        )
        evidence["confirmed_result"] = confirmed_result
        second = call(base + "/sessions", "POST")
        assert second["turns"] == []
        followup_input = "I have saved the latest interview results. Review them against the previous action plan. How should I adjust the next step? Explain the limits of the evidence."
        followup = call(
            base + f"/sessions/{second['session_id']}/chat",
            "POST",
            {
                "message": followup_input,
                "model": "gemma4:26b",
            },
        )
        print(
            f"Follow-up real reply saved in {followup['elapsed_seconds']}s", flush=True
        )
        evidence["followup_input"] = followup_input
        evidence["followup_response"] = followup
        assert not re.search(r"[\u3400-\u9fff]", followup["reply"])
        evidence["language"] = "English; actual replies retained for human review"
        stored = call(base)
        assert stored["profile"]["actions"][0]["target_count"] == 5
        assert stored["profile"]["actions"][0]["completed_count"] == 2
        assert len(call(base + f"/sessions/{second['session_id']}")["turns"]) == 2
        evidence["stored_after_model"] = stored
        # Real app restart: own loopback service only, preserving databases and GOAT.
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ROOT / "scripts/stop-local.ps1"),
                "-Service",
                "eir",
            ],
            check=True,
        )
        subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-File",
                str(ROOT / "scripts/start-local.ps1"),
            ],
            check=True,
        )
        restored = call(base)
        assert restored == stored
        restored_session = call(base + f"/sessions/{second['session_id']}")
        assert restored_session == followup["session"]
        evidence["restart_restored_profile_and_session"] = True
        other = call("/api/ventures", "POST", {"name": "Another fictional venture"})
        cross = client.get(
            f"/api/ventures/{other['venture_id']}/sessions/{second['session_id']}"
        )
        assert cross.status_code == 404
        evidence["cross_project_session_status"] = cross.status_code
        correction = stored["profile"].copy()
        correction["customer"] = (
            "Graduate students studying on campus in the evening (corrected)"
        )
        corrected = call(
            base,
            "PUT",
            {"profile": correction, "expected_revision": stored["revision"]},
        )
        assert call(base)["profile"]["customer"] == correction["customer"]
        evidence["corrected_profile"] = corrected
        evidence["manual_quality_review_required"] = True
    with httpx.Client(trust_env=False, timeout=10) as local:
        evidence["ollama_loaded_models"] = local.get(
            "http://127.0.0.1:11434/api/ps"
        ).json()
        evidence["goat_saved_followup"] = local.get(
            f"http://127.0.0.1:62606/api/history/{followup['goat_session_id']}"
        ).json()
    output = ROOT / "docs/archive/2026-10-08-english-demo.json"
    output.write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Fictional evidence saved: {output}", flush=True)


if __name__ == "__main__":
    main()
