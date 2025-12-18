"""
Cloud Storage Adapters

Optional cloud storage backends for cross-device sync.
All cloud storage is:
- E2E encrypted (before leaving device)
- User-controlled (user chooses what syncs)
- Optional (local-first works without cloud)

Available adapters:
- SupabaseStorage: Postgres + real-time subscriptions
"""

from .supabase import SupabaseStorage

__all__ = [
    "SupabaseStorage",
]
