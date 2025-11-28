# Phase 5 Testing Guide - Password Modal

## Quick Start Testing

### 1. Open the Application
```bash
cd /home/user/snappy
python3 -m http.server 8000
# Visit: http://localhost:8000
```

Or simply open `index.html` directly in your browser.

## Test Cases

### ✅ Test 1: Modal Opens
**Steps:**
1. Load the page
2. Click on the SnapLogic logo (blue logo at top)

**Expected:**
- Dark overlay appears
- White modal box appears centered
- Password input field is focused
- "Enter Password" heading visible
- Submit button visible

### ✅ Test 2: Password Input Security
**Steps:**
1. Open modal (click logo)
2. Type any text in password field

**Expected:**
- Characters are hidden (show as dots/asterisks)
- Text cursor visible in field
- Can type freely

### ✅ Test 3: Correct Password
**Steps:**
1. Open modal
2. Enter: `snapLogic4snapLogic`
3. Click Submit button (or press Enter)

**Expected:**
- Modal closes immediately
- Overlay disappears
- No error message
- Page returns to normal

**Verification:**
- Open browser console (F12)
- Type: `localStorage` or check React state
- Password unlock status should be true

### ✅ Test 4: Incorrect Password
**Steps:**
1. Open modal
2. Enter: `wrongpassword`
3. Click Submit button

**Expected:**
- Red error message appears: "Incorrect password. Please try again."
- Modal stays open
- Password field is NOT cleared
- Can try again

**Follow-up:**
4. Clear the field
5. Enter correct password: `snapLogic4snapLogic`
6. Click Submit

**Expected:**
- Error message disappears
- Modal closes

### ✅ Test 5: Close via Overlay Click
**Steps:**
1. Open modal
2. Click anywhere on the dark overlay (outside the white box)

**Expected:**
- Modal closes
- Password field is cleared
- Error message is cleared (if any)

### ✅ Test 6: Close via Escape Key
**Steps:**
1. Open modal
2. Press the Escape key on keyboard

**Expected:**
- Modal closes
- Password field is cleared
- Error message is cleared (if any)

### ✅ Test 7: Form Submit with Enter Key
**Steps:**
1. Open modal
2. Type password in field
3. Press Enter key (don't click Submit button)

**Expected:**
- Form submits automatically
- Same behavior as clicking Submit button
- Wrong password shows error
- Correct password closes modal

### ✅ Test 8: Tab Navigation
**Steps:**
1. Click each tab at the top:
   - Triggered Task
   - Ultra Task
   - Scheduled Task
   - Headless Ultra Task
   - Diagram
   - FAQ

**Expected:**
- Each tab becomes active (blue highlight)
- Content changes for each tab
- No placeholder text like "coming in Phase X"
- All tabs are functional

### ✅ Test 9: Footer Disclaimer
**Steps:**
1. Scroll to bottom of page

**Expected:**
- Footer with disclaimer text is visible
- Text is complete and properly formatted
- Footer is outside main container

### ✅ Test 10: Console Clean
**Steps:**
1. Open browser console (F12)
2. Refresh page
3. Click around the application

**Expected:**
- No console.log messages
- Only console.error messages (for actual errors)
- No warnings about React
- No syntax errors

## Password Reference

**Correct Password:** `snapLogic4snapLogic`
- Case-sensitive
- No spaces
- Exactly as shown

## Browser Compatibility Testing

Test in multiple browsers:

### Chrome/Edge
```
✅ Should work perfectly
```

### Firefox
```
✅ Should work perfectly
```

### Safari
```
✅ Should work perfectly
```

## Common Issues & Solutions

### Issue: Modal doesn't open
**Solution:** Check browser console for errors. Ensure React loaded correctly.

### Issue: Password accepted but nothing happens
**Solution:** Advanced fields may not be implemented yet. Check `AppContext.passwordUnlocked` in console.

### Issue: Error message doesn't clear
**Solution:** Close modal completely (Escape or overlay click), then try again.

### Issue: Can't type in password field
**Solution:** Click inside the password field to focus it.

## Advanced Testing

### Test Auto-Focus
**Steps:**
1. Open modal
2. Immediately start typing (don't click password field)

**Expected:**
- Characters appear in password field
- Field is auto-focused on modal open

### Test Multiple Open/Close Cycles
**Steps:**
1. Open modal → Close with Escape
2. Open modal → Close with overlay click
3. Open modal → Submit wrong password → Close with Escape
4. Open modal → Submit correct password

**Expected:**
- Each cycle works correctly
- No memory leaks
- Modal state resets each time

### Test Rapid Clicking
**Steps:**
1. Click logo rapidly 5 times
2. Click overlay rapidly 5 times

**Expected:**
- Modal opens and closes smoothly
- No duplicate modals
- No errors in console

## Success Criteria Checklist

Before marking Phase 5 as complete, verify:

- [ ] PasswordModal component exists
- [ ] Modal uses existing .popup and .overlay CSS
- [ ] Logo click opens modal
- [ ] Password field is type="password"
- [ ] Correct password closes modal and unlocks features
- [ ] Wrong password shows error message
- [ ] Overlay click closes modal
- [ ] Escape key closes modal
- [ ] Enter key submits form
- [ ] All console.log statements removed
- [ ] All TODO comments removed
- [ ] All tabs work correctly
- [ ] Footer disclaimer present
- [ ] No console errors
- [ ] Clean code structure

## Quick Visual Check

When page loads, you should see:
1. SnapLogic logo (blue) - clickable
2. "Node Sizing Calculator" heading
3. Description text with link
4. Six tabs (Triggered, Ultra, Scheduled, Headless, Diagram, FAQ)
5. Tab content (varies by selected tab)
6. Footer with disclaimer at bottom

When modal opens:
1. Dark overlay covering page
2. White centered modal box
3. "Enter Password" heading
4. Password input field (focused)
5. Submit button

## Automated Testing Commands

```bash
# Check for console.log statements (should be 0)
grep -c "console\.log" index.html

# Check for TODO comments (should be 0)
grep -c "TODO\|FIXME" index.html

# Check for PasswordModal component (should be 1)
grep -c "function PasswordModal" index.html

# Check for password constant (should be 1)
grep -c "const PASSWORD = 'snapLogic4snapLogic'" index.html

# Check for error handlers (should be 4)
grep -c "console\.error" index.html
```

## Performance Testing

### Load Time
**Expected:** < 2 seconds for initial page load

### Modal Open Speed
**Expected:** Instant (< 100ms)

### Modal Close Speed
**Expected:** Instant (< 100ms)

### Memory Usage
**Expected:** No memory leaks after multiple open/close cycles

## Regression Testing

After any code changes, re-run:
1. All test cases above
2. Verify no new console.log statements added
3. Verify no new TODO comments added
4. Verify modal still works correctly

---

**Testing Completed:** [DATE]
**Tested By:** [NAME]
**Browser(s) Tested:** [LIST]
**Status:** [ ] PASS / [ ] FAIL
**Notes:**
