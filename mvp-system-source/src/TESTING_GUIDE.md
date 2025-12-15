# The Mirror - Comprehensive Testing Guide
## All 32 Constitutional Improvements

**Version**: 2.0  
**Date**: December 14, 2025  
**Total Features to Test**: 32  
**Test Categories**: 8  

---

## 📋 TESTING CHECKLIST

### **Phase 1: Security & Encryption** (6 tests)

#### ✅ Test 1: Encryption Setup
**File**: `/components/settings/EncryptionSettings.tsx`

**Steps**:
1. Navigate to Self → Encryption
2. Click "Enable Encryption"
3. Enter passphrase (at least 8 characters)
4. Confirm passphrase
5. Click "Enable"

**Expected Result**:
- ✅ Encryption enabled successfully
- ✅ Status shows "Encryption Enabled" with green lock icon
- ✅ Passphrase is NOT stored in localStorage (verify in DevTools)
- ✅ Salt IS stored in localStorage (key: `mirror_encryption_salt`)

**Constitutional Check**:
- ✅ User must explicitly enable (not default)
- ✅ Clear explanation of what encryption means
- ✅ Warning about forgetting passphrase

---

#### ✅ Test 2: Encrypt & Decrypt Reflection
**Prerequisites**: Encryption enabled

**Steps**:
1. Go to Mirror screen
2. Type a reflection
3. Save/Archive
4. Open DevTools → Application → IndexedDB → mirror_db → reflections
5. Find the saved reflection
6. Check if `encrypted` field is true and content is encrypted

**Expected Result**:
- ✅ Reflection shows `encrypted: true`
- ✅ Content field contains encrypted data (looks like random characters)
- ✅ Reflection displays normally in app (decrypted on read)

---

#### ✅ Test 3: Lock/Unlock Vault
**Prerequisites**: Encryption enabled

**Steps**:
1. In Encryption settings, click "Lock Vault"
2. Try to view reflections
3. Click "Unlock Vault"
4. Enter passphrase
5. View reflections again

**Expected Result**:
- ✅ After locking, encrypted reflections show error or placeholder
- ✅ After unlocking with correct passphrase, reflections display normally
- ✅ Incorrect passphrase shows error

---

#### ✅ Test 4: Auto-Recovery (Zero Data Loss)
**File**: `/services/autoRecovery.ts`

**Steps**:
1. Go to Mirror screen
2. Type at least 20 characters
3. Wait 100ms
4. Open DevTools → Application → Local Storage
5. Check for `mirror_recovery_snapshot`
6. Close tab WITHOUT saving
7. Reopen Mirror
8. Check for recovery banner

**Expected Result**:
- ✅ Recovery snapshot appears in localStorage within 100ms
- ✅ Recovery banner shows on reload
- ✅ Banner shows correct content and age
- ✅ User can choose "Recover" or "Discard"
- ✅ Recovering restores exact content

**Constitutional Check**:
- ✅ Never automatic restoration
- ✅ User chooses to recover or discard
- ✅ Dismissible

---

#### ✅ Test 5: Database Health Check
**File**: `/services/databaseHealth.ts`

**Steps**:
1. Create several reflections
2. Create a thread with reflection IDs
3. Manually delete one of the reflections from IndexedDB
4. In Self → Database Health, click "Run Health Check"

**Expected Result**:
- ✅ Health check detects orphaned thread references
- ✅ Issue is marked as "fixable"
- ✅ Click "Auto-Fix" repairs the issue
- ✅ Re-running health check shows no issues

---

#### ✅ Test 6: Schema Migrations
**File**: `/services/migration.ts`

**Steps**:
1. Open DevTools Console
2. Run: `migrationService.needsMigration()`
3. Run: `migrationService.getHistory()`

**Expected Result**:
- ✅ `needsMigration()` returns `false` (current version)
- ✅ `getHistory()` shows version 1 applied
- ✅ No errors during migration check

---

### **Phase 2: Constitutional Compliance** (4 tests)

#### ✅ Test 7: Constitutional Audit
**File**: `/components/settings/ConstitutionalHealthPanel.tsx`

**Steps**:
1. Navigate to Self → Constitutional Health
2. Wait for audit to complete
3. Check sovereignty score
4. Review each category (Sovereignty, Privacy, UX)

**Expected Result**:
- ✅ Audit completes without errors
- ✅ Score is between 0-100
- ✅ All checkmarks for compliant principles
- ✅ Data Sovereignty: All 5 principles green
- ✅ Privacy: At least 3 of 4 green
- ✅ UX: All 4 principles green

**Constitutional Check**:
- ✅ Audit report uses neutral language
- ✅ No forbidden phrases in violations
- ✅ Export report button works

---

#### ✅ Test 8: Violation Detection
**File**: `/services/constitutionalAudit.ts`

**Steps**:
1. Open DevTools Console
2. Add forbidden text to DOM: `document.body.appendChild(document.createTextNode('get started'))`
3. Run audit again
4. Check violations

**Expected Result**:
- ✅ Violation detected: "Forbidden phrase detected: 'get started'"
- ✅ Severity marked as "critical"
- ✅ Type is "language"
- ✅ Suggestion provided

---

#### ✅ Test 9: Pattern Detection Opt-In
**File**: `/components/PatternDetectionPanel.tsx`

**Steps**:
1. Navigate to Self → Pattern Detection
2. Verify it's disabled by default
3. Click "Detect Patterns" (should prompt to enable)
4. Enable pattern detection
5. Click "Detect Patterns" again

**Expected Result**:
- ✅ Pattern detection disabled by default
- ✅ Cannot detect without enabling
- ✅ Enable modal shows constitutional promise
- ✅ After enabling, patterns can be detected
- ✅ Patterns only appear when user clicks button (never automatic)

**Constitutional Check**:
- ✅ Never automatic
- ✅ Requires explicit opt-in
- ✅ Can be disabled anytime

---

#### ✅ Test 10: Thread Discovery (One-Time)
**File**: `/components/ThreadDiscoveryBanner.tsx`

**Steps**:
1. Create 5 unthreaded reflections
2. Wait for banner to appear
3. Dismiss the banner
4. Create more reflections
5. Verify banner doesn't return

**Expected Result**:
- ✅ Banner appears after 5 unthreaded reflections
- ✅ Shows 1-3 thread suggestions
- ✅ Suggestions are relevant (by axis, date, or depth)
- ✅ Dismissing sets flag in localStorage
- ✅ Banner NEVER returns after dismissal

**Constitutional Check**:
- ✅ One-time only
- ✅ Dismissible forever
- ✅ Gentle language ("These reflections could become a thread")
- ✅ No pressure

---

### **Phase 3: Accessibility** (5 tests)

#### ✅ Test 11: Keyboard Navigation - Archive
**File**: `/hooks/useKeyboardNavigation.ts`

**Steps**:
1. Navigate to Archive screen
2. Press Tab to focus list
3. Use Arrow Down/Up to navigate reflections
4. Press Enter to open a reflection
5. Press Escape to close
6. Press Home/End keys

**Expected Result**:
- ✅ Tab focuses list container
- ✅ Arrow keys move selection
- ✅ Selected item has visible focus indicator
- ✅ Enter opens selected reflection
- ✅ Escape closes modal
- ✅ Home goes to first item
- ✅ End goes to last item

---

#### ✅ Test 12: Focus Trap in Modals
**File**: `/hooks/useKeyboardNavigation.ts` (`useFocusTrap`)

**Steps**:
1. Open any modal (e.g., encryption setup)
2. Press Tab repeatedly
3. Try to tab outside modal
4. Press Shift+Tab at first element
5. Press Escape

**Expected Result**:
- ✅ Focus cycles through modal elements only
- ✅ Tab from last element goes to first
- ✅ Shift+Tab from first goes to last
- ✅ Cannot tab outside modal
- ✅ Escape closes modal

---

#### ✅ Test 13: Screen Reader Announcements
**File**: `/hooks/useKeyboardNavigation.ts` (`useScreenReaderAnnouncement`)

**Steps**:
1. Enable screen reader (VoiceOver on Mac, NVDA on Windows)
2. Save a reflection
3. Delete a reflection
4. Create a thread

**Expected Result**:
- ✅ "Reflection saved" announced
- ✅ "Reflection deleted" announced
- ✅ "Thread created" announced
- ✅ Announcements are polite (don't interrupt)

---

#### ✅ Test 14: Skip Links
**File**: `/hooks/useKeyboardNavigation.ts` (`useSkipLinks`)

**Steps**:
1. Press Tab on page load
2. Look for skip link to main content
3. Press Enter on skip link

**Expected Result**:
- ✅ Skip link appears on first Tab
- ✅ Link says "Skip to main content" or similar
- ✅ Activating link focuses main content
- ✅ Skip link is visually hidden until focused

---

#### ✅ Test 15: Virtual Scrolling Performance
**File**: `/components/VirtualScroller.tsx`

**Steps**:
1. Create 100+ reflections (use export/import to bulk load)
2. Navigate to Archive
3. Scroll through list
4. Check performance (FPS should stay 60)

**Expected Result**:
- ✅ Smooth scrolling even with 1000+ items
- ✅ Only visible items rendered (check React DevTools)
- ✅ Scroll position maintained on navigation
- ✅ No lag or jank

---

### **Phase 4: Advanced Features** (8 tests)

#### ✅ Test 16: Search Highlighting
**File**: `/services/searchHighlighting.ts`

**Steps**:
1. Navigate to Archive
2. Use search to find reflections containing "test"
3. View search results

**Expected Result**:
- ✅ Search term "test" is highlighted in results
- ✅ Highlighting is subtle (gold background, 20% opacity)
- ✅ Multiple matches highlighted
- ✅ Context shown around matches

---

#### ✅ Test 17: Calendar Month Jump
**File**: `/components/CalendarPicker.tsx`

**Steps**:
1. Navigate to Archive
2. Click calendar/date selector
3. Click "Change year"
4. Select a different year
5. Select a month
6. Click "Go to first reflection"

**Expected Result**:
- ✅ Year selector shows all years with reflections
- ✅ Month selector shows all 12 months
- ✅ Selecting month jumps to that date
- ✅ "Go to first reflection" jumps to earliest reflection
- ✅ Current month highlighted

---

#### ✅ Test 18: Reflection Linking
**File**: `/services/reflectionLinks.ts`

**Steps**:
1. Open a reflection
2. Click "Link to another reflection"
3. Select link type (connects_to, contradicts, builds_on, etc.)
4. Select target reflection
5. View links in reflection detail

**Expected Result**:
- ✅ Link created successfully
- ✅ Link appears in both reflections (bidirectional)
- ✅ Link type displayed correctly
- ✅ Can delete link
- ✅ Graph view shows connections (if implemented)

---

#### ✅ Test 19: Reflection Versioning
**File**: `/services/reflectionVersioning.ts`

**Steps**:
1. Enable versioning in settings
2. Create a reflection
3. Edit the reflection
4. Save (new version created)
5. View version history
6. View diff between versions

**Expected Result**:
- ✅ Versioning disabled by default
- ✅ After enabling, edits create versions
- ✅ Version history shows all versions
- ✅ Diff shows added/removed/unchanged text
- ✅ Can restore old version

---

#### ✅ Test 20: Export Templates
**File**: `/services/exportTemplates.ts`

**Steps**:
1. Navigate to Self → Data Sovereignty
2. Click "Export All Data"
3. Select each template:
   - Journal Format
   - Book Format
   - Timeline Format
   - Letters to Self
   - Simple Markdown

**Expected Result**:
- ✅ Each template exports successfully
- ✅ Journal: Dated entries, chronological
- ✅ Book: Chapters by thread
- ✅ Timeline: Chronological with timestamps
- ✅ Letters: Each reflection as a letter
- ✅ Markdown: Simple markdown format

---

#### ✅ Test 21: Time-Based Reflections
**File**: `/services/timeBasedReflections.ts`

**Steps**:
1. Navigate to new "Scheduled" section
2. Create a reflection scheduled for tomorrow
3. Enable reminder
4. Create a recurring reflection (weekly)
5. View upcoming reflections
6. Mark one as complete

**Expected Result**:
- ✅ Scheduled reflection appears in "Upcoming"
- ✅ Reminder shows on scheduled date (if enabled)
- ✅ Recurring reflection creates next instance after completion
- ✅ Can snooze reflections
- ✅ Past due reflections show separately

---

#### ✅ Test 22: Multi-Device Awareness
**File**: `/services/deviceRegistry.ts`

**Steps**:
1. Open app in two different browsers
2. Navigate to Self → Devices
3. View device list
4. Rename current device
5. Remove old device

**Expected Result**:
- ✅ Both devices appear in registry
- ✅ Current device marked with indicator
- ✅ Device type detected correctly (desktop/mobile)
- ✅ Last seen timestamp updates
- ✅ Can rename devices
- ✅ Can remove non-current devices

---

#### ✅ Test 23: Offline Sync Queue
**File**: `/services/offlineQueue.ts`

**Steps**:
1. Open DevTools → Network → Go offline
2. Create a reflection
3. Edit a reflection
4. Delete a reflection
5. Go back online
6. Check sync status

**Expected Result**:
- ✅ Changes queued while offline
- ✅ Queue visible in UI
- ✅ Auto-sync when online (if enabled)
- ✅ Manual sync button available
- ✅ Failed items retry with exponential backoff

---

### **Phase 5: Error Handling** (3 tests)

#### ✅ Test 24: Error Recovery UI
**File**: `/components/ErrorRecovery.tsx`

**Steps**:
1. Trigger an error (e.g., corrupt IndexedDB)
2. View error recovery screen
3. Click "Export Data"
4. Click "Reload"

**Expected Result**:
- ✅ Error screen appears with specific message
- ✅ Export data button downloads JSON
- ✅ Reload button refreshes app
- ✅ Error report can be saved
- ✅ User never trapped in error state

---

#### ✅ Test 25: Save Status Feedback
**File**: `/components/RecoveryBanner.tsx` (`SaveStatusIndicator`)

**Steps**:
1. Go to Mirror screen
2. Type text
3. Watch bottom-right corner
4. Wait 2.5 seconds after pausing

**Expected Result**:
- ✅ "Saving..." appears briefly
- ✅ Changes to "Saved" with green dot
- ✅ Fades away after 2 seconds
- ✅ Located in bottom-right corner
- ✅ Doesn't block content

---

#### ✅ Test 26: Auto-Save Timing
**Modified**: `/components/screens/MirrorScreenIntegrated.tsx`

**Steps**:
1. Go to Mirror screen
2. Type text
3. Stop typing
4. Count seconds until "Saved" appears

**Expected Result**:
- ✅ Save happens 2.5 seconds after pause (not 5 seconds)
- ✅ Save status indicator appears
- ✅ Reflection saved to database

---

### **Phase 6: Crisis Support** (1 test)

#### ✅ Test 27: Crisis Resources
**File**: `/services/crisisResources.ts`

**Steps**:
1. Navigate to crisis screen (triggered by crisis detection)
2. View hotlines for different countries
3. Check resource accuracy

**Expected Result**:
- ✅ Shows real, verified hotlines
- ✅ 988 Suicide & Crisis Lifeline (US)
- ✅ Crisis Text Line information
- ✅ Country-specific resources
- ✅ Professional resources listed
- ✅ Safety tips provided
- ✅ Emergency numbers correct

---

### **Phase 7: UI Integration** (5 tests)

#### ✅ Test 28: Encryption Settings UI
**File**: `/components/settings/EncryptionSettings.tsx`

**Steps**:
1. Navigate to Self → Encryption
2. Test full workflow (covered in Test 1-3)

**Expected Result**:
- ✅ UI is clean and intuitive
- ✅ All buttons work
- ✅ Modals function correctly
- ✅ Error messages clear
- ✅ Constitutional language throughout

---

#### ✅ Test 29: Constitutional Health UI
**File**: `/components/settings/ConstitutionalHealthPanel.tsx`

**Steps**:
1. Navigate to Self → Constitutional Health
2. Test full workflow (covered in Test 7-8)

**Expected Result**:
- ✅ Circular score indicator works
- ✅ All principle categories visible
- ✅ Violations display correctly
- ✅ Export report works
- ✅ Refresh audit button works

---

#### ✅ Test 30: Pattern Detection UI
**File**: `/components/PatternDetectionPanel.tsx`

**Steps**:
1. Navigate to Self → Pattern Detection
2. Test full workflow (covered in Test 9)

**Expected Result**:
- ✅ Enable/disable toggle works
- ✅ Detect patterns button works
- ✅ Patterns display correctly
- ✅ Confidence indicators visible
- ✅ Pattern details complete

---

#### ✅ Test 31: Thread Discovery Banner UI
**File**: `/components/ThreadDiscoveryBanner.tsx`

**Steps**:
1. Trigger thread discovery (covered in Test 10)

**Expected Result**:
- ✅ Banner appears at correct time
- ✅ Suggestions displayed correctly
- ✅ Click to create thread works
- ✅ Dismiss button works
- ✅ Banner never returns after dismissal

---

#### ✅ Test 32: Recovery Banner UI
**File**: `/components/RecoveryBanner.tsx`

**Steps**:
1. Trigger recovery (covered in Test 4)

**Expected Result**:
- ✅ Banner appears on mount
- ✅ Shows preview of recovered content
- ✅ Shows age ("2 minutes ago")
- ✅ Recover button works
- ✅ Discard button works
- ✅ Close button works

---

## 🎯 CONSTITUTIONAL COMPLIANCE CHECKLIST

For EVERY feature, verify:

### Language Constraints
- [ ] No "get started"
- [ ] No "recommended"
- [ ] No "you should"
- [ ] No "next step"
- [ ] No "improve" or "optimize"
- [ ] No "complete" or "progress"
- [ ] Only neutral, descriptive language

### Interaction Constraints
- [ ] No automatic actions without consent
- [ ] No progress bars
- [ ] No completion indicators
- [ ] No streaks or badges
- [ ] No urgency indicators
- [ ] All features opt-in

### Structural Constraints
- [ ] No required order
- [ ] No forced onboarding
- [ ] No required completion path
- [ ] All areas accessible independently

---

## 🔍 REGRESSION TESTING

After all new features tested, verify original features still work:

### Core Features
- [ ] Mirror screen works
- [ ] Threads screen works
- [ ] World screen works
- [ ] Archive screen works
- [ ] Self screen works

### Original Components
- [ ] MirrorOS AI works
- [ ] Sync service works
- [ ] Database CRUD works
- [ ] Export/import works
- [ ] Consent flows work

---

## 📊 PERFORMANCE BENCHMARKS

### Load Time
- [ ] Initial load < 2 seconds
- [ ] Route changes < 100ms

### Rendering
- [ ] 60 FPS scrolling (even with 1000+ items)
- [ ] No layout shifts
- [ ] Smooth animations

### Memory
- [ ] No memory leaks after 1 hour use
- [ ] IndexedDB operations < 50ms

---

## 🐛 KNOWN ISSUES

Document any issues found:

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| (none yet) | - | - | - |

---

## ✅ FINAL CHECKLIST

Before deploying:

- [ ] All 32 features tested
- [ ] All constitutional checks pass
- [ ] All accessibility tests pass
- [ ] All performance benchmarks met
- [ ] No critical bugs
- [ ] Documentation updated
- [ ] Export/import works with new features
- [ ] Encryption tested thoroughly
- [ ] Auto-recovery tested thoroughly
- [ ] Constitutional audit runs without errors

---

## 🎓 TESTING NOTES

### Browser Support
Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Accessibility Tools
Use:
- [ ] WAVE browser extension
- [ ] axe DevTools
- [ ] Lighthouse accessibility audit
- [ ] Screen reader (VoiceOver/NVDA)

### Performance Tools
Use:
- [ ] Chrome DevTools Performance tab
- [ ] React DevTools Profiler
- [ ] Lighthouse performance audit

---

**Status**: Ready for comprehensive testing  
**Test Coverage**: 32 features × 4 checks each = 128 test points  
**Estimated Testing Time**: 4-6 hours  

---

*"Test thoroughly. Deploy confidently. Maintain silence."*
