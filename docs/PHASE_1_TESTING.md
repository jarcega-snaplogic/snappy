# Phase 1 Component Testing Guide

**Date:** 2025-11-08
**Status:** Phase 1 Complete - Components Added

---

## Overview

Phase 1 has successfully added 6 shared/reusable React components to the SnapLogic Node Sizing Calculator. This document provides testing instructions for each component.

---

## Components Added

### 1. FormField Component
**Location:** `/home/user/snappy/index.html` (lines 368-434)

**Purpose:** Reusable labeled input supporting number, select, and password field types

**Props:**
- `id` (string) - Field ID
- `label` (string) - Field label
- `type` (string) - Input type ('number', 'select', 'password')
- `value` (any) - Current value
- `onChange` (function) - Change handler
- `options` (array) - Options for select dropdowns [{value, label}]
- `visible` (boolean) - Visibility toggle (default: true)
- `min`, `max`, `step` (number) - Number input constraints

**Test Scenarios:**
1. **Number Input Test:**
   ```jsx
   <FormField
       label="Test Number"
       type="number"
       value={100}
       onChange={(val) => console.log(val)}
       min={0}
       max={1000}
   />
   ```
   - Verify: Label displays correctly
   - Verify: Number input accepts numeric values
   - Verify: onChange receives parsed float value

2. **Select Input Test:**
   ```jsx
   <FormField
       label="Test Select"
       type="select"
       value={1}
       onChange={(val) => console.log(val)}
       options={[
           {value: 1, label: 'Option 1'},
           {value: 2, label: 'Option 2'}
       ]}
   />
   ```
   - Verify: Select dropdown renders with options
   - Verify: onChange receives selected value

3. **Visibility Test:**
   ```jsx
   <FormField
       label="Hidden Field"
       value={0}
       onChange={() => {}}
       visible={false}
   />
   ```
   - Verify: Component returns null when visible=false

---

### 2. Toggle Component
**Location:** `/home/user/snappy/index.html` (lines 436-465)

**Purpose:** Switch component for toggles (batch mode, microbatching)

**Props:**
- `id` (string) - Toggle ID
- `label` (string) - Toggle label
- `checked` (boolean) - Checked state
- `onChange` (function) - Change handler (receives boolean)

**Test Scenarios:**
1. **Basic Toggle:**
   ```jsx
   const [checked, setChecked] = useState(false);
   <Toggle
       id="test-toggle"
       label="Test Mode"
       checked={checked}
       onChange={setChecked}
   />
   ```
   - Verify: Toggle switch renders
   - Verify: Clicking toggle changes state
   - Verify: Visual slider moves when toggled
   - Verify: onChange receives boolean value

2. **Default Checked:**
   ```jsx
   <Toggle
       label="Enabled by Default"
       checked={true}
       onChange={() => {}}
   />
   ```
   - Verify: Toggle starts in checked state

---

### 3. Button Component
**Location:** `/home/user/snappy/index.html` (lines 467-488)

**Purpose:** Standardized button with loading and disabled states

**Props:**
- `children` (ReactNode) - Button text/content
- `onClick` (function) - Click handler
- `disabled` (boolean) - Disabled state (default: false)
- `loading` (boolean) - Loading state (default: false)
- `type` (string) - Button type ('button' or 'submit')

**Test Scenarios:**
1. **Normal Button:**
   ```jsx
   <Button onClick={() => console.log('Clicked')}>
       Click Me
   </Button>
   ```
   - Verify: Button renders with text
   - Verify: onClick fires when clicked

2. **Loading State:**
   ```jsx
   <Button loading={true} onClick={() => {}}>
       Calculate
   </Button>
   ```
   - Verify: Button shows "Loading..." text
   - Verify: Button is disabled when loading

3. **Disabled State:**
   ```jsx
   <Button disabled={true} onClick={() => {}}>
       Disabled
   </Button>
   ```
   - Verify: Button is disabled
   - Verify: onClick doesn't fire

---

### 4. ResultDisplay Component
**Location:** `/home/user/snappy/index.html` (lines 490-574)

**Purpose:** Display calculator results with formatted numbers and messages

**Props:**
- `results` (object) - Result object with calculation values
- `type` (string) - Calculator type ('triggered', 'ultra', 'scheduled', 'headless')

**Test Scenarios:**
1. **Triggered Results:**
   ```jsx
   <ResultDisplay
       type="triggered"
       results={{
           concurrentAPI: 5.5,
           nodesRequired: 2.3,
           haNodesRequired: 3
       }}
   />
   ```
   - Verify: Displays "Concurrent API: 5.50"
   - Verify: Displays "Nodes Required: 2.30"
   - Verify: Displays "HA Nodes Required: 3"
   - Verify: No Ultra Pipeline recommendation (haNodes <= 6)

2. **Triggered with Ultra Recommendation:**
   ```jsx
   <ResultDisplay
       type="triggered"
       results={{
           concurrentAPI: 20,
           nodesRequired: 7,
           haNodesRequired: 10
       }}
   />
   ```
   - Verify: Shows Ultra Pipeline link when haNodes > 6
   - Verify: Link has correct href and opens in new tab

3. **Ultra Results:**
   ```jsx
   <ResultDisplay
       type="ultra"
       results={{
           concurrentAPI: 15.5,
           executionNodesRequired: 4.2,
           haExecutionNodesRequired: 6,
           fmNodesRequired: 2.1,
           haFmNodesRequired: 3
       }}
   />
   ```
   - Verify: Displays execution nodes
   - Verify: Displays FeedMaster nodes

4. **Scheduled Results:**
   ```jsx
   <ResultDisplay
       type="scheduled"
       results={{
           mbPerMinute: 150.5,
           nodesRequired: 2.5,
           haNodesRequired: 4
       }}
   />
   ```
   - Verify: Displays MB per minute
   - Verify: Displays nodes required

5. **Headless (Microbatching):**
   ```jsx
   <ResultDisplay
       type="headless"
       results={{
           isMicrobatching: true,
           eventPerSecond: 100.5,
           executionNodesRequired: 3.2,
           haExecutionNodesRequired: 5
       }}
   />
   ```
   - Verify: Shows event per second
   - Verify: Doesn't show MB per minute

6. **Headless (Non-Microbatching):**
   ```jsx
   <ResultDisplay
       type="headless"
       results={{
           isMicrobatching: false,
           eventPerMinute: 6000,
           mbPerMinute: 200.5,
           executionNodesRequired: 4.5,
           haExecutionNodesRequired: 6
       }}
   />
   ```
   - Verify: Shows event per minute
   - Verify: Shows MB per minute

7. **Null Results:**
   ```jsx
   <ResultDisplay type="triggered" results={null} />
   ```
   - Verify: Component returns null (nothing rendered)

---

### 5. TabBar Component
**Location:** `/home/user/snappy/index.html` (lines 576-599)

**Purpose:** Tab navigation with active state handling

**Props:**
- `tabs` (array) - Array of tab objects [{id, label}]

**Context Dependencies:**
- Uses `useApp()` hook to access `activeTab` and `setActiveTab`

**Test Scenarios:**
1. **Basic Tab Navigation:**
   ```jsx
   <TabBar tabs={[
       {id: 'tab1', label: 'Triggered Task'},
       {id: 'tab2', label: 'Ultra Task'},
       {id: 'tab3', label: 'Scheduled Task'},
       {id: 'tab4', label: 'Headless Ultra Task'},
       {id: 'tab5', label: 'Diagram'},
       {id: 'tab6', label: 'FAQ'}
   ]} />
   ```
   - Verify: All 6 tabs render
   - Verify: First tab has 'active' class by default
   - Verify: Clicking tab updates activeTab in context
   - Verify: Active class moves to clicked tab
   - Verify: Body class 'diagram-tab-active' added when tab5 active

2. **Dynamic Tabs:**
   ```jsx
   <TabBar tabs={[
       {id: 'tab1', label: 'First'},
       {id: 'tab2', label: 'Second'}
   ]} />
   ```
   - Verify: Renders only provided tabs

---

### 6. Header Component
**Location:** `/home/user/snappy/index.html` (lines 601-620)

**Purpose:** Logo and title with password modal trigger

**Props:**
- `onLogoClick` (function) - Click handler for logo

**Test Scenarios:**
1. **Basic Render:**
   ```jsx
   <Header onLogoClick={() => console.log('Logo clicked')} />
   ```
   - Verify: Logo image renders from SnapLogic CDN
   - Verify: "Node Sizing Calculator" h1 renders
   - Verify: Logo has cursor pointer style
   - Verify: Clicking logo fires onLogoClick

2. **Without Click Handler:**
   ```jsx
   <Header />
   ```
   - Verify: Component still renders
   - Verify: Logo click doesn't throw error

---

## Integration Testing

### Test 1: FormField in Context
1. Open `/home/user/snappy/index.html` in browser
2. Open browser console (F12)
3. Verify no React errors
4. Check that Phase 0 status message still displays

### Test 2: Context Verification
1. Open index.html in browser
2. Scroll to "Context Verification" section
3. Verify all context values display:
   - AppContext: activeTab, passwordUnlocked, setActiveTab, unlockPassword
   - CalculatorContext: results, setter functions
   - DiagramContext: monacoEditorInstance, diagramJson, functions

### Test 3: Component Availability
Run in browser console:
```javascript
// Check components are defined
console.log(typeof FormField);      // should be 'function'
console.log(typeof Toggle);         // should be 'function'
console.log(typeof Button);         // should be 'function'
console.log(typeof ResultDisplay);  // should be 'function'
console.log(typeof TabBar);         // should be 'function'
console.log(typeof Header);         // should be 'function'
```

---

## Performance Testing

### Babel Transform Time
1. Open browser DevTools → Network tab
2. Reload page
3. Check babel.min.js load time
4. Open Console → Performance
5. Verify total page load < 1 second

### React Initialization
1. Open Console
2. Check for React initialization messages:
   - "✓ React 18 App initialized"
   - "✓ AppContext, CalculatorContext, DiagramContext ready"
   - "✓ Phase 0 complete - Foundation ready for migration"

---

## Manual Browser Testing

### Browser Compatibility
Test in:
- ✅ Chrome 90+ (primary)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Visual Verification
1. **Layout:** Components render without visual glitches
2. **Styling:** CSS classes applied correctly
3. **Responsive:** Components work on mobile viewport

---

## Known Issues

### None Currently

All 6 components added successfully with no issues encountered.

---

## Next Steps (Phase 2+)

1. **Phase 2:** Build calculator tab components using shared components
   - TriggeredTaskCalculator
   - UltraTaskCalculator
   - ScheduledTaskCalculator
   - HeadlessUltraCalculator

2. **Phase 3:** Migrate Diagram tab
   - MonacoEditor integration
   - Excalidraw integration

3. **Phase 4:** Migrate FAQ tab
   - FAQItem component
   - Collapsible behavior

4. **Phase 5:** Password modal and polish
   - PasswordModal component
   - Final integration testing

---

## Testing Checklist

- [ ] All 6 components render without errors
- [ ] FormField handles number, select, and password types
- [ ] Toggle switches state correctly
- [ ] Button handles loading and disabled states
- [ ] ResultDisplay formats numbers correctly (2 decimals)
- [ ] ResultDisplay shows correct fields per calculator type
- [ ] ResultDisplay shows Ultra recommendation when haNodes > 6
- [ ] TabBar uses useApp() hook correctly
- [ ] TabBar applies active class to correct tab
- [ ] Header logo click fires callback
- [ ] No console errors in browser
- [ ] Phase 0 status message still displays
- [ ] Context verification still works
- [ ] Babel transforms JSX successfully
- [ ] Page loads in < 1 second

---

## Component Size Summary

| Component | Lines of Code | Complexity |
|-----------|---------------|------------|
| FormField | 67 lines | Medium |
| Toggle | 30 lines | Low |
| Button | 22 lines | Low |
| ResultDisplay | 85 lines | High |
| TabBar | 24 lines | Low |
| Header | 20 lines | Low |
| **Total** | **~255 lines** | **Mixed** |

**File Growth:** 525 lines → 780 lines (+255 lines, +48%)

---

## Conclusion

Phase 1 component implementation is complete and ready for testing. All components follow React 18 best practices, use proper JSDoc comments, and integrate with the existing Context architecture.

**Status:** ✅ Phase 1 Complete - Ready for Phase 2
