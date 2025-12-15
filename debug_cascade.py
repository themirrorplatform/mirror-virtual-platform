"""Debug CASCADE DELETE issue"""
import sqlite3
import tempfile
import shutil
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent))

from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirror_os.storage.base import NodeType, ShapeOrigin

# Create temp storage
temp_dir = tempfile.mkdtemp()
db_path = Path(temp_dir) / "test.db"
storage = SQLiteStorage(str(db_path))

# Create mirror
mirror = storage.create_mirror(
    owner_id="test_user",
    label="Test",
    mirrorcore_version="1.0",
    constitution_hash="HASH",
    constitution_version="1.0"
)

# Create node
node = storage.create_node(
    mirror.id, NodeType.THOUGHT,
    content={"text": "Test"},
    summary="Test"
)

print(f"✓ Created mirror: {mirror.id}")
print(f"✓ Created node: {node.id}")

# Check foreign keys directly
conn = sqlite3.connect(str(db_path))
print(f"\n✓ Foreign keys enabled: {conn.execute('PRAGMA foreign_keys').fetchone()[0]}")

# Check schema
schema = conn.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='mirror_nodes'").fetchone()[0]
print(f"\n✓ mirror_nodes schema has CASCADE: {'ON DELETE CASCADE' in schema}")

conn.close()

# Verify node exists before delete
node_before = storage.get_node(node.id, mirror.id)
print(f"\n✓ Node exists before delete: {node_before is not None}")

# Delete mirror
result = storage.delete_mirror(mirror.id)
print(f"\n✓ Mirror deleted: {result}")

# Check mirror gone
mirror_after = storage.get_mirror(mirror.id)
print(f"✓ Mirror is None: {mirror_after is None}")

# Check CASCADE worked
node_after = storage.get_node(node.id, mirror.id)
print(f"\n❌ CASCADE ISSUE: Node still exists: {node_after is not None}")
if node_after:
    # Check database directly
    conn2 = sqlite3.connect(str(db_path))
    conn2.row_factory = sqlite3.Row
    conn2.execute("PRAGMA foreign_keys = ON")
    direct = conn2.execute("SELECT * FROM mirror_nodes WHERE id = ?", (node.id,)).fetchone()
    print(f"   Direct query also finds node: {direct is not None}")
    
    # Try to understand why
    print(f"\n   Checking if mirror still exists in DB:")
    mirror_in_db = conn2.execute("SELECT * FROM mirrors WHERE id = ?", (mirror.id,)).fetchone()
    print(f"   Mirror in DB: {mirror_in_db is not None}")
    
    conn2.close()

# Cleanup
shutil.rmtree(temp_dir)
