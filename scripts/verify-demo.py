"""Run two real local-model sessions and retain only fictional demo evidence."""

from __future__ import annotations

import json
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
                "name": "校园晚餐配送（自动验收虚构案例）",
                "customer": "校内晚间学习的学生",
                "problem": "晚间获得合适的晚餐可能不方便",
                "assumptions": ["速度是最重要因素；尚未验证"],
            },
        )
        base = f"/api/ventures/{venture['venture_id']}"
        first = call(base + "/sessions", "POST")
        initial_input = "我想做校园晚餐配送，现在只有想法，还没有访谈。我猜学生最在乎速度。我本周最多能访谈五人。请问两个关键问题并给我一个本周具体可执行的验证行动。"
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
        profile = venture["profile"]
        profile["actions"] = [
            {
                "description": "访谈五位校内晚间学习的学生，问最近一次买晚餐的实际经历、替代方案、价格及速度顾虑；记录原话和背景。",
                "target_count": 5,
                "completed_count": 0,
            }
        ]
        confirmed_plan = call(base, "PUT", {"profile": profile, "expected_revision": 1})
        evidence["confirmed_plan"] = confirmed_plan
        profile["actions"][0]["completed_count"] = 2
        profile["actions"][0]["result"] = "只完成两次访谈；两人提到价格比速度更重要。"
        profile["evidence"] = [
            {
                "observation": "两名受访学生报告价格比速度更重要。",
                "sample_size": 2,
                "source": "虚构案例：创业者手动确认报告",
                "limitation": "仅两个便利样本，不能代表市场，也不证明愿意付费。",
            }
        ]
        confirmed_result = call(
            base, "PUT", {"profile": profile, "expected_revision": 2}
        )
        evidence["confirmed_result"] = confirmed_result
        second = call(base + "/sessions", "POST")
        assert second["turns"] == []
        followup_input = "本次访谈结果已经保存了。请结合上次计划复盘，下一步应该怎么调整？请说明证据局限。"
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
        other = call("/api/ventures", "POST", {"name": "另一虚构项目"})
        cross = client.get(
            f"/api/ventures/{other['venture_id']}/sessions/{second['session_id']}"
        )
        assert cross.status_code == 404
        evidence["cross_project_session_status"] = cross.status_code
        correction = stored["profile"].copy()
        correction["customer"] = "校内晚间学习的研究生（已纠正）"
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
    output = ROOT / "docs/archive/2026-10-08-real-demo.json"
    output.write_text(
        json.dumps(evidence, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Fictional evidence saved: {output}", flush=True)


if __name__ == "__main__":
    main()
