/**
 * Setup Script - Start Databases and Run Migrations
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting test database setup...\n');

try {
  // Start Docker containers
  console.log('📦 Starting PostgreSQL containers...');
  execSync('docker-compose up -d', { stdio: 'inherit' });
  
  // Wait for databases to be ready
  console.log('\n⏳ Waiting for databases to be ready...');
  execSync('timeout /t 10', { stdio: 'inherit', shell: 'cmd.exe' });
  
  // Run migrations on test database
  console.log('\n🔧 Running migrations on test database...');
  const migrationsDir = path.join(__dirname, 'supabase', 'migrations');
  
  // Apply migrations
  const migrations = [
    '001_mirror_core.sql',
    '002_reflection_intelligence.sql',
    '003_mirrorx_complete.sql'
  ];
  
  migrations.forEach(migration => {
    console.log(`  Applying ${migration}...`);
    const migrationPath = path.join(migrationsDir, migration);
    try {
      execSync(`psql -h localhost -p 5433 -U postgres -d mirror_test -f "${migrationPath}"`, {
        stdio: 'inherit',
        env: { ...process.env, PGPASSWORD: 'postgres' }
      });
    } catch (error) {
      console.error(`  ⚠️  Warning: ${migration} may have already been applied`);
    }
  });
  
  console.log('\n✅ Test database setup complete!');
  console.log('\n📊 Database connection:');
  console.log('   postgresql://postgres:postgres@localhost:5433/mirror_test');
  console.log('\n🧪 Ready to run tests!');
  
} catch (error) {
  console.error('\n❌ Error during setup:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   1. Make sure Docker Desktop is running');
  console.log('   2. Try: docker-compose down && docker-compose up -d');
  console.log('   3. Check if port 5433 is available');
  process.exit(1);
}
