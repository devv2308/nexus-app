from bson import ObjectId
from datetime import datetime, timezone


def new_id() -> str:
    return str(ObjectId())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def doc_to_dict(doc: dict) -> dict:
    if doc is None:
        return {}
    out = {}
    for k, v in doc.items():
        if isinstance(v, ObjectId):
            out[k] = str(v)
        elif isinstance(v, datetime):
            out[k] = v.isoformat()
        elif isinstance(v, list):
            out[k] = [doc_to_dict(i) if isinstance(i, dict) else i for i in v]
        elif isinstance(v, dict):
            out[k] = doc_to_dict(v)
        else:
            out[k] = v
    if "_id" in out:
        out["id"] = out.pop("_id")
    return out


def strip_password(user: dict) -> dict:
    user = dict(user)
    user.pop("password_hash", None)
    return doc_to_dict(user)
