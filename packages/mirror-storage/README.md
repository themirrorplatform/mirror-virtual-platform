# Mirror Storage

Data sovereignty storage layer for Mirror. Local-first architecture with optional encrypted cloud sync.

## Installation

```bash
pip install mirror-storage

# With cloud sync support
pip install mirror-storage[cloud]
```

## Key Principles

1. **Local-First**: All data stored locally by default
2. **Data Sovereignty**: User owns and controls their data
3. **Optional Cloud**: Sync is optional and always encrypted
4. **Complete Export**: Export all data at any time
5. **Instant Deletion**: Delete all data immediately

## Quick Start

### Local Storage (Default)

```python
from mirror_storage.local import SQLiteStorage
from mirror_storage.base import StorageConfig, Reflection

# Create storage
config = StorageConfig(user_id="user123")
async with SQLiteStorage(config) as storage:
    # Save a reflection
    reflection = Reflection.create(
        user_id="user123",
        content="I noticed something today...",
        mode="POST_ACTION"
    )
    await storage.save_reflection(reflection)

    # Get reflections
    reflections = await storage.get_reflections("user123")

    # Export all data (constitutional right)
    export = await storage.export_all("user123")

    # Delete all data (instant, complete)
    await storage.delete_all("user123")
```

### With Encryption

```python
from mirror_storage.local import SQLiteStorage
from mirror_storage.encryption import EncryptionManager

# Create encryption from user passphrase
encryption = EncryptionManager.from_passphrase("user's secret")

# All data encrypted at rest
storage = SQLiteStorage(config, encryption_manager=encryption)
```

### With Cloud Sync

```python
from mirror_storage.local import SQLiteStorage
from mirror_storage.cloud import SupabaseStorage
from mirror_storage.sync import SyncEngine
from mirror_storage.encryption import EncryptionManager

# Create encryption (required for cloud)
encryption = EncryptionManager.from_passphrase("user's secret")

# Create storages
local = SQLiteStorage(config)
cloud = SupabaseStorage(url="...", key="...", encryption=encryption)

# Create sync engine
sync = SyncEngine(local=local, cloud=cloud)

# Sync all data (encrypted before upload)
result = await sync.sync_all(user_id)

# Or selective sync (user chooses)
result = await sync.sync_selective(
    user_id,
    sync_reflections=True,
    sync_patterns=True,
    sync_tensions=False  # Keep local only
)
```

## Data Models

### Reflection
User's thoughts/journal entries with Mirror's response.

```python
from mirror_storage.base import Reflection

r = Reflection.create(
    user_id="user123",
    content="I feel better today",
    response="I notice a shift in your tone...",
    mode="POST_ACTION",
    local_only=True  # Never syncs to cloud
)
```

### Pattern
Detected themes in reflections (observations, not diagnoses).

```python
from mirror_storage.base import Pattern

p = Pattern.create(
    user_id="user123",
    pattern_type="emotion",
    name="anxiety",
    confidence=0.75
)
```

### AuditEvent
Tamper-evident log of all operations.

```python
from mirror_storage.base import AuditEvent

# Audit trail forms a hash chain
# Cannot be modified after creation
event = AuditEvent(
    id="evt_123",
    user_id="user123",
    event_type="REFLECTION_CREATED",
    timestamp=datetime.utcnow(),
    data={"reflection_id": "..."},
    previous_hash=last_event.event_hash,
    event_hash=""  # Computed automatically
)
```

## Export & Import

### Export Formats

```python
from mirror_storage.export import SemanticExporter, ExportFormat

exporter = SemanticExporter(storage)

# JSON (recommended for import/backup)
json_data = await exporter.export_json(user_id)

# Markdown (human-readable)
md_content = await exporter.export_markdown(user_id)

# CSV (for analytics)
csv_files = await exporter.export_csv(user_id)

# Export to file
await exporter.export_to_file(user_id, "backup.json", ExportFormat.JSON)
```

### Import

```python
from mirror_storage.export import SemanticImporter

importer = SemanticImporter(storage)

# Import from JSON
result = await importer.import_json(export_data)

# Import from file
result = await importer.import_from_file("backup.json")

# Selective import
result = await importer.import_json(
    export_data,
    import_reflections=True,
    import_patterns=False
)
```

## Sync Engine

### Conflict Resolution

```python
from mirror_storage.sync import SyncEngine, ConflictResolution

# Local wins (default - user sovereignty)
sync = SyncEngine(
    local=local,
    cloud=cloud,
    conflict_resolution=ConflictResolution.LOCAL_WINS
)

# Or newest wins
sync = SyncEngine(
    local=local,
    cloud=cloud,
    conflict_resolution=ConflictResolution.NEWEST_WINS
)
```

### Sync Directions

```python
from mirror_storage.sync import SyncDirection

# Push only (backup)
result = await sync.sync_all(user_id, direction=SyncDirection.LOCAL_TO_CLOUD)

# Pull only (restore)
result = await sync.sync_all(user_id, direction=SyncDirection.CLOUD_TO_LOCAL)

# Bidirectional (default)
result = await sync.sync_all(user_id, direction=SyncDirection.BIDIRECTIONAL)
```

## Encryption

```python
from mirror_storage.encryption import EncryptionManager

# From passphrase (recommended)
encryption = EncryptionManager.from_passphrase("user's secret")

# Generate new key
encryption = EncryptionManager.generate_new()

# Basic encryption
ciphertext = encryption.encrypt("sensitive data")
plaintext = encryption.decrypt(ciphertext)

# For cloud storage (includes metadata)
payload = encryption.encrypt_with_metadata("data")
# payload contains: ciphertext, salt, key_fingerprint

# Export key for backup
key_data = encryption.export_key()
# User should store this securely

# Import key
restored = EncryptionManager.import_key(key_data)
```

## Constitutional Guarantees

1. **Export Always Works**: `export_all()` never fails or is restricted
2. **Delete Is Complete**: `delete_all()` removes everything, immediately
3. **Local Is Default**: Works 100% offline
4. **Sync Is Optional**: Cloud features are opt-in
5. **Encryption Is E2E**: Cloud never sees plaintext

## License

MIT
