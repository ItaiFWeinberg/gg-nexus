"""MongoDB cache layer with TTL-based invalidation."""

from datetime import datetime, timedelta
from models.user import db

cache_collection = db.data_cache

CACHE_TTL_HOURS = 24


def get_cached(key):
    """Return cached data if fresh (within TTL), else None."""
    entry = cache_collection.find_one({"key": key})
    if not entry:
        return None

    age = datetime.utcnow() - entry.get("updated_at", datetime.min)
    if age > timedelta(hours=CACHE_TTL_HOURS):
        return None

    return entry.get("data")


def set_cached(key, data, source="unknown"):
    """Store data in cache with timestamp and source tag."""
    cache_collection.update_one(
        {"key": key},
        {
            "$set": {
                "key": key,
                "data": data,
                "source": source,
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True,
    )


def get_cache_info(key):
    """Return metadata about a cached entry."""
    entry = cache_collection.find_one({"key": key})
    if not entry:
        return None
    return {
        "key": key,
        "source": entry.get("source", "unknown"),
        "updated_at": entry.get("updated_at", "").isoformat()
        if entry.get("updated_at")
        else None,
        "age_hours": round(
            (datetime.utcnow() - entry.get("updated_at", datetime.utcnow())).total_seconds()
            / 3600,
            1,
        ),
    }


def invalidate_cache(key=None):
    """Delete a specific cache key, or flush all if key is None."""
    if key:
        cache_collection.delete_one({"key": key})
    else:
        cache_collection.delete_many({})


def list_cached_keys():
    """List all cached keys with freshness status."""
    entries = cache_collection.find({}, {"key": 1, "source": 1, "updated_at": 1})
    result = []
    for e in entries:
        age = datetime.utcnow() - e.get("updated_at", datetime.utcnow())
        result.append(
            {
                "key": e["key"],
                "source": e.get("source", "unknown"),
                "age_hours": round(age.total_seconds() / 3600, 1),
                "fresh": age < timedelta(hours=CACHE_TTL_HOURS),
            }
        )
    return result