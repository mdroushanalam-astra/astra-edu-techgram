"""Authorized, transactional server adapter to the same kernel used by the web app."""
import hashlib
import json
import os
import subprocess
from datetime import date, datetime, timezone
from pathlib import Path
from .db.models import LearningProjectionModel, LearningCommandModel

ROOT = Path(__file__).resolve().parents[1]

class LearningConflict(ValueError):
    pass

def runtime(payload):
    executable = os.environ.get("NODE_BINARY", "node")
    script = ROOT / "runtime" / "learning.mjs"
    if not script.is_file():
        raise RuntimeError("Build the learning runtime with npm run build:runtime")
    result = subprocess.run([executable, str(script)], input=json.dumps(payload),
                            capture_output=True, text=True, encoding="utf-8", timeout=20, check=False)
    if result.returncode:
        raise RuntimeError("Learning runtime failed")
    return json.loads(result.stdout)

def current_learning(service, student_id):
    projection = service.db_repo._direct_session.get(LearningProjectionModel, student_id)
    return {"revision": projection.revision if projection else 0,
            "preferences": projection.preferences if projection else {},
            "history": projection.session_history if projection else [],
            "view": projection.last_view if projection else None}

def learning_command(service, student_id, command_id, answer=None, minutes=20, action=None, preferences=None, reflection=None):
    fingerprint = hashlib.sha256(json.dumps({"answer": answer, "minutes": minutes, "action": action,
                                            "preferences": preferences, "reflection": reflection}, sort_keys=True).encode()).hexdigest()
    repo = service.db_repo
    with repo.transaction():
        repo.lock_student(student_id)
        session = repo._direct_session
        existing = session.get(LearningCommandModel, (student_id, command_id))
        if existing:
            if existing.fingerprint != fingerprint:
                raise LearningConflict("Command ID was already used with different input")
            return existing.response
        student = repo.get_student(student_id)
        projection = session.get(LearningProjectionModel, student_id)
        if not projection:
            projection = LearningProjectionModel(student_id=student_id, revision=0, events=[], preferences={}, session_history=[])
            session.add(projection)
        update = answer or action or preferences or reflection
        if update and update["revision"] != projection.revision:
            raise LearningConflict("Learning state changed; reload before continuing")
        if preferences is not None:
            if preferences.get("name"):
                student.name = preferences["name"]
            student.target_exam_date = preferences.get("examDate") or None
            projection.preferences = {k: v for k, v in preferences.items() if k != "revision" and v is not None}
            projection.revision += 1
            if projection.last_view:
                projection.last_view = {**projection.last_view, "revision": projection.revision}
            session.flush()
            result = current_learning(service, student_id)
            session.add(LearningCommandModel(student_id=student_id, command_id=command_id, fingerprint=fingerprint, response=result))
            session.flush()
            return result
        if reflection is not None:
            history = [dict(entry) for entry in projection.session_history]
            entry = next((entry for entry in history if entry["id"] == reflection["session_id"]), None)
            if not entry:
                raise LearningConflict("Complete this session before saving its reflection")
            entry.update(feeling=reflection["feeling"], next=reflection["next"])
            projection.session_history = history
            projection.revision += 1
            if projection.last_view:
                projection.last_view = {**projection.last_view, "revision": projection.revision}
            result = current_learning(service, student_id)
            session.add(LearningCommandModel(student_id=student_id, command_id=command_id, fingerprint=fingerprint, response=result))
            session.flush()
            return result
        context = projection.runtime_context
        if action or answer:
            if not context or context.get("version") != 2 or context["status"] == "completed":
                raise LearningConflict("No active lesson; open a session first")
            if context["status"] == "paused" and (action or {}).get("action") not in ("resume", "finish"):
                raise LearningConflict("Resume the lesson before continuing")
        if action:
            if action["step_id"] != f'{context["id"]}:{context["step_number"]}':
                raise LearningConflict("Teaching step changed; reload before continuing")
            move = context.get("move") or {}
            evidence = move.get("expectEvidence", {})
            if action["action"] == "continue" and evidence.get("kind") == "item_response":
                raise LearningConflict("Answer this question before continuing")
            if action["action"] in ("hint", "example") and not evidence.get("hintsAllowed"):
                raise LearningConflict("This independent check has no hints")
            if action["action"] in ("hint", "example") and not (projection.last_view or {}).get("lesson", {}).get(f'{action["action"]}_available'):
                raise LearningConflict("Support material is unavailable for this step")
        if answer:
            if answer["revision"] != projection.revision:
                raise LearningConflict("Learning state changed; reload before answering")
            if not projection.pending_item or answer["item_id"] != projection.pending_item:
                raise LearningConflict("Answer must match the question issued by the server")
            if (context.get("move") or {}).get("expectEvidence", {}).get("kind") != "item_response":
                raise LearningConflict("Continue the explanation before answering")
        if len(projection.events) >= 5000:
            raise LearningConflict("Evidence capacity reached; contact support")
        # Time is server-owned. No client can manufacture days or exam deadlines.
        today = datetime.now(timezone.utc).date()
        day = max(1, (today - student.created_at.date()).days + 1)
        days_to_exam = max(1, (date.fromisoformat(student.target_exam_date) - today).days) if student.target_exam_date else 90
        payload = {"events": projection.events, "student_id": student_id,
                   "day": day, "days_to_exam": days_to_exam, "minutes": minutes,
                   "command_id": command_id, "context": projection.runtime_context,
                   "preferences": projection.preferences,
                   "pack": "polity" if student.goal == "UPSC Polity" else "geography",
                   "catalog": "units" if projection.preferences.get("geographyUnit") else None}
        if answer:
            payload["answer"] = {**answer, "command_id": command_id}
            payload["context"] = projection.runtime_context
        if action:
            payload["action"] = action
        view = runtime(payload)
        projection.events = view.pop("events")
        projection.runtime_context = view.pop("runtime_context")
        projection.pending_item = view["item"]["id"] if view.get("lesson", {}).get("input") == "item_response" and view["session"]["status"] == "active" else None
        projection.revision += 1
        view["revision"] = projection.revision
        view["student_id"] = student_id
        projection.last_view = view
        if view["session"]["status"] == "completed":
            entry = {"id": view["session"]["id"], "date": datetime.now(timezone.utc).isoformat(),
                     "subject": student.goal, "results": view["session"]["answers"], "feeling": "", "next": ""}
            if not any(old["id"] == entry["id"] for old in projection.session_history):
                projection.session_history = [entry, *projection.session_history][:100]
        session.add(LearningCommandModel(student_id=student_id, command_id=command_id,
                                       fingerprint=fingerprint, response=view))
        session.flush()
        return view
