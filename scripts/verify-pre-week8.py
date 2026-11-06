"""Real local-model receipt in an isolated fictional database; never targets cloud."""

import json
from pathlib import Path
import sys
import argparse
from datetime import date, timedelta

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests"))

from fastapi.testclient import TestClient  # noqa: E402
from eir.app import create_app  # noqa: E402
from eir.coaching import GoatClient  # noqa: E402
from eir.store import Store  # noqa: E402
from test_labs import experiment, decision, pitch, stage  # noqa: E402

out = ROOT / "var/pre-week8-proof"
out.mkdir(parents=True, exist_ok=True)


class RecordedGoat(GoatClient):
    async def reply(self, **kwargs):
        reply = await super().reply(**kwargs)
        with (out / "raw-model.jsonl").open("a", encoding="utf-8") as handle:
            handle.write(
                json.dumps({"input": kwargs["request"].message, "output": reply}) + "\n"
            )
        return reply


client = TestClient(
    create_app(
        store=Store(out / "demo.sqlite3"), goat=RecordedGoat("http://127.0.0.1:62606")
    )
)
parser = argparse.ArgumentParser()
parser.add_argument("--model", default="gemma4:26b")
parser.add_argument("--cases", type=int, default=3, choices=[1, 2, 3])
parser.add_argument(
    "--followup-only",
    action="store_true",
    help="Recheck existing fictional cases after a coaching-prompt change.",
)
args = parser.parse_args()
receipt = {"model": args.model, "cases": [], "failures": []}


def call(path, data=None, method="POST"):
    response = client.request(method, path, json=data)
    if response.status_code == 502 and (
        path.endswith("/draft") or path.endswith("/artifacts/generate")
    ):
        receipt.setdefault("retries", []).append({"path": path, "error": response.text})
        response = client.request(method, path, json=data)
    if response.status_code not in (200, 201):
        raise AssertionError(f"{path}: {response.status_code} {response.text[:700]}")
    return response.json()


def checkpoint():
    (out / "real-model.json").write_text(
        json.dumps(receipt, indent=2), encoding="utf-8"
    )


if args.followup_only:
    previous = json.loads((out / "real-model.json").read_text(encoding="utf-8"))
    receipt["expected_cases"] = len(previous["cases"])
    receipt["completed"] = False
    (out / "followup-final.json").write_text(
        json.dumps(receipt, indent=2), encoding="utf-8"
    )
    for case in previous["cases"]:
        venture_id = case["venture_id"]
        base = f"/api/ventures/{venture_id}/workspace"
        before = call(base, method="GET")
        session = call(f"/api/ventures/{venture_id}/sessions")
        try:
            response = call(
                f"/api/ventures/{venture_id}/sessions/{session['session_id']}/chat",
                {
                    "model": args.model,
                    "message": "Review my saved progress and the new observations. Explain what changed, give the exact interview counts, and challenge the most consequential assumption. Do not treat me as the customer.",
                },
            )
        except Exception as exc:
            receipt["failures"].append({"case": case["name"], "error": str(exc)})
            (out / "followup-final.json").write_text(
                json.dumps(receipt, indent=2), encoding="utf-8"
            )
            raise
        assert call(base, method="GET") == before
        receipt["cases"].append(
            {
                "name": case["name"],
                "reply": response["reply"],
                "workspace_unchanged": True,
            }
        )
        (out / "followup-final.json").write_text(
            json.dumps(receipt, indent=2), encoding="utf-8"
        )
        print(
            f"{case['name']}: refreshed follow-up; stored workspace unchanged",
            flush=True,
        )
    receipt["completed"] = True
    (out / "followup-final.json").write_text(
        json.dumps(receipt, indent=2), encoding="utf-8"
    )
    raise SystemExit(0)


cases = [
    {
        "name": "Campus dinner — fictional Week 7",
        "customer": "Evening graduate students",
        "problem": "Affordable dinner access",
        "stage": "idea",
        "founder_background": "Engineer",
    },
    {
        "name": "Music practice — fictional Week 7",
        "customer": "Music teachers and school purchasers",
        "problem": "Teachers need feedback on practice; the budget owner is unknown",
        "stage": "prototype",
        "founder_background": "Artist",
    },
    {
        "name": "Window repair — fictional Week 7",
        "customer": "Building managers",
        "problem": "Existing repair business exploring a new customer segment",
        "stage": "growth",
        "founder_background": "Business manager",
    },
]

for profile in cases[: args.cases]:
    case = {"name": profile["name"], "checks": [], "outputs": {}}
    receipt["cases"].append(case)
    try:
        venture = call("/api/ventures", profile)
        base = f"/api/ventures/{venture['venture_id']}/workspace"
        case["venture_id"] = venture["venture_id"]
        w = call(
            base + "/draft",
            {
                "expected_revision": 0,
                "model": receipt["model"],
                "objective": "Understand the actual buyer and purchase pathway before expanding this venture",
                "success_criteria": [
                    "Five behavior interviews and a written review distinguishing user, buyer and evidence limits"
                ],
                "constraints": "At most five interviews; no paid services. Keep one interview task with target_count 5. Other review tasks may have target 1.",
            },
        )
        w = call(
            base + "/approve",
            {"expected_revision": w["revision"], "plan_id": w["plans"][-1]["plan_id"]},
        )
        task = next(t for t in w["plans"][-1]["tasks"] if t["target_count"] == 5)
        w = call(
            base + "/tasks/" + task["task_id"],
            {
                "expected_revision": w["revision"],
                "completed_count": 2,
                "status": "in_progress",
                "result": "Two fictional behavior interviews; the purchasing decision-maker remains unclear.",
            },
        )
        case["checks"].append("Real plan approved; 2/5 progress saved")
        seeds = [
            experiment(
                w,
                task_id=task["task_id"],
                audience=profile["customer"],
                title="Buyer discovery",
                hypothesis="The user is also the buyer",
            ),
            decision(),
            pitch(),
            stage(),
        ]
        seeds[1]["title"] = "Next learning approach"
        seeds[0]["questions"] = [
            "Tell me about the last time you purchased a related product or service."
        ]
        seeds[1]["options"][0]["name"] = "Interview users"
        seeds[1]["options"][1]["name"] = "Interview purchasing decision-makers"
        seeds[2]["title"] = "Venture practice"
        seeds[2]["pitch"] = (
            f"We are exploring {profile['problem'].lower()}. We have two exploratory interviews and are still identifying the buyer."
        )
        seeds[2]["problem_customer"] = (
            "Distinguish the actual user from the budget owner."
        )
        seeds[2]["revised_pitch"] = (
            "We seek introductions for three more behavior interviews, not investment yet."
        )
        seeds[3]["material"] = (
            f"Users: {profile['customer']}. Buyer and purchase pathway remain unconfirmed."
        )
        for seed in seeds:
            print(f"{profile['name']}: generating {seed['kind']}", flush=True)
            w = call(
                base + "/artifacts/generate",
                {
                    "expected_revision": w["revision"],
                    "model": receipt["model"],
                    "data": seed,
                },
            )
            record = w["artifacts"][-1]
            case["outputs"][seed["kind"]] = record["data"]
            w = call(
                base + "/artifacts/confirm",
                {
                    "expected_revision": w["revision"],
                    "artifact_id": record["artifact_id"],
                    "action": "confirm",
                },
            )
            case["checks"].append(f"Real {seed['kind']} generated and confirmed")
            checkpoint()
            if seed["kind"] == "experiment":
                w = call(
                    base + "/evidence",
                    {
                        "expected_revision": w["revision"],
                        "experiment_id": record["artifact_id"],
                        "task_id": task["task_id"],
                        "observation": "Both fictional participants use the service, but a different person approves payment.",
                        "source": "Fictional behavior notes A and B",
                        "observed_on": date.today().isoformat(),
                        "sample_size": 2,
                        "stance": "contradicts",
                        "limitation": "Small convenience sample; no verified market demand.",
                    },
                )
                seeds[3]["evidence_ids"] = [w["evidence"][-1]["evidence_id"]]
        today = date.today()
        w = call(
            base + "/checkins",
            {
                "expected_revision": w["revision"],
                "plan_id": w["plans"][-1]["plan_id"],
                "period_start": (today - timedelta(days=6)).isoformat(),
                "period_end": today.isoformat(),
                "results": "Two of five interviews completed; three remain.",
                "learnings": "User and buyer may differ.",
                "blockers": "Budget owner access",
                "next_priorities": ["Find actual budget owners"],
                "next_review_on": (today + timedelta(days=7)).isoformat(),
            },
        )
        session = call(f"/api/ventures/{venture['venture_id']}/sessions")
        chat = call(
            f"/api/ventures/{venture['venture_id']}/sessions/{session['session_id']}/chat",
            {
                "model": receipt["model"],
                "message": "Review my saved progress and the new observations. Explain what changed, give the exact interview counts, and challenge the most consequential assumption. Do not treat me as the customer.",
            },
        )
        case["outputs"]["followup"] = chat["reply"]
        brief = call(
            base + "/brief/preview",
            {
                "expected_revision": w["revision"],
                "questions": ["How should I identify the real buyer?"],
                "reviewed": True,
            },
        )
        assert "5 planned / 2 completed / 3 remaining" in brief["text"]
        case["outputs"]["brief"] = brief["text"]
        assert call(base, method="GET") == w
        case["checks"].append(
            "New-session coaching and exact-count brief; no automatic progress mutation"
        )
    except Exception as exc:
        receipt["failures"].append({"case": profile["name"], "error": str(exc)})
        print(str(exc), flush=True)
    checkpoint()

print(
    json.dumps({"cases": len(receipt["cases"]), "failures": receipt["failures"]}),
    flush=True,
)
if receipt["failures"]:
    raise SystemExit(1)
