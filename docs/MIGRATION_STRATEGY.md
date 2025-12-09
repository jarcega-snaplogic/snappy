# Migration Strategy: Vanilla JS → Full React (SnapLogic Node Sizing Calculator)

**Version:** 1.0  
**Date:** 2025-11-08  
**Status:** Draft for Review

---

## Executive Summary

This document outlines the strategy for migrating the SnapLogic Node Sizing Calculator from its current hybrid vanilla JavaScript/React architecture to a fully React-based single-page application. The migration will maintain the critical constraint of **no build process** (single HTML file with CDN dependencies) while improving code maintainability, reusability, and developer experience.

**Current State:**
- ~1129 lines in `index.html` (HTML + vanilla JS + React/JSX)
- ~398 lines in `styles.css`
- Hybrid architecture: vanilla JS (lines 271-697) + React (lines 703-1127)
- 4 calculator tabs (vanilla JS)
- 1 diagram tab (React/Excalidraw)
- 1 FAQ tab (vanilla JS)
- Password-protected advanced features

**Target State:**
- Fully React-based component architecture
- Single HTML file with CDN dependencies (maintained)
- Improved code organization and reusability
- Enhanced testability and maintainability
- Zero functionality regression

---

## 1. Migration Philosophy

### 1.1 Incremental Approach (RECOMMENDED)

**Why Incremental?**
- Minimizes risk by allowing rollback at any phase
- Enables continuous validation of calculations
- Allows developers to learn React patterns progressively
- Maintains a working application throughout migration
- Easier code review in smaller chunks

**Big-Bang Approach (NOT RECOMMENDED):**
- High risk of introducing bugs across all features
- Difficult to isolate issues
- No intermediate working states
- Would require extensive testing period with app offline

### 1.2 Testing Strategy During Migration

**Manual Testing Per Phase:**
- Verify calculations match original values exactly
- Test all user interactions (clicks, toggles, inputs)
- Validate tab switching behavior
- Confirm password feature works
- Test responsive layout on multiple screen sizes

**Regression Testing Approach:**
- Create a "golden dataset" before migration (known inputs → expected outputs)
- After each phase, run all calculators with golden dataset
- Compare results byte-for-byte with original
- Document any deviations (even minor formatting)

**Browser Testing:**
- Chrome (primary)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Android)

### 1.3 Rollback Plan

**Git Strategy:**
- Create feature branch: `feature/react-migration`
- Create phase branches off feature branch: `feature/react-migration-phase-0`, etc.
- Main branch remains untouched until final merge
- Tag working version before migration: `v1.0-pre-migration`

**Rollback Triggers:**
- Any calculation discrepancy discovered
- Performance degradation >100ms on any operation
- Critical bug affecting core functionality
- Browser compatibility issues discovered late

**Rollback Procedure:**
1. Stop work on current phase
2. Document issues encountered
3. `git checkout v1.0-pre-migration`
4. Deploy original version
5. Conduct retrospective to determine if migration should continue

### 1.4 User Impact Assessment

**During Migration:**
- **Impact:** ZERO - Migration happens in separate branch
- **Downtime:** NONE - Users continue using current version

**During Testing:**
- **Impact:** MINIMAL - Testing in dev/staging environments
- **User Involvement:** Optional beta testing with power users

**At Cutover:**
- **Impact:** ZERO functional changes
- **Risk:** Low (if all testing completed)
- **Communication:** Update CLAUDE.md, notify users of internal improvements

---

## 2. Phased Migration Plan

### Phase 0: Setup & Foundation (6-8 hours)
**Objective:** Establish React architecture without breaking existing functionality

**Components to Create:**
- App shell component
- React Context for global state (password lock, tab state)
- Utility functions module
- Constants module

**Dependencies/Prerequisites:**
- Git branch created
- Golden dataset prepared
- Team alignment on React patterns

**Success Criteria:**
- React app renders alongside existing vanilla JS (no conflicts)
- Tab switching works via React state
- No console errors
- All existing functionality still works

**Estimated Effort:** 6-8 hours

**Risk Level:** 🟢 LOW - No functionality removed, only added

---

### Phase 1: Shared Components (8-10 hours)
**Objective:** Build reusable React components for common UI elements

**Components to Migrate:**
- `<Button>` - Standardized button component
- `<Input>` - Number input with label
- `<Select>` - Dropdown with label
- `<Toggle>` - Switch component (batch/microbatch)
- `<TabBar>` - Tab navigation
- `<ResultPanel>` - Result display container

**Dependencies/Prerequisites:**
- Phase 0 complete
- React Context established

**Success Criteria:**
- All shared components render correctly
- Components accept props and handle events
- Styling matches original exactly
- No functionality changes

**Estimated Effort:** 8-10 hours

**Risk Level:** 🟢 LOW - Components not yet integrated into calculators

---

### Phase 2: FAQ Tab (3-4 hours)
**Objective:** Migrate simplest tab to validate approach

**Components to Create:**
- `<FAQTab>` - Container component
- `<FAQItem>` - Individual Q&A with accordion

**Migration Steps:**
1. Create `<FAQTab>` component with static content
2. Implement accordion state management
3. Replace vanilla JS FAQ (lines 156-263, 460-487)
4. Remove `toggleAnswer()` function
5. Test all FAQ interactions

**Dependencies/Prerequisites:**
- Phase 1 complete
- Shared components available

**Success Criteria:**
- FAQ accordion opens/closes correctly
- Only one answer visible at a time
- Styling matches original
- No vanilla JS FAQ code remains

**Estimated Effort:** 3-4 hours

**Risk Level:** 🟢 LOW - No calculations, simple interaction

---

### Phase 3: Calculator Tabs (20-24 hours)
**Objective:** Migrate all four calculator tabs to React

**Approach:** Create shared calculator component, then specialize

**Components to Create:**
- `<CalculatorLayout>` - Shared layout wrapper
- `<TriggeredTaskCalculator>` - Tab 1
- `<UltraTaskCalculator>` - Tab 2
- `<ScheduledTaskCalculator>` - Tab 3
- `<HeadlessUltraCalculator>` - Tab 4

**Migration Strategy (per calculator):**
1. Create component with form inputs using shared components
2. Implement calculation logic (preserve formulas exactly)
3. Implement result display
4. Add password-protected fields
5. Test with golden dataset
6. Replace vanilla JS version
7. Remove old calculation functions

**Order of Migration:**
1. Triggered Task (simplest) - 4-5 hours
2. Ultra Task - 5-6 hours
3. Scheduled Task (toggle complexity) - 5-6 hours
4. Headless Ultra (most complex, two modes) - 6-7 hours

**Dependencies/Prerequisites:**
- Phase 2 complete
- Golden dataset with expected values
- Password context available

**Success Criteria:**
- All calculations produce identical results to original
- All toggles work correctly
- Password protection works
- Results display correctly
- JSON generation scrapes new React state correctly

**Estimated Effort:** 20-24 hours total

**Risk Level:** 🟡 MEDIUM - Core business logic, calculation accuracy critical

---

### Phase 4: Diagram Tab Integration (6-8 hours)
**Objective:** Integrate existing React diagram code into new architecture

**Components to Refactor:**
- `<DiagramTab>` - Container (already React, lines 701-1089)
- Monaco Editor integration
- JSON generation from React state

**Migration Steps:**
1. Extract existing React diagram code into component file
2. Refactor `generateDiagramJson()` to read from React Context instead of DOM scraping
3. Update Monaco Editor initialization for React lifecycle
4. Integrate with new app architecture
5. Test diagram generation with all calculator combinations

**Dependencies/Prerequisites:**
- Phase 3 complete
- All calculator results available in React Context

**Success Criteria:**
- Monaco Editor initializes correctly
- JSON generation reads from React state
- Diagram renders correctly
- No DOM scraping (getElementById) remains
- All diagram features work (zoom, export, etc.)

**Estimated Effort:** 6-8 hours

**Risk Level:** 🟡 MEDIUM - Already React, but needs state integration

---

### Phase 5: Password Feature & Polish (4-6 hours)
**Objective:** Migrate password modal and final cleanup

**Components to Create:**
- `<PasswordModal>` - Modal component
- `<PasswordContext>` - Global password state

**Migration Steps:**
1. Create password modal component
2. Implement password checking logic
3. Connect to all calculators for conditional field display
4. Remove vanilla JS password code (lines 656-688)
5. Style matching

**Additional Polish:**
- Remove all unused vanilla JS functions
- Clean up event listeners
- Optimize re-renders
- Add PropTypes or TypeScript comments
- Update CLAUDE.md documentation

**Dependencies/Prerequisites:**
- All phases 0-4 complete

**Success Criteria:**
- Password modal works identically
- All hidden fields show/hide correctly
- No vanilla JS remains except initialization
- Code is clean and documented
- Performance is equal or better

**Estimated Effort:** 4-6 hours

**Risk Level:** 🟢 LOW - Isolated feature

---

### Phase 6: Final Testing & Deployment (6-8 hours)
**Objective:** Comprehensive testing and production deployment

**Testing Activities:**
- Full regression test with golden dataset
- Cross-browser testing (all major browsers)
- Mobile responsiveness testing
- Performance benchmarking
- Accessibility audit (keyboard navigation, screen readers)
- Security review (password handling)

**Documentation Updates:**
- Update CLAUDE.md with new architecture
- Create component documentation
- Update README if exists
- Create migration notes for future reference

**Deployment:**
- Code review and approval
- Merge to main branch
- Tag release: `v2.0-full-react`
- Deploy to production
- Monitor for issues (first 24-48 hours)

**Success Criteria:**
- All tests pass
- Performance benchmarks met
- Zero functionality regression
- Documentation complete
- Stakeholder approval

**Estimated Effort:** 6-8 hours

**Risk Level:** 🟢 LOW - Testing and validation

---

## 3. Detailed Phase Breakdown

### Phase 0: Setup & Foundation - DETAILED STEPS

#### Step 1: Create Git Branch (15 min)
```bash
git checkout -b feature/react-migration
git push -u origin feature/react-migration
```

#### Step 2: Create Golden Dataset (1 hour)
**File:** `/docs/test-data/golden-dataset.json`

```json
{
  "triggeredTask": {
    "inputs": {
      "apiPerDay": 833333,
      "coverageHours": 24,
      "apiResponseTime": 1,
      "peak": 150
    },
    "expectedOutputs": {
      "concurrentAPI": 14.46,
      "nodesRequired": 0.72,
      "haNodesRequired": 2
    }
  },
  "ultraTask": { ... },
  "scheduledTask": { ... },
  "headlessUltraTask": { ... }
}
```

**Action:** Run all calculators with default values, record results

#### Step 3: Setup React App Structure (2 hours)

**Create inline component structure in `index.html`:**

```javascript
// After line 695, before existing React code
<script type="text/babel">
const { useState, useEffect, useContext, createContext } = React;

// Global Context
const AppContext = createContext();

// App State Provider
function AppProvider({ children }) {
    const [activeTab, setActiveTab] = useState('tab1');
    const [passwordUnlocked, setPasswordUnlocked] = useState(false);
    const [calculatorResults, setCalculatorResults] = useState({
        triggered: null,
        ultra: null,
        scheduled: null,
        headlessUltra: null
    });

    return (
        <AppContext.Provider value={{
            activeTab, setActiveTab,
            passwordUnlocked, setPasswordUnlocked,
            calculatorResults, setCalculatorResults
        }}>
            {children}
        </AppContext.Provider>
    );
}

// Main App Component
function MainApp() {
    return (
        <AppProvider>
            {/* Existing HTML will be converted here progressively */}
            <div className="main-container">
                {/* Content will be added in phases */}
            </div>
        </AppProvider>
    );
}

// Initialize React app alongside vanilla JS (temporary)
// This will be replaced in later phases
</script>
```

#### Step 4: Create Constants Module (30 min)

```javascript
// Constants
const CALCULATOR_CONSTANTS = {
    TRIGGERED_TASK: {
        TPS_PER_NODE: 20,
        DEFAULT_API_PER_DAY: 833333,
        DEFAULT_COVERAGE_HOURS: 24,
        DEFAULT_RESPONSE_TIME: 1,
        DEFAULT_PEAK: 150
    },
    ULTRA_TASK: {
        EXECUTION_TPS_PER_NODE: 100,
        FM_TPS_PER_NODE: 200,
        DEFAULT_API_PER_DAY: 416667,
        DEFAULT_COVERAGE_HOURS: 12,
        DEFAULT_RESPONSE_TIME: 0.3,
        DEFAULT_PEAK: 150
    },
    SCHEDULED_TASK: {
        MB_PER_MIN_PER_NODE: 300,
        DEFAULT_BATCH_SIZE_GB: 300,
        DEFAULT_BATCH_SIZE_ROWS: 1500000000,
        DEFAULT_PROCESS_TIME: 12,
        DEFAULT_COMPLEXITY: 1,
        BYTES_PER_ROW: 2000
    },
    HEADLESS_ULTRA: {
        EVENTS_PER_SEC_PER_NODE: 100,
        MB_PER_MIN_PER_NODE: 150, // Half of scheduled
        DEFAULT_EVENT_PER_DAY: 20000000,
        DEFAULT_COVERAGE_HOURS: 24,
        DEFAULT_EVENT_SIZE: 2000,
        DEFAULT_RESPONSE_TIME: 0.3,
        DEFAULT_PEAK: 150
    },
    COMMON: {
        HA_MULTIPLIER: 1.3,
        MIN_HA_NODES: 2
    }
};

const PASSWORD = 'snapLogic4snapLogic';
```

#### Step 5: Create Utility Functions (1 hour)

```javascript
// Utility Functions
const CalculatorUtils = {
    // Calculate HA nodes with minimum
    calculateHANodes(nodes) {
        return Math.max(
            Math.ceil(nodes * CALCULATOR_CONSTANTS.COMMON.HA_MULTIPLIER),
            CALCULATOR_CONSTANTS.COMMON.MIN_HA_NODES
        );
    },

    // Format number for display
    formatNumber(num, decimals = 2) {
        return num.toFixed(decimals);
    },

    // Convert rows to GB
    rowsToGB(rows, bytesPerRow = 2000) {
        return rows * bytesPerRow / 10000000000;
    },

    // Convert GB to MB
    gbToMB(gb) {
        return gb * 1024;
    },

    // Parse DOM result (temporary - for validation)
    parseDOMResult(elementId, regex) {
        const element = document.getElementById(elementId);
        if (!element) return 0;
        const match = element.innerText.match(regex);
        return match ? Math.ceil(parseFloat(match[1])) : 0;
    }
};
```

#### Step 6: Testing Checkpoint (1 hour)
- Verify React loads without errors
- Verify vanilla JS still works
- Verify constants are accessible
- Verify utilities work correctly
- Document any issues

**Files to Modify:**
- `index.html` (add React structure after line 695)

**Code to Preserve:**
- All existing vanilla JS (lines 271-694)
- All existing React diagram code (lines 703-1127)
- All HTML structure (lines 1-270)

**Git Commit Strategy:**
```bash
git add -A
git commit -m "Phase 0: Setup React foundation and utilities

- Add AppContext with global state management
- Create CALCULATOR_CONSTANTS module
- Create CalculatorUtils helper functions
- Preserve all existing vanilla JS functionality
- No functionality changes"

git push origin feature/react-migration
```

---

### Phase 1: Shared Components - DETAILED STEPS

#### Step 1: Create Button Component (30 min)

```javascript
function Button({ onClick, children, disabled = false, variant = 'primary' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`btn btn-${variant}`}
        >
            {children}
        </button>
    );
}
```

#### Step 2: Create Input Component (1 hour)

```javascript
function NumberInput({ 
    id, 
    label, 
    value, 
    onChange, 
    visible = true,
    min,
    max,
    step = 1 
}) {
    if (!visible) return null;

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <input
                type="number"
                id={id}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                min={min}
                max={max}
                step={step}
            />
        </div>
    );
}
```

#### Step 3: Create Select Component (1 hour)

```javascript
function Select({ id, label, value, onChange, options, visible = true }) {
    if (!visible) return null;

    return (
        <div className="form-group">
            <label htmlFor={id}>{label}</label>
            <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
```

#### Step 4: Create Toggle Component (1.5 hours)

```javascript
function Toggle({ id, label, checked, onChange }) {
    return (
        <div className="toggle-container">
            <label htmlFor={id} className="toggle-label">{label}</label>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    id={id}
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className="slider"></span>
            </label>
        </div>
    );
}
```

#### Step 5: Create TabBar Component (2 hours)

```javascript
function TabBar({ tabs, activeTab, onTabChange }) {
    return (
        <div className="tabs">
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </div>
            ))}
        </div>
    );
}

// Tab configuration
const TAB_CONFIG = [
    { id: 'tab1', label: 'Triggered Task' },
    { id: 'tab2', label: 'Ultra Task' },
    { id: 'tab3', label: 'Scheduled Task' },
    { id: 'tab4', label: 'Headless Ultra Task' },
    { id: 'tab5', label: 'Diagram' },
    { id: 'tab6', label: 'FAQ' }
];
```

#### Step 6: Create ResultPanel Component (1.5 hours)

```javascript
function ResultPanel({ title = "Results", results, infoMessage }) {
    return (
        <div className="result">
            <h2>{title}</h2>
            {results.map((result, idx) => (
                <p key={idx}>{result.label}: {result.value}</p>
            ))}
            {infoMessage && (
                <p className="info" dangerouslySetInnerHTML={{ __html: infoMessage }} />
            )}
        </div>
    );
}
```

#### Step 7: Testing Checkpoint (1 hour)
- Render each component in isolation
- Verify styling matches original
- Test all interactions (onChange, onClick)
- Test conditional visibility
- Document component API

**Git Commit:**
```bash
git commit -m "Phase 1: Create shared React components

- Add Button, NumberInput, Select components
- Add Toggle component with styling
- Add TabBar component with tab management
- Add ResultPanel component
- All components styled to match original
- No functionality changes to app"
```

---

### Phase 2: FAQ Tab - DETAILED STEPS

#### Step 1: Create FAQItem Component (1 hour)

```javascript
function FAQItem({ question, answer, isOpen, onToggle }) {
    return (
        <div className={`faq-item ${isOpen ? 'active' : ''}`}>
            <div className="faq-question" onClick={onToggle}>
                {question}
            </div>
            <div className="faq-answer" style={{ display: isOpen ? 'block' : 'none' }}>
                <div dangerouslySetInnerHTML={{ __html: answer }} />
            </div>
        </div>
    );
}
```

#### Step 2: Create FAQ Data (30 min)

```javascript
const FAQ_DATA = [
    {
        id: 1,
        question: "What are the nodes?",
        answer: `Nodes in SnapLogic are the computational units that execute integration tasks...`
    },
    {
        id: 2,
        question: "What are feedmaster nodes?",
        answer: `Feedmaster nodes are specialized nodes in SnapLogic...<ul><li>Task Distribution...</li>...`
    },
    // ... all other FAQs
];
```

#### Step 3: Create FAQTab Component (1 hour)

```javascript
function FAQTab() {
    const [openFAQId, setOpenFAQId] = useState(null);

    const handleToggle = (faqId) => {
        setOpenFAQId(openFAQId === faqId ? null : faqId);
    };

    return (
        <div>
            <h2>Frequently Asked Questions</h2>
            {FAQ_DATA.map((faq) => (
                <FAQItem
                    key={faq.id}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFAQId === faq.id}
                    onToggle={() => handleToggle(faq.id)}
                />
            ))}
        </div>
    );
}
```

#### Step 4: Integrate into App (30 min)

Replace vanilla HTML FAQ section with React component render:

```javascript
function MainApp() {
    const { activeTab } = useContext(AppContext);

    return (
        <div className="main-container">
            {/* ... other tabs ... */}
            <div id="tab6" className={`tab-content ${activeTab === 'tab6' ? 'active' : ''}`}>
                <FAQTab />
            </div>
        </div>
    );
}
```

#### Step 5: Remove Vanilla JS Code (15 min)

**Delete from index.html:**
- HTML lines 156-263 (FAQ HTML structure)
- JavaScript lines 460-487 (`toggleAnswer` function)

#### Step 6: Testing (30 min)
- Click each FAQ question
- Verify only one opens at a time
- Verify styling matches
- Verify all content renders correctly
- Test on mobile

**Git Commit:**
```bash
git commit -m "Phase 2: Migrate FAQ tab to React

- Create FAQItem and FAQTab components
- Extract FAQ content to FAQ_DATA constant
- Remove vanilla JS toggleAnswer function
- Remove vanilla HTML FAQ structure
- Functionality: identical to original"
```

---

### Phase 3: Calculator Tabs - DETAILED STEPS

#### Calculator 1: Triggered Task (4-5 hours)

**Step 1: Create Component Structure (1 hour)**

```javascript
function TriggeredTaskCalculator() {
    const { passwordUnlocked, setCalculatorResults } = useContext(AppContext);
    
    // Form state
    const [apiPerDay, setApiPerDay] = useState(CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_API_PER_DAY);
    const [coverageHours, setCoverageHours] = useState(CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_COVERAGE_HOURS);
    const [apiResponseTime, setApiResponseTime] = useState(CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_RESPONSE_TIME);
    const [peak, setPeak] = useState(CALCULATOR_CONSTANTS.TRIGGERED_TASK.DEFAULT_PEAK);
    
    // Result state
    const [result, setResult] = useState(null);

    // ... calculation logic will go here
    
    return (
        <div>
            <p>This calculator helps in sizing for triggered tasks with the assumption of an average execution time of 1 second.</p>
            <form id="calculator-form">
                <NumberInput
                    id="api-per-day"
                    label="API requests per Day"
                    value={apiPerDay}
                    onChange={setApiPerDay}
                />
                <NumberInput
                    id="coverage-hours"
                    label="API Usage Hours per Day"
                    value={coverageHours}
                    onChange={setCoverageHours}
                />
                <NumberInput
                    id="api-response-time"
                    label="API Response Time (seconds)"
                    value={apiResponseTime}
                    onChange={setApiResponseTime}
                    visible={passwordUnlocked}
                />
                <NumberInput
                    id="peak"
                    label="Peak (%)"
                    value={peak}
                    onChange={setPeak}
                />
                <Button onClick={handleCalculate}>Calculate</Button>
            </form>
            {result && <ResultPanel {...result} />}
        </div>
    );
}
```

**Step 2: Implement Calculation Logic (1 hour)**

```javascript
const handleCalculate = () => {
    // Preserve exact formula from line 497
    const concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100);
    const nodesRequired = concurrentAPI / (CALCULATOR_CONSTANTS.TRIGGERED_TASK.TPS_PER_NODE / apiResponseTime);
    const haNodesRequired = CalculatorUtils.calculateHANodes(nodesRequired);

    // Build result object
    const resultData = {
        title: "Results",
        results: [
            { label: "Concurrent API", value: CalculatorUtils.formatNumber(concurrentAPI) },
            { label: "Nodes Required", value: CalculatorUtils.formatNumber(nodesRequired) },
            { label: "HA Nodes Required", value: CalculatorUtils.formatNumber(haNodesRequired) }
        ],
        infoMessage: haNodesRequired > 6 
            ? `Consider looking into <a href="https://www.snaplogic.com/resources/data-sheets/snaplogic-ultra-pipelines" target="_blank">SnapLogic Ultra Pipeline</a> for better performance.`
            : null
    };

    setResult(resultData);
    
    // Store in global context for diagram generation
    setCalculatorResults(prev => ({
        ...prev,
        triggered: { haNodesRequired }
    }));
};
```

**Step 3: Validation Against Golden Dataset (1 hour)**
- Run calculation with golden dataset inputs
- Compare output with expected values
- Adjust if needed (should be identical)
- Document any rounding differences

**Step 4: Integration & Removal (30 min)**
- Add component to MainApp
- Remove vanilla JS `calculate()` function (lines 489-518)
- Remove HTML form (lines 37-56)
- Test thoroughly

**Step 5: Testing (1 hour)**
- Test with default values
- Test with edge cases (0, negative, very large numbers)
- Test password unlock/lock
- Test JSON generation reads correct state
- Cross-browser test

**Git Commit:**
```bash
git commit -m "Phase 3.1: Migrate Triggered Task calculator to React

- Create TriggeredTaskCalculator component
- Preserve calculation formula exactly (line 497)
- Add password-protected field visibility
- Store results in global context for diagram
- Remove vanilla JS calculate() function
- Validation: matches golden dataset ✓"
```

**Repeat similar detailed steps for:**
- Ultra Task Calculator (5-6 hours)
- Scheduled Task Calculator (5-6 hours) - includes toggle logic
- Headless Ultra Calculator (6-7 hours) - includes microbatch toggle

---

### Phase 4: Diagram Tab Integration - DETAILED STEPS

#### Step 1: Refactor JSON Generation (2 hours)

**Current:** Scrapes DOM with `getElementById` and regex parsing  
**Target:** Reads from React Context

```javascript
function generateDiagramJson(calculatorResults) {
    const { triggered, ultra, scheduled, headlessUltra } = calculatorResults;
    
    const triggeredNodes = triggered?.haNodesRequired || 0;
    const ultraExecutionNodes = ultra?.haExecutionNodes || 0;
    const ultraFMNodes = ultra?.haFMNodes || 0;
    const scheduledNodes = scheduled?.haNodesRequired || 0;
    const headlessUltraNodes = headlessUltra?.haNodesRequired || 0;

    if (triggeredNodes + ultraExecutionNodes + ultraFMNodes + scheduledNodes + headlessUltraNodes === 0) {
        return {
            "msg": "No calculations have been performed yet. Please use the calculator tabs and click 'Calculate' before generating the JSON."
        };
    }

    // ... rest of JSON generation logic (preserve lines 355-392)
    
    return jsonOutput;
}
```

#### Step 2: Refactor Monaco Editor Integration (2 hours)

```javascript
function DiagramTab() {
    const { calculatorResults } = useContext(AppContext);
    const monacoEditorRef = useRef(null);
    const [monacoInstance, setMonacoInstance] = useState(null);

    useEffect(() => {
        // Initialize Monaco Editor (preserve logic from lines 271-285)
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }});
        require(['vs/editor/editor.main'], function() {
            const editor = monaco.editor.create(monacoEditorRef.current, {
                value: '{"msg": "Click on the Generate JSON button to start"}',
                language: 'json',
                theme: 'vs-light',
                automaticLayout: true,
                minimap: { enabled: false }
            });
            setMonacoInstance(editor);
        });

        return () => {
            if (monacoInstance) {
                monacoInstance.dispose();
            }
        };
    }, []);

    const handleGenerateJson = () => {
        const jsonOutput = generateDiagramJson(calculatorResults);
        const formattedJson = JSON.stringify(jsonOutput, null, 2);
        if (monacoInstance) {
            monacoInstance.setValue(formattedJson);
        }
    };

    // ... rest of diagram component
}
```

#### Step 3: Integrate Excalidraw Component (1 hour)
- Preserve existing Excalidraw logic (lines 733-923)
- Update to read JSON from Monaco editor state
- No changes to diagram rendering logic

#### Step 4: Testing (1 hour)
- Generate JSON after each calculator
- Verify JSON structure matches original
- Generate diagram
- Verify diagram renders correctly
- Test all combinations of calculators

**Git Commit:**
```bash
git commit -m "Phase 4: Integrate diagram tab into React architecture

- Refactor JSON generation to read from Context
- Remove DOM scraping (getElementById)
- Integrate Monaco Editor with React lifecycle
- Preserve all Excalidraw logic
- Functionality: identical to original"
```

---

### Phase 5: Password Feature & Polish - DETAILED STEPS

#### Step 1: Create PasswordModal Component (1.5 hours)

```javascript
function PasswordModal({ isOpen, onClose, onSuccess }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (password === PASSWORD) {
            onSuccess();
            onClose();
            setPassword('');
            setError('');
        } else {
            setError('Incorrect password. Please try again.');
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="overlay" onClick={onClose}></div>
            <div className="popup">
                <h2>Enter Password</h2>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <button onClick={handleSubmit}>Submit</button>
            </div>
        </>
    );
}
```

#### Step 2: Create Logo Component with Modal Trigger (30 min)

```javascript
function Logo() {
    const { setPasswordUnlocked } = useContext(AppContext);
    const [modalOpen, setModalOpen] = useState(false);

    const handleSuccess = () => {
        setPasswordUnlocked(true);
    };

    return (
        <>
            <div className="logo" onClick={() => setModalOpen(true)}>
                <img 
                    src="https://www.snaplogic.com/wp-content/uploads/2022/09/SL_logo_blue_web.png" 
                    alt="SnapLogic Logo"
                />
            </div>
            <PasswordModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
}
```

#### Step 3: Remove Vanilla JS Password Code (15 min)
- Delete lines 656-688 (`showPopup`, `hidePopup`, `checkPassword`)
- Delete HTML lines 258-263 (popup/overlay HTML)

#### Step 4: Code Cleanup (1 hour)
- Remove unused vanilla JS functions
- Remove commented-out code
- Verify no `getElementById` calls remain (except Monaco if needed)
- Remove unused event listeners
- Clean up console.logs

#### Step 5: Performance Optimization (1 hour)
- Add React.memo where appropriate
- Optimize re-renders with useMemo/useCallback
- Test performance (should be same or better)

#### Step 6: Documentation (30 min)
- Add component comments
- Document prop types
- Update inline documentation

**Git Commit:**
```bash
git commit -m "Phase 5: Complete React migration with password feature

- Add PasswordModal component
- Migrate logo click handler
- Remove all remaining vanilla JS (except initialization)
- Clean up unused code
- Optimize React rendering
- Add component documentation
- Migration complete ✓"
```

---

## 4. Parallel Development Strategy

### Can Multiple Developers Work Simultaneously?

**YES, with careful coordination**

### Parallel Work Breakdown

**Developer 1: Foundation & Shared Components**
- Phase 0: Setup & Foundation
- Phase 1: Shared Components
- Phase 2: FAQ Tab (validation)

**Developer 2: Calculator Tabs (1-2)**
- Depends on Phase 1 completion
- Phase 3.1: Triggered Task
- Phase 3.2: Ultra Task

**Developer 3: Calculator Tabs (3-4)**
- Depends on Phase 1 completion
- Phase 3.3: Scheduled Task
- Phase 3.4: Headless Ultra Task

**Developer 4: Diagram & Password**
- Phase 4: Diagram Tab (can start after Phase 0)
- Phase 5: Password Feature

### Component Boundaries for Parallel Work

**Clear Ownership:**
- Each calculator tab is independent
- Shared components modified only by Dev 1
- Context structure agreed upon upfront

**Integration Points:**
- Regular syncs on Context structure
- Shared components frozen after Phase 1
- Communication via Slack/Teams

**Code Review Checkpoints:**
- Phase 0: All devs review (foundation critical)
- Phase 1: All devs review (shared components)
- Each calculator: At least one other dev reviews
- Phase 4-5: All devs review
- Final: Full team code review

### Git Strategy for Parallel Work

```
main
  └── feature/react-migration
      ├── feature/phase-0-foundation (Dev 1)
      ├── feature/phase-1-components (Dev 1)
      ├── feature/phase-2-faq (Dev 1)
      ├── feature/phase-3-calc-triggered (Dev 2)
      ├── feature/phase-3-calc-ultra (Dev 2)
      ├── feature/phase-3-calc-scheduled (Dev 3)
      ├── feature/phase-3-calc-headless (Dev 3)
      ├── feature/phase-4-diagram (Dev 4)
      └── feature/phase-5-password (Dev 4)
```

**Merge Order:**
1. Phase 0 → feature/react-migration
2. Phase 1 → feature/react-migration
3. Phase 2 → feature/react-migration (validation)
4. Phase 3 (all calculators) → feature/react-migration (after validation)
5. Phase 4 → feature/react-migration
6. Phase 5 → feature/react-migration
7. feature/react-migration → main (after full testing)

---

## 5. Testing Strategy

### 5.1 Manual Testing Checklist Per Phase

#### Phase 0: Setup & Foundation
- [ ] React loads without console errors
- [ ] AppContext provides state correctly
- [ ] Constants are accessible
- [ ] Utilities return correct values
- [ ] Vanilla JS still works unchanged
- [ ] No visual changes to UI

#### Phase 1: Shared Components
- [ ] Button renders and onClick works
- [ ] NumberInput accepts input and onChange fires
- [ ] Select renders options and onChange works
- [ ] Toggle switches and onChange fires
- [ ] TabBar renders and switches tabs
- [ ] ResultPanel displays results correctly
- [ ] All components styled identically to original

#### Phase 2: FAQ Tab
- [ ] FAQ questions render
- [ ] Clicking opens/closes answer
- [ ] Only one answer open at a time
- [ ] Styling matches original exactly
- [ ] Mobile responsive

#### Phase 3: Calculator Tabs (Per Calculator)
- [ ] Form renders with correct default values
- [ ] All inputs accept changes
- [ ] Calculate button triggers calculation
- [ ] Results display correctly
- [ ] Results match golden dataset
- [ ] Password-protected fields show/hide correctly
- [ ] Toggles work (scheduled, headless ultra)
- [ ] Info messages display when appropriate
- [ ] Edge cases handled (0, negative, huge numbers)

#### Phase 4: Diagram Tab
- [ ] Monaco Editor initializes
- [ ] Generate JSON button creates correct JSON
- [ ] JSON includes all calculator results
- [ ] Generate Diagram button renders diagram
- [ ] Diagram shows all organizations/snaplexes/nodes
- [ ] Arrows connect FM to JCC nodes
- [ ] Zoom and pan work
- [ ] Export works

#### Phase 5: Password Feature
- [ ] Clicking logo opens modal
- [ ] Wrong password shows error
- [ ] Correct password unlocks fields
- [ ] All calculators show/hide fields correctly
- [ ] Modal closes on overlay click

#### Phase 6: Final Testing
- [ ] All calculators produce identical results
- [ ] All interactions work smoothly
- [ ] No console errors
- [ ] No console warnings
- [ ] Performance is acceptable
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### 5.2 Regression Testing Approach

**Golden Dataset Testing:**
1. Before migration: Record all calculator outputs with specific inputs
2. After each phase: Run same inputs through migrated components
3. Compare outputs character-by-character
4. Document any deviations (even minor formatting)
5. Investigate and fix discrepancies before proceeding

**Automated Comparison Script:**
```javascript
// Save as test-regression.js (run in browser console)
const goldenData = { /* ... from golden-dataset.json */ };

function testTriggeredTask() {
    const input = goldenData.triggeredTask.inputs;
    const expected = goldenData.triggeredTask.expectedOutputs;
    
    // Set inputs
    document.getElementById('api-per-day').value = input.apiPerDay;
    // ... set other inputs
    
    // Click calculate
    document.querySelector('#tab1 button').click();
    
    // Parse results
    const results = parseResults('result');
    
    // Compare
    console.assert(results.haNodesRequired === expected.haNodesRequired, 
        `Expected ${expected.haNodesRequired}, got ${results.haNodesRequired}`);
}

// Run all tests
testTriggeredTask();
testUltraTask();
testScheduledTask();
testHeadlessUltraTask();
```

### 5.3 How to Verify Calculations Remain Accurate

**Strategy:**
1. **Preserve Original Functions Temporarily:**
   - Keep vanilla JS functions commented out
   - Run both old and new calculations side-by-side
   - Compare outputs programmatically

2. **Unit Test Approach (Manual):**
   ```javascript
   // Example validation
   function validateTriggeredCalculation() {
       const input = { apiPerDay: 833333, coverageHours: 24, peak: 150, responseTime: 1 };
       
       // Old formula (from line 497)
       const concurrentAPI_old = input.apiPerDay / input.coverageHours / 60 / 60 * (input.peak / 100);
       const nodesRequired_old = concurrentAPI_old / (20 / input.responseTime);
       const haNodes_old = Math.ceil(Math.max(nodesRequired_old * 1.3, 2));
       
       // New React calculation
       const result_new = calculateTriggeredTask(input);
       
       // Assert equality
       console.assert(haNodes_old === result_new.haNodesRequired, 
           `Old: ${haNodes_old}, New: ${result_new.haNodesRequired}`);
   }
   ```

3. **Edge Case Testing:**
   - Zero values: `apiPerDay: 0`
   - Maximum values: `apiPerDay: 999999999`
   - Decimal values: `peak: 123.45`
   - Minimum HA nodes: Inputs that result in <2 nodes

4. **Rounding Consistency:**
   - Document where `Math.ceil`, `Math.floor`, `Math.round` are used
   - Ensure React version uses identical rounding
   - Test boundary cases (e.g., 1.99999 vs 2.0)

### 5.4 Browser Testing Requirements

**Required Browsers:**
| Browser | Version | Priority | Notes |
|---------|---------|----------|-------|
| Chrome | Latest | P0 | Primary development browser |
| Firefox | Latest | P0 | Different rendering engine |
| Safari | Latest | P1 | macOS/iOS primary |
| Edge | Latest | P1 | Windows default |
| Chrome Mobile | Latest | P1 | Mobile testing |
| Safari iOS | Latest | P1 | iPad/iPhone |

**Testing Checklist Per Browser:**
- [ ] Page loads without errors
- [ ] All tabs render correctly
- [ ] Monaco Editor works
- [ ] Excalidraw renders
- [ ] All calculations produce same results
- [ ] Responsive layout works
- [ ] Touch interactions work (mobile)
- [ ] No visual glitches

**Known Browser Issues to Watch:**
- Monaco Editor: May have issues in older browsers
- Babel Standalone: Required for JSX, ensure it loads
- Excalidraw: Heavy library, test performance on mobile
- CSS Grid/Flexbox: Should work, but verify

---

## 6. Timeline Estimation

### 6.1 Breakdown by Phase

| Phase | Description | Estimated Hours | Calendar Days* | Dependencies |
|-------|-------------|-----------------|----------------|--------------|
| **Phase 0** | Setup & Foundation | 6-8 | 1-2 | None |
| **Phase 1** | Shared Components | 8-10 | 1-2 | Phase 0 ✓ |
| **Phase 2** | FAQ Tab | 3-4 | 0.5-1 | Phase 1 ✓ |
| **Phase 3.1** | Triggered Task Calc | 4-5 | 1 | Phase 1 ✓ |
| **Phase 3.2** | Ultra Task Calc | 5-6 | 1 | Phase 1 ✓ |
| **Phase 3.3** | Scheduled Task Calc | 5-6 | 1 | Phase 1 ✓ |
| **Phase 3.4** | Headless Ultra Calc | 6-7 | 1-2 | Phase 1 ✓ |
| **Phase 4** | Diagram Tab | 6-8 | 1-2 | Phase 0 ✓, Phase 3 ✓ |
| **Phase 5** | Password & Polish | 4-6 | 1 | All above ✓ |
| **Phase 6** | Final Testing & Deployment | 6-8 | 2-3 | All above ✓ |
| **TOTAL** | | **53-68 hours** | **10-15 days** | |

\* Calendar days assume 4-6 productive hours per day, with code reviews, testing, and coordination

### 6.2 Dependencies & Critical Path

**Critical Path:**
```
Phase 0 → Phase 1 → Phase 3 (all calculators) → Phase 4 → Phase 5 → Phase 6
```

**Parallel Opportunities:**
- Phase 2 (FAQ) can happen alongside early Phase 3 work
- Phase 3.1-3.4 can be parallelized with 2-3 developers
- Phase 4 can start after Phase 0 if diagram dev works independently

**Blocking Dependencies:**
- Phase 1 MUST complete before any Phase 3 work (shared components needed)
- Phase 3 MUST complete before Phase 4 (diagram needs calculator results)
- All phases MUST complete before Phase 6 (final testing)

### 6.3 Buffer Time

**Built-in Buffer:** ~15 hours (22% buffer)
- Unexpected bugs: 5 hours
- Code review revisions: 3 hours
- Integration issues: 3 hours
- Testing edge cases: 4 hours

**Risk Mitigation Buffer:** +10 hours (15% additional)
- Major refactor needed: 5 hours
- Browser compatibility issues: 3 hours
- Performance optimization: 2 hours

**Total with Buffer:** 53-68 hours (optimistic-realistic) + 15 hours (built-in) + 10 hours (risk) = **78-93 hours**

### 6.4 Total Estimated Duration

**Single Developer (Sequential):**
- 78-93 hours / 6 hours per day = **13-16 working days**
- With meetings, context switching, code reviews: **3-4 weeks**

**Team of 3 Developers (Parallel):**
- Phase 0-1: 2-3 days (sequential, foundation)
- Phase 2-5: 5-7 days (parallel work)
- Phase 6: 2-3 days (final testing)
- **Total: 2-3 weeks**

**Recommended Timeline:**
- **Week 1:** Phases 0, 1, 2 (foundation, components, FAQ validation)
- **Week 2:** Phase 3 (all calculators, parallel work)
- **Week 3:** Phases 4, 5, 6 (diagram, password, testing)
- **Week 4:** Buffer for issues, final validation, deployment

---

## 7. Rollback Strategy

### 7.1 Git Branching Strategy

**Branch Structure:**
```
main (production)
  │
  ├── v1.0-pre-migration (tag: backup before migration)
  │
  └── feature/react-migration (integration branch)
      ├── feature/phase-0-foundation
      ├── feature/phase-1-components
      ├── feature/phase-2-faq
      ├── feature/phase-3-calc-triggered
      ├── feature/phase-3-calc-ultra
      ├── feature/phase-3-calc-scheduled
      ├── feature/phase-3-calc-headless
      ├── feature/phase-4-diagram
      └── feature/phase-5-password
```

**Branching Commands:**
```bash
# Before starting migration
git checkout main
git tag v1.0-pre-migration
git push origin v1.0-pre-migration

# Create feature branch
git checkout -b feature/react-migration
git push -u origin feature/react-migration

# For each phase
git checkout feature/react-migration
git checkout -b feature/phase-0-foundation
# ... work on phase ...
git commit -m "Phase 0: ..."
git push origin feature/phase-0-foundation

# Create PR to feature/react-migration
# After review and merge, delete phase branch
```

### 7.2 How to Abort Migration if Needed

**Scenario 1: Issue Discovered in Early Phase (0-2)**
```bash
# Stop work, assess issue
git checkout feature/react-migration
git log --oneline  # Review what's been done

# If fixable quickly: fix and continue
# If major issue: abort phase
git reset --hard HEAD~N  # N = number of commits to undo
# Or just delete the phase branch and start over
git branch -D feature/phase-N-name
```

**Scenario 2: Issue Discovered in Mid-Migration (Phase 3-4)**
```bash
# Don't panic - main branch is untouched
# Assess if issue is fixable or requires redesign

# Option A: Fix in place
git checkout feature/react-migration
# ... fix issue ...
git commit -m "Fix: [description]"

# Option B: Rollback specific phase
git revert [commit-hash-of-problematic-phase]

# Option C: Pause migration, use old version
# Production continues on v1.0-pre-migration
git checkout v1.0-pre-migration
# Deploy this version while fixing migration
```

**Scenario 3: Critical Issue Discovered After Merge to Main**
```bash
# EMERGENCY ROLLBACK
git checkout main
git revert [merge-commit-hash]
git push origin main

# Or reset to pre-migration tag
git reset --hard v1.0-pre-migration
git push origin main --force  # Use with extreme caution

# Redeploy old version immediately
# Fix issues in feature branch before retry
```

### 7.3 Preservation of Current Working Version

**Strategy 1: Git Tags (Primary)**
```bash
# Tag current working version
git tag -a v1.0-pre-migration -m "Stable version before React migration"
git push origin v1.0-pre-migration

# To deploy tagged version
git checkout v1.0-pre-migration
# Deploy this version
```

**Strategy 2: Backup Branch (Secondary)**
```bash
# Create backup branch
git checkout main
git checkout -b backup/vanilla-js-version
git push origin backup/vanilla-js-version

# This branch is never modified, only for emergency restore
```

**Strategy 3: Archive Files (Tertiary)**
```bash
# Create archive of current working version
tar -czf snaplogic-calculator-v1.0-pre-migration.tar.gz index.html styles.css CLAUDE.md
# Store in safe location (S3, Google Drive, etc.)

# To restore
tar -xzf snaplogic-calculator-v1.0-pre-migration.tar.gz
```

**Rollback Decision Tree:**

```
Issue Discovered
    │
    ├─ Is main branch affected?
    │   ├─ YES → EMERGENCY ROLLBACK (git revert or reset)
    │   └─ NO → Continue below
    │
    ├─ Can be fixed in <2 hours?
    │   ├─ YES → Fix in place, continue
    │   └─ NO → Continue below
    │
    ├─ Does it block other work?
    │   ├─ YES → Pause migration, fix issue, resume
    │   └─ NO → Fix in parallel, continue other phases
    │
    └─ Is issue fundamental to approach?
        ├─ YES → ABORT MIGRATION, reassess strategy
        └─ NO → Rollback specific phase, re-approach

```

**Rollback Communication:**
1. Notify team immediately
2. Document issue in detail
3. Assess impact and timeline
4. Decide on rollback vs. fix
5. Communicate decision to stakeholders
6. Execute rollback if necessary
7. Conduct post-mortem

---

## 8. Post-Migration Tasks

### 8.1 Cleanup of Old Code

**Files to Clean:**
- `index.html` - Remove commented-out vanilla JS
- `styles.css` - Remove unused CSS classes (if any)

**Specific Cleanup Tasks:**

**Task 1: Remove Vanilla JS Functions (1 hour)**
```javascript
// DELETE these functions:
// - calculate() (line 489-518)
// - calculateUltra() (line 520-544)
// - calculateScheduled() (line 629-654)
// - calculateHeadlessUltra() (line 545-588)
// - toggleBatchMode() (line 590-603)
// - toggleMicrobatchingMode() (line 605-627)
// - toggleAnswer() (line 460-487)
// - showPopup() (line 656-659)
// - hidePopup() (line 661-664)
// - checkPassword() (line 666-688)
// - openTab() (line 312-331) - replaced by React TabBar
```

**Task 2: Remove Global State Variables (15 min)**
```javascript
// DELETE these globals (now in React Context):
// let isBatchSize = true;
// let isMicrobatching = true;
// let pLocked = true;
```

**Task 3: Remove Vanilla HTML (30 min)**
```html
<!-- DELETE these HTML sections: -->
<!-- Lines 37-142: All calculator tab HTML (now JSX) -->
<!-- Lines 156-263: FAQ HTML (now React component) -->
<!-- Lines 258-263: Password popup/overlay (now React component) -->
```

**Task 4: Clean Up Event Listeners (15 min)**
```javascript
// VERIFY no orphaned event listeners remain
// Search for: onclick=, addEventListener
// All should be React event handlers now
```

**Task 5: Remove Unused CSS (1 hour)**
```css
/* REVIEW styles.css for orphaned classes */
/* Example: .faq-icon if not used in React version */
/* Be cautious - keep all classes actually used */
```

### 8.2 Documentation Updates

**Update CLAUDE.md (2 hours)**

```markdown
# CLAUDE.md

## Project Overview (UPDATE)
This is a **SnapLogic Node Sizing Calculator** - a self-contained, single-page **React** application...

## Architecture (COMPLETE REWRITE)

### File Structure
- **index.html** (~800 lines): HTML shell with React app
- **styles.css** (~398 lines): All styling (unchanged)

### Technology Stack
- **React 17** - Full application framework
- **External CDN Dependencies**:
  - Monaco Editor (v0.30.1) - JSON editor with syntax highlighting
  - React 17 - Application framework
  - Excalidraw (v0.15.2) - Interactive diagram generation
  - Babel Standalone - For JSX transformation in browser

### React Architecture
The application is fully React-based with:

1. **Component Structure**:
   - `<MainApp>` - Root component
   - `<AppProvider>` - Context provider for global state
   - `<TabBar>` - Tab navigation
   - `<TriggeredTaskCalculator>` - Calculator for triggered tasks
   - `<UltraTaskCalculator>` - Calculator for ultra tasks
   - `<ScheduledTaskCalculator>` - Calculator for scheduled tasks
   - `<HeadlessUltraCalculator>` - Calculator for headless ultra tasks
   - `<DiagramTab>` - Diagram generation and display
   - `<FAQTab>` - Frequently asked questions
   - `<PasswordModal>` - Password protection UI

2. **Global State (AppContext)**:
   - `activeTab` - Current tab selection
   - `passwordUnlocked` - Advanced features visibility
   - `calculatorResults` - Results from all calculators (for diagram)

3. **Shared Components**:
   - `<Button>` - Standardized buttons
   - `<NumberInput>` - Labeled number inputs
   - `<Select>` - Dropdown with label
   - `<Toggle>` - Switch component
   - `<ResultPanel>` - Result display

## Running the Application (UNCHANGED)
... same as before ...

## Core Features & Implementation (UPDATE)

### Calculator Tabs (4 types)
Each calculator is a React component that:
1. Manages form state with `useState`
2. Implements calculation logic (formulas preserved exactly)
3. Stores results in global context
4. Displays results with `<ResultPanel>`

**Calculator Components:**
- `<TriggeredTaskCalculator>` - Calculation logic preserved from line 497
- `<UltraTaskCalculator>` - Calculation logic preserved from line 528
- `<ScheduledTaskCalculator>` - Calculation logic preserved from line 652
- `<HeadlessUltraCalculator>` - Calculation logic preserved from lines 564-595

### Diagram Generation System
**Workflow:**
1. User completes calculators → Results stored in AppContext
2. User clicks "Generate JSON" → Reads from Context (no DOM scraping)
3. JSON generated and displayed in Monaco Editor
4. User clicks "Generate Diagram" → Excalidraw renders

## Key Functions to Understand (UPDATE)

### React Components
- **`<MainApp>`** - Root component, renders tab-based layout
- **`<AppProvider>`** - Provides global state via Context API
- **Calculator Components** - Self-contained, manage own state
- **`<DiagramTab>`** - Integrates Monaco Editor and Excalidraw

### Utility Functions
- **`CalculatorUtils.calculateHANodes(nodes)`** - Applies HA multiplier
- **`CalculatorUtils.formatNumber(num, decimals)`** - Number formatting
- **`CalculatorUtils.rowsToGB(rows)`** - Row to GB conversion
- **`generateDiagramJson(calculatorResults)`** - Creates diagram JSON

### Constants
- **`CALCULATOR_CONSTANTS`** - All formulas and defaults
- **`PASSWORD`** - Password for advanced features
- **`TAB_CONFIG`** - Tab definitions
- **`FAQ_DATA`** - FAQ content

## Making Changes (UPDATE)

### Adding New Calculator Types
1. Create new calculator component following existing pattern
2. Add state to AppContext for results
3. Update `generateDiagramJson()` to include new results
4. Add tab to `TAB_CONFIG`
5. Update CALCULATOR_CONSTANTS

### Modifying Formulas
All calculation constants are in `CALCULATOR_CONSTANTS` object.
Formulas are in calculator components' `handleCalculate` functions.

### Modifying UI
- Shared components: Modify component, changes apply everywhere
- Specific calculator: Modify that component only
- Styling: Update `styles.css` (unchanged process)

## Testing Changes (NEW SECTION)
Since there's no automated test suite:
1. Run all calculators with known inputs
2. Verify results match expected values
3. Test all toggles and interactions
4. Test password unlock
5. Test diagram generation
6. Test on multiple browsers

## Component API Reference (NEW SECTION)

### `<NumberInput>`
```javascript
<NumberInput
  id="api-per-day"
  label="API requests per Day"
  value={apiPerDay}
  onChange={setApiPerDay}
  visible={true}  // optional, default true
  min={0}  // optional
  max={999999}  // optional
  step={1}  // optional
/>
```

... (document all components)

```

**Create New Documentation (1 hour):**

**File: `/docs/COMPONENT_API.md`**
- Document all React components
- Props, state, behavior
- Usage examples

**File: `/docs/MIGRATION_NOTES.md`**
- What changed in migration
- Lessons learned
- Known issues
- Future improvements

### 8.3 Performance Optimization Opportunities

**Optimization 1: Memoization (2 hours)**
```javascript
// Memoize expensive calculations
const TriggeredTaskCalculator = React.memo(function TriggeredTaskCalculator() {
    // ... component code
});

// Memoize calculation results
const calculationResult = useMemo(() => {
    return performExpensiveCalculation(inputs);
}, [inputs]);
```

**Optimization 2: Code Splitting (if ever adding build process)**
```javascript
// Lazy load Excalidraw (heavy library)
const DiagramTab = React.lazy(() => import('./DiagramTab'));

// Use Suspense
<Suspense fallback={<div>Loading...</div>}>
    <DiagramTab />
</Suspense>
```

**Optimization 3: Reduce Re-renders (1 hour)**
```javascript
// Use useCallback for stable function references
const handleCalculate = useCallback(() => {
    // ... calculation logic
}, [dependencies]);

// Split context to avoid unnecessary re-renders
const TabContext = createContext();  // Only tab state
const PasswordContext = createContext();  // Only password state
const ResultsContext = createContext();  // Only calculation results
```

**Optimization 4: Virtual Scrolling for Large Diagrams (Future)**
- Not needed for current use case
- Consider if diagrams get very large

### 8.4 Future Improvements Enabled by React

**Improvement 1: Component Library (4-8 hours)**
- Extract shared components to separate library
- Reuse across other SnapLogic tools
- Publish to npm (if desired)

**Improvement 2: Enhanced Error Handling (2-3 hours)**
```javascript
// Error boundaries for graceful degradation
class CalculatorErrorBoundary extends React.Component {
    componentDidCatch(error, errorInfo) {
        console.error("Calculator error:", error, errorInfo);
        this.setState({ hasError: true });
    }
    
    render() {
        if (this.state.hasError) {
            return <p>Calculator error. Please refresh and try again.</p>;
        }
        return this.props.children;
    }
}
```

**Improvement 3: State Persistence (2-3 hours)**
```javascript
// Save calculator inputs to localStorage
useEffect(() => {
    localStorage.setItem('calculatorInputs', JSON.stringify(inputs));
}, [inputs]);

// Restore on load
useEffect(() => {
    const saved = localStorage.getItem('calculatorInputs');
    if (saved) {
        setInputs(JSON.parse(saved));
    }
}, []);
```

**Improvement 4: Export/Import Configurations (3-4 hours)**
```javascript
// Export all calculator inputs as JSON
function exportConfiguration() {
    const config = {
        triggered: { /* inputs */ },
        ultra: { /* inputs */ },
        // ...
    };
    downloadJSON(config, 'snaplogic-sizing-config.json');
}

// Import configuration
function importConfiguration(file) {
    // Read JSON, populate all calculators
}
```

**Improvement 5: Unit Testing (8-10 hours)**
```javascript
// Now possible with React Testing Library
import { render, fireEvent } from '@testing-library/react';

test('triggered task calculates correctly', () => {
    const { getByLabelText, getByText } = render(<TriggeredTaskCalculator />);
    
    fireEvent.change(getByLabelText('API requests per Day'), { target: { value: '833333' }});
    fireEvent.click(getByText('Calculate'));
    
    expect(getByText(/HA Nodes Required: 2/)).toBeInTheDocument();
});
```

**Improvement 6: Accessibility (3-4 hours)**
```javascript
// Add ARIA labels
<button aria-label="Calculate triggered task sizing">Calculate</button>

// Keyboard navigation
<div role="tablist">
    <button role="tab" aria-selected={activeTab === 'tab1'}>Triggered Task</button>
</div>

// Screen reader announcements
<div role="status" aria-live="polite">
    {result && "Calculation complete"}
</div>
```

**Improvement 7: Animation & Polish (2-3 hours)**
```javascript
// Smooth transitions
<div className={`tab-content ${isActive ? 'fade-in' : 'fade-out'}`}>
    ...
</div>

// CSS
.fade-in {
    animation: fadeIn 0.3s ease-in;
}
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

**Improvement 8: Dark Mode (2-3 hours)**
```javascript
// Theme context
const ThemeContext = createContext();

function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    
    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            <div className={`app theme-${theme}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
```

---

## 9. Risk Assessment & Mitigation

### Risk Matrix

| Risk | Probability | Impact | Severity | Mitigation |
|------|-------------|--------|----------|------------|
| Calculation regression | MEDIUM | HIGH | 🔴 CRITICAL | Golden dataset validation, side-by-side testing |
| Browser compatibility | LOW | MEDIUM | 🟡 MODERATE | Cross-browser testing, polyfills if needed |
| Performance degradation | LOW | MEDIUM | 🟡 MODERATE | Performance benchmarking, optimization |
| Timeline overrun | MEDIUM | LOW | 🟢 LOW | Buffer time included, parallel work |
| Developer learning curve | MEDIUM | LOW | 🟢 LOW | Training, documentation, pair programming |
| Breaking diagram feature | LOW | HIGH | 🟡 MODERATE | Preserve exact Excalidraw logic, extensive testing |
| Password feature regression | LOW | MEDIUM | 🟡 MODERATE | Test all conditional displays |
| Monaco Editor issues | LOW | MEDIUM | 🟡 MODERATE | Test Monaco integration early |

### Mitigation Strategies

**For Calculation Regression:**
- Create comprehensive golden dataset before starting
- Preserve original formulas exactly (copy-paste, then refactor)
- Side-by-side testing (run both old and new, compare)
- Multiple reviewers validate calculations
- Test edge cases (0, negative, huge numbers, decimals)

**For Browser Compatibility:**
- Test early and often in all target browsers
- Use established React patterns (avoid experimental features)
- Babel transpilation ensures JSX compatibility
- CDN libraries are battle-tested

**For Performance:**
- Benchmark before migration (baseline)
- Benchmark after each phase
- Use React DevTools Profiler
- Optimize only if needed (premature optimization = bad)

**For Timeline:**
- 22% buffer built into estimates
- Parallel work where possible
- Daily standups to catch blockers early
- Flexible phase boundaries (can adjust scope)

**For Developer Learning:**
- Provide React training resources
- Pair programming for first calculator
- Code review with feedback
- Documentation for patterns

---

## 10. Success Criteria

### Migration Considered Successful When:

**Functional:**
- [ ] All 4 calculators produce identical results to original (verified with golden dataset)
- [ ] Diagram generation works identically
- [ ] FAQ tab works identically
- [ ] Password feature works identically
- [ ] All toggles work correctly
- [ ] All tabs switch correctly
- [ ] Monaco Editor works
- [ ] Excalidraw diagram renders correctly

**Technical:**
- [ ] Zero vanilla JS remains (except initialization code)
- [ ] All code is React components
- [ ] Global state managed by Context API
- [ ] No DOM manipulation (getElementById, etc.)
- [ ] Clean, documented code
- [ ] No console errors
- [ ] No console warnings

**Performance:**
- [ ] Page load time ≤ original
- [ ] Calculation speed ≤ original
- [ ] Diagram render time ≤ original
- [ ] No jank or lag

**Browser Compatibility:**
- [ ] Works in Chrome (latest)
- [ ] Works in Firefox (latest)
- [ ] Works in Safari (latest)
- [ ] Works in Edge (latest)
- [ ] Works on mobile (iOS Safari, Chrome Android)

**Documentation:**
- [ ] CLAUDE.md updated
- [ ] Component API documented
- [ ] Migration notes captured
- [ ] Code comments added

**Deployment:**
- [ ] Code reviewed and approved
- [ ] Merged to main branch
- [ ] Tagged as v2.0-full-react
- [ ] Deployed to production
- [ ] Monitored for 48 hours (no issues)

---

## 11. Conclusion

This migration strategy provides a comprehensive, low-risk approach to converting the SnapLogic Node Sizing Calculator from a hybrid vanilla JS/React application to a fully React-based architecture while maintaining the critical constraint of no build process.

**Key Success Factors:**
1. **Incremental approach** - Minimize risk, enable rollback
2. **Golden dataset validation** - Ensure calculation accuracy
3. **Comprehensive testing** - Catch issues early
4. **Clear phase boundaries** - Enable parallel work
5. **Strong rollback strategy** - Safety net if needed
6. **Thorough documentation** - Enable future maintenance

**Timeline Summary:**
- **Solo Developer:** 3-4 weeks
- **Team of 3:** 2-3 weeks

**Expected Outcome:**
A maintainable, well-structured React application with zero functional regression and significant improvements in code quality and developer experience.

---

**Document Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-08 | Technical Program Manager | Initial draft |

**Approval:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Tech Lead | | | |
| Product Owner | | | |
| QA Lead | | | |

---

**End of Migration Strategy Document**
