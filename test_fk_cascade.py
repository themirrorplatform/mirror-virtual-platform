"""Quick test to verify foreign key CASCADE in SQLite"""
import sqlite3
import tempfile
from pathlib import Path

# Create temp database
temp_dir = tempfile.mkdtemp()
db_path = Path(temp_dir) / "test_fk.db"

conn = sqlite3.connect(str(db_path))

# Enable foreign keys
conn.execute("PRAGMA foreign_keys = ON")

# Check if enabled
result = conn.execute("PRAGMA foreign_keys").fetchone()
print(f"Foreign keys enabled: {result[0]}")

# Create tables
conn.executescript("""
CREATE TABLE parent (
    id TEXT PRIMARY KEY,
    name TEXT
);

CREATE TABLE child (
    id TEXT PRIMARY KEY,
    parent_id TEXT NOT NULL REFERENCES parent(id) ON DELETE CASCADE,
    data TEXT
);
""")

# Check foreign keys again after executescript
result2 = conn.execute("PRAGMA foreign_keys").fetchone()
print(f"Foreign keys after executescript: {result2[0]}")

# Need to re-enable?
conn.execute("PRAGMA foreign_keys = ON")

# Insert data
conn.execute("INSERT INTO parent VALUES ('p1', 'Parent 1')")
conn.execute("INSERT INTO child VALUES ('c1', 'p1', 'Child data')")
conn.commit()

# Verify data exists
child = conn.execute("SELECT * FROM child WHERE id = 'c1'").fetchone()
print(f"Child before delete: {child}")

# Delete parent
conn.execute("DELETE FROM parent WHERE id = 'p1'")
conn.commit()

# Check if child was CASCADE deleted
child_after = conn.execute("SELECT * FROM child WHERE id = 'c1'").fetchone()
print(f"Child after CASCADE: {child_after}")

if child_after is None:
    print("✅ CASCADE DELETE WORKS!")
else:
    print("❌ CASCADE DELETE FAILED!")

conn.close()

# Cleanup
import shutil
shutil.rmtree(temp_dir)
