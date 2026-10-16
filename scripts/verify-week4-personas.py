"""Record real local-model Persona comparisons using a separate fictional database."""

from __future__ import annotations

import asyncio
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from eir.coaching import GoatClient  # noqa: E402
from eir.models import Action, ChatInput, Evidence, Profile  # noqa: E402
from eir.personas import select_persona  # noqa: E402
from eir.store import Store  # noqa: E402


async def main() -> None:
    out = ROOT / "var/week4-proof"
    out.mkdir(parents=True, exist_ok=True)
    store = Store(out / "personas.sqlite3")
    goat = GoatClient("http://127.0.0.1:62606")
    records = []
    for background in ["Engineer", "Artist", "Scientist", "Business professional"]:
        venture = store.create(
            Profile(
                name="Campus dinner discovery (fictional Persona comparison)",
                customer="Graduate students studying on campus in the evening",
                problem="Affordable dinner access during evening study may be inconvenient",
                founder_background=background,
                assumptions=["Speed is the main concern; untested"],
            )
        )
        for phase in ["initial", "follow-up"]:
            if phase == "follow-up":
                profile = venture.profile.model_copy(
                    update={
                        "actions": [
                            Action(
                                description="Interview five students about their most recent dinner purchase and alternatives",
                                target_count=5,
                                completed_count=2,
                                result="Only two interviews completed. Both reported price concerns greater than speed.",
                            )
                        ],
                        "evidence": [
                            Evidence(
                                observation="Two students reported price mattered more than speed",
                                sample_size=2,
                                source="Fictional founder report",
                                limitation="Only two convenience samples, not market validation.",
                            )
                        ],
                    }
                )
                venture = store.update(venture.venture_id, profile, venture.revision)
            session = store.new_session(venture.venture_id)
            message = (
                "I can interview at most five students. Ask at most two useful intake questions, then suggest one small validation action. Use the selected communication style. Keep your answer under 180 words."
                if phase == "initial"
                else "Review the confirmed interview action and new observations. State planned, completed and remaining counts, explain sample limitations, then suggest the next action in the selected communication style. Keep your answer under 180 words."
            )
            reply = await goat.reply(
                venture=venture, session=session, request=ChatInput(message=message)
            )
            record = {
                "background": background,
                "style": select_persona(venture.profile),
                "phase": phase,
                "message": message,
                "profile": venture.profile.model_dump(),
                "reply": reply,
                "english_check": not bool(re.search(r"[\u4e00-\u9fff]", reply)),
                "review_status": "requires human reading for style and factual fidelity",
            }
            records.append(record)
            payload = {
                "run_at": datetime.now(timezone.utc).isoformat(),
                "model": "gemma4:26b",
                "temperature": 0.2,
                "think": False,
                "boundary": "Fictional, isolated DB; exploratory outputs, not expert evaluation",
                "records": records,
            }
            (out / "persona-real.json").write_text(
                json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
            )
            print(
                f"{background}: {phase} recorded; English={record['english_check']}",
                flush=True,
            )
    assert len(records) == 8 and all(row["english_check"] for row in records)


if __name__ == "__main__":
    asyncio.run(main())
