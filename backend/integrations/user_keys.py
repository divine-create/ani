from db.models import UserIntegration


def get_key(db, user, service: str) -> str:
    """Return the stored api_key for a user+service, or empty string."""
    if not db or not user:
        return ""
    row = db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.service == service,
        UserIntegration.is_active == True,
    ).first()
    return row.api_key or "" if row else ""


def get_extra(db, user, service: str) -> dict:
    """Return the stored extra_data dict for a user+service."""
    if not db or not user:
        return {}
    row = db.query(UserIntegration).filter(
        UserIntegration.user_id == user.id,
        UserIntegration.service == service,
        UserIntegration.is_active == True,
    ).first()
    return row.extra_data or {} if row else {}
