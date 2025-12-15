/**
 * Production Cleanup Script
 * Removes console.logs, debugger statements, and development-only code
 * 
 * Usage: Run before deploying to production
 */

import * as fs from 'fs';
import * as path from 'path';

interface CleanupResult {
  filesScanned: number;
  filesModified: number;
  consolesRemoved: number;
  debuggersRemoved: number;
  todosFound: number;
  errors: string[];
}

/**
 * Patterns to remove in production
 */
const PATTERNS = {
  // Console statements (except errors and warnings)
  consoleLog: /console\.(log|debug|info|trace)\([^)]*\);?\n?/g,
  
  // Debugger statements
  debugger: /debugger;?\n?/g,
  
  // Development-only blocks
  devOnly: /\/\/ DEV_ONLY_START[\s\S]*?\/\/ DEV_ONLY_END\n?/g,
  
  // Empty lines (more than 2 consecutive)
  emptyLines: /\n\n\n+/g,
};

/**
 * Patterns to detect (but not remove) - for reporting
 */
const DETECTION_PATTERNS = {
  // TODO comments
  todos: /\/\/ TODO:|\/\* TODO:|\/\/ FIXME:|\/\* FIXME:/g,
  
  // Console errors/warnings (keep these, just report)
  consoleErrorWarn: /console\.(error|warn)\(/g,
};

/**
 * Clean a single file
 */
function cleanFile(filePath: string): {
  modified: boolean;
  consolesRemoved: number;
  debuggersRemoved: number;
  todosFound: number;
  error?: string;
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let cleaned = content;
    let modified = false;
    
    let consolesRemoved = 0;
    let debuggersRemoved = 0;
    
    // Count console.logs before removal
    const consoleMatches = content.match(PATTERNS.consoleLog);
    if (consoleMatches) {
      consolesRemoved = consoleMatches.length;
      cleaned = cleaned.replace(PATTERNS.consoleLog, '');
      modified = true;
    }
    
    // Count debuggers before removal
    const debuggerMatches = content.match(PATTERNS.debugger);
    if (debuggerMatches) {
      debuggersRemoved = debuggerMatches.length;
      cleaned = cleaned.replace(PATTERNS.debugger, '');
      modified = true;
    }
    
    // Remove dev-only blocks
    if (PATTERNS.devOnly.test(cleaned)) {
      cleaned = cleaned.replace(PATTERNS.devOnly, '');
      modified = true;
    }
    
    // Clean up excessive empty lines
    if (PATTERNS.emptyLines.test(cleaned)) {
      cleaned = cleaned.replace(PATTERNS.emptyLines, '\n\n');
      modified = true;
    }
    
    // Count TODOs (don't remove)
    const todoMatches = content.match(DETECTION_PATTERNS.todos);
    const todosFound = todoMatches ? todoMatches.length : 0;
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, cleaned, 'utf-8');
    }
    
    return {
      modified,
      consolesRemoved,
      debuggersRemoved,
      todosFound,
    };
  } catch (error) {
    return {
      modified: false,
      consolesRemoved: 0,
      debuggersRemoved: 0,
      todosFound: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Recursively scan directory for files to clean
 */
function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other ignored directories
      if (item === 'node_modules' || item === '.git' || item === 'dist') {
        continue;
      }
      
      files.push(...scanDirectory(fullPath, extensions));
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Run production cleanup
 */
export function runProductionCleanup(rootDir: string): CleanupResult {
  const result: CleanupResult = {
    filesScanned: 0,
    filesModified: 0,
    consolesRemoved: 0,
    debuggersRemoved: 0,
    todosFound: 0,
    errors: [],
  };
  
  // Extensions to clean
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  
  console.log('🧹 Starting production cleanup...\n');
  
  // Scan for files
  const files = scanDirectory(rootDir, extensions);
  result.filesScanned = files.length;
  
  console.log(`Found ${files.length} files to scan\n`);
  
  // Clean each file
  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const cleanResult = cleanFile(file);
    
    if (cleanResult.error) {
      result.errors.push(`${relativePath}: ${cleanResult.error}`);
      console.error(`❌ Error cleaning ${relativePath}`);
      continue;
    }
    
    if (cleanResult.modified) {
      result.filesModified++;
      console.log(`✅ Cleaned ${relativePath}`);
      
      if (cleanResult.consolesRemoved > 0) {
        console.log(`   - Removed ${cleanResult.consolesRemoved} console.log(s)`);
      }
      if (cleanResult.debuggersRemoved > 0) {
        console.log(`   - Removed ${cleanResult.debuggersRemoved} debugger(s)`);
      }
    }
    
    result.consolesRemoved += cleanResult.consolesRemoved;
    result.debuggersRemoved += cleanResult.debuggersRemoved;
    result.todosFound += cleanResult.todosFound;
  }
  
  // Print summary
  console.log('\n📊 Cleanup Summary:');
  console.log(`   Files scanned: ${result.filesScanned}`);
  console.log(`   Files modified: ${result.filesModified}`);
  console.log(`   console.log() removed: ${result.consolesRemoved}`);
  console.log(`   debugger removed: ${result.debuggersRemoved}`);
  console.log(`   TODOs found: ${result.todosFound}`);
  
  if (result.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${result.errors.length}`);
    result.errors.forEach(err => console.log(`   ${err}`));
  }
  
  if (result.todosFound > 0) {
    console.log(`\n💡 Note: ${result.todosFound} TODO/FIXME comments found`);
    console.log('   Consider addressing these before launch');
  }
  
  console.log('\n✨ Cleanup complete!\n');
  
  return result;
}

/**
 * Dry run - report what would be cleaned without modifying files
 */
export function dryRun(rootDir: string): CleanupResult {
  const result: CleanupResult = {
    filesScanned: 0,
    filesModified: 0,
    consolesRemoved: 0,
    debuggersRemoved: 0,
    todosFound: 0,
    errors: [],
  };
  
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  const files = scanDirectory(rootDir, extensions);
  result.filesScanned = files.length;
  
  console.log('🔍 Dry run - no files will be modified\n');
  
  for (const file of files) {
    const relativePath = path.relative(rootDir, file);
    const content = fs.readFileSync(file, 'utf-8');
    
    const consoleMatches = content.match(PATTERNS.consoleLog);
    const debuggerMatches = content.match(PATTERNS.debugger);
    const todoMatches = content.match(DETECTION_PATTERNS.todos);
    
    if (consoleMatches || debuggerMatches) {
      result.filesModified++;
      console.log(`Would clean ${relativePath}:`);
      
      if (consoleMatches) {
        const count = consoleMatches.length;
        result.consolesRemoved += count;
        console.log(`   - ${count} console.log(s)`);
      }
      
      if (debuggerMatches) {
        const count = debuggerMatches.length;
        result.debuggersRemoved += count;
        console.log(`   - ${count} debugger(s)`);
      }
    }
    
    if (todoMatches) {
      result.todosFound += todoMatches.length;
    }
  }
  
  console.log('\n📊 Dry Run Summary:');
  console.log(`   Files that would be modified: ${result.filesModified}`);
  console.log(`   console.log() that would be removed: ${result.consolesRemoved}`);
  console.log(`   debugger that would be removed: ${result.debuggersRemoved}`);
  console.log(`   TODOs found: ${result.todosFound}`);
  
  return result;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const rootDir = args.find(arg => !arg.startsWith('--')) || process.cwd();
  
  if (isDryRun) {
    dryRun(rootDir);
  } else {
    const result = runProductionCleanup(rootDir);
    
    // Exit with error code if there were errors
    if (result.errors.length > 0) {
      process.exit(1);
    }
  }
}
