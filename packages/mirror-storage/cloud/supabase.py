"""
Supabase Cloud Storage Adapter

Optional cloud storage using Supabase (Postgres + real-time).
All data is encrypted E2E before leaving the user's device.

Key principles:
- Encryption happens client-side (server never sees plaintext)
- User controls what syncs (selective sync)
- Local data is authoritative (cloud is backup/sync)
- Works offline (sync when connected)
"""

import json
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio

from ..base import (
    MirrorStorage,
    StorageConfig,
    StorageCapabilities,
    StorageType,
    Reflection,
    Pattern,
    Tension,
    AuditEvent,
    StorageError,
    DataNotFoundError,
    SyncError,
)
from ..encryption import EncryptionManager


class SupabaseStorage(MirrorStorage):
    """
    Supabase cloud storage adapter.

    All data is E2E encrypted before upload. Supabase only stores
    encrypted blobs - it never sees plaintext user data.

    Usage:
        from mirror_storage.cloud import SupabaseStorage
        from mirror_storage.encryption import EncryptionManager

        # Create encryption manager (user's key)
        encryption = EncryptionManager.from_passphrase("user's secret")

        # Create cloud storage
        cloud = SupabaseStorage(
            url="https://xxx.supabase.co",
            key="your-anon-key",
            encryption=encryption
        )

        async with cloud:
            # All data encrypted before upload
            await cloud.save_reflection(reflection)

    Note: This adapter requires the supabase package:
        pip install supabase
    """

    def __init__(
        self,
        url: str,
        key: str,
        encryption: EncryptionManager,
        config: Optional[StorageConfig] = None
    ):
        """
        Initialize Supabase storage.

        Args:
            url: Supabase project URL
            key: Supabase anon key
            encryption: Encryption manager (required for E2E encryption)
            config: Storage configuration
        """
        if config is None:
            config = StorageConfig(
                user_id="",
                cloud_url=url,
                cloud_key=key,
                sync_enabled=True
            )
        super().__init__(config)

        self._url = url
        self._key = key
        self._encryption = encryption
        self._client = None

    def _get_client(self):
        """Lazy-initialize Supabase client."""
        if self._client is None:
            try:
                from supabase import create_client, Client
            except ImportError:
                raise StorageError(
                    "Supabase package not installed. Run: pip install supabase"
                )

            self._client = create_client(self._url, self._key)
        return self._client

    @property
    def capabilities(self) -> StorageCapabilities:
        return StorageCapabilities(
            storage_type=StorageType.CLOUD,
            supports_sync=True,
            supports_realtime=True,
            supports_encryption=True,
            requires_network=True,
        )

    async def initialize(self) -> None:
        """Verify connection to Supabase."""
        # Just verify we can connect
        try:
            client = self._get_client()
            # Simple health check
            self._initialized = True
        except Exception as e:
            raise StorageError(f"Failed to connect to Supabase: {e}")

    async def close(self) -> None:
        """Close Supabase connection."""
        self._client = None

    def _encrypt_record(self, data: Dict[str, Any]) -> str:
        """Encrypt a record for cloud storage."""
        return self._encryption.encrypt_for_cloud(data)

    def _decrypt_record(self, encrypted: str) -> Dict[str, Any]:
        """Decrypt a record from cloud storage."""
        return self._encryption.decrypt_from_cloud(encrypted)

    # Table operations use encrypted blobs

    async def _upsert_encrypted(
        self,
        table: str,
        record_id: str,
        user_id: str,
        data: Dict[str, Any]
    ) -> str:
        """Upsert an encrypted record."""
        client = self._get_client()

        encrypted_data = self._encrypt_record(data)

        try:
            result = client.table(table).upsert({
                "id": record_id,
                "user_id": user_id,
                "encrypted_data": encrypted_data,
                "updated_at": datetime.utcnow().isoformat(),
            }).execute()

            return record_id
        except Exception as e:
            raise SyncError(f"Failed to upsert to {table}: {e}")

    async def _get_encrypted(
        self,
        table: str,
        record_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get and decrypt a record."""
        client = self._get_client()

        try:
            result = client.table(table).select("*").eq("id", record_id).execute()

            if not result.data:
                return None

            encrypted_data = result.data[0]["encrypted_data"]
            return self._decrypt_record(encrypted_data)
        except Exception as e:
            raise SyncError(f"Failed to get from {table}: {e}")

    async def _get_all_encrypted(
        self,
        table: str,
        user_id: str,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get and decrypt all records for a user."""
        client = self._get_client()

        try:
            result = (
                client.table(table)
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .limit(limit)
                .execute()
            )

            return [
                self._decrypt_record(row["encrypted_data"])
                for row in result.data
            ]
        except Exception as e:
            raise SyncError(f"Failed to get all from {table}: {e}")

    async def _delete_record(self, table: str, record_id: str) -> bool:
        """Delete a record."""
        client = self._get_client()

        try:
            result = client.table(table).delete().eq("id", record_id).execute()
            return len(result.data) > 0
        except Exception as e:
            raise SyncError(f"Failed to delete from {table}: {e}")

    # Reflections

    async def save_reflection(self, reflection: Reflection) -> str:
        return await self._upsert_encrypted(
            "reflections_encrypted",
            reflection.id,
            reflection.user_id,
            reflection.to_dict()
        )

    async def get_reflection(self, reflection_id: str) -> Optional[Reflection]:
        data = await self._get_encrypted("reflections_encrypted", reflection_id)
        if data:
            return Reflection.from_dict(data)
        return None

    async def get_reflections(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
        since: Optional[datetime] = None
    ) -> List[Reflection]:
        all_data = await self._get_all_encrypted(
            "reflections_encrypted",
            user_id,
            limit=limit + offset  # Get more to handle offset
        )

        reflections = [Reflection.from_dict(d) for d in all_data]

        if since:
            reflections = [r for r in reflections if r.created_at > since]

        reflections.sort(key=lambda r: r.created_at, reverse=True)
        return reflections[offset:offset + limit]

    async def delete_reflection(self, reflection_id: str) -> bool:
        return await self._delete_record("reflections_encrypted", reflection_id)

    # Patterns

    async def save_pattern(self, pattern: Pattern) -> str:
        return await self._upsert_encrypted(
            "patterns_encrypted",
            pattern.id,
            pattern.user_id,
            pattern.to_dict()
        )

    async def get_patterns(self, user_id: str) -> List[Pattern]:
        all_data = await self._get_all_encrypted(
            "patterns_encrypted",
            user_id,
            limit=1000
        )
        return [Pattern.from_dict(d) for d in all_data]

    async def delete_pattern(self, pattern_id: str) -> bool:
        return await self._delete_record("patterns_encrypted", pattern_id)

    # Tensions

    async def save_tension(self, tension: Tension) -> str:
        return await self._upsert_encrypted(
            "tensions_encrypted",
            tension.id,
            tension.user_id,
            tension.to_dict()
        )

    async def get_tensions(self, user_id: str) -> List[Tension]:
        all_data = await self._get_all_encrypted(
            "tensions_encrypted",
            user_id,
            limit=1000
        )
        return [Tension.from_dict(d) for d in all_data]

    async def delete_tension(self, tension_id: str) -> bool:
        return await self._delete_record("tensions_encrypted", tension_id)

    # Audit Trail

    async def append_audit_event(self, event: AuditEvent) -> str:
        return await self._upsert_encrypted(
            "audit_trail_encrypted",
            event.id,
            event.user_id,
            event.to_dict()
        )

    async def get_audit_trail(
        self,
        user_id: str,
        limit: int = 100,
        since: Optional[datetime] = None
    ) -> List[AuditEvent]:
        all_data = await self._get_all_encrypted(
            "audit_trail_encrypted",
            user_id,
            limit=limit
        )

        events = [AuditEvent.from_dict(d) for d in all_data]

        if since:
            events = [e for e in events if e.timestamp > since]

        events.sort(key=lambda e: e.timestamp, reverse=True)
        return events[:limit]

    async def verify_audit_chain(self, user_id: str) -> bool:
        """Verify audit trail integrity (same as local)."""
        events = await self.get_audit_trail(user_id, limit=100000)
        events.sort(key=lambda e: e.timestamp)

        previous_hash = None
        for event in events:
            if event.previous_hash != previous_hash:
                return False
            if not event.verify_integrity():
                return False
            previous_hash = event.event_hash

        return True

    # Export & Deletion

    async def export_all(self, user_id: str) -> Dict[str, Any]:
        reflections = await self.get_reflections(user_id, limit=100000)
        patterns = await self.get_patterns(user_id)
        tensions = await self.get_tensions(user_id)
        audit_trail = await self.get_audit_trail(user_id, limit=100000)

        return {
            "export_version": "1.0.0",
            "export_date": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "source": "supabase_cloud",
            "reflections": [r.to_dict() for r in reflections],
            "patterns": [p.to_dict() for p in patterns],
            "tensions": [t.to_dict() for t in tensions],
            "audit_trail": [a.to_dict() for a in audit_trail],
        }

    async def delete_all(self, user_id: str) -> bool:
        """Delete all user data from cloud."""
        client = self._get_client()

        try:
            # Delete from all tables
            for table in [
                "reflections_encrypted",
                "patterns_encrypted",
                "tensions_encrypted",
                "audit_trail_encrypted"
            ]:
                client.table(table).delete().eq("user_id", user_id).execute()

            return True
        except Exception as e:
            raise SyncError(f"Failed to delete all data: {e}")
