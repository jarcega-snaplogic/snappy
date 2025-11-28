# React Component Specification Document
## SnapLogic Node Sizing Calculator Migration

**Version:** 1.0  
**Date:** 2025-11-08  
**Status:** Design Specification

---

## Table of Contents

1. [Overview](#overview)
2. [Component Inventory](#component-inventory)
3. [Component Hierarchy](#component-hierarchy)
4. [Core Components](#core-components)
5. [Shared Components](#shared-components)
6. [Custom Hooks](#custom-hooks)
7. [Component Patterns](#component-patterns)
8. [Reusability Strategy](#reusability-strategy)
9. [State Management](#state-management)
10. [Migration Notes](#migration-notes)

---

## Overview

This document specifies the React component architecture for migrating the SnapLogic Node Sizing Calculator from vanilla JavaScript to React. The migration maintains the single HTML file structure with CDN dependencies while modernizing the codebase with a component-based architecture.

### Goals
- Modular, reusable component structure
- Type-safe props interfaces (using PropTypes or TypeScript comments)
- Shared calculation logic across similar calculators
- Maintainable state management
- Preserve all existing functionality

### Constraints
- Must remain single HTML file
- CDN dependencies only
- No build process
- Preserve existing Monaco Editor and Excalidraw integrations

---

## Component Inventory

### Core Components (8)
1. **App** - Root application component
2. **TabNavigation** - Tab switching UI
3. **TriggeredTaskCalculator** - Calculator for triggered tasks
4. **UltraTaskCalculator** - Calculator for ultra tasks
5. **ScheduledTaskCalculator** - Calculator for scheduled tasks
6. **HeadlessUltraCalculator** - Calculator for headless ultra tasks
7. **DiagramTab** - Monaco editor + Excalidraw integration
8. **FAQTab** - Collapsible FAQ list

### Shared/Reusable Components (10)
9. **CalculatorLayout** - Wrapper layout for all calculators
10. **FormField** - Reusable input field with label
11. **SelectField** - Reusable select dropdown
12. **Toggle** - Reusable toggle switch component
13. **Button** - Reusable button component
14. **ResultDisplay** - Calculator results presentation
15. **PasswordModal** - Password unlock modal
16. **Logo** - SnapLogic logo with click handler
17. **FAQItem** - Single collapsible FAQ entry
18. **InfoBanner** - Info message display (e.g., "Consider Ultra Pipeline")

### Container/Layout Components (3)
19. **TabContent** - Wrapper for tab content panels
20. **MainContainer** - Main application container
21. **Footer** - Disclaimer footer

### Integration Components (2)
22. **MonacoEditor** - Monaco editor wrapper
23. **ExcalidrawDiagram** - Excalidraw wrapper

**Total Components: ~23**

---

## Component Hierarchy

```
App
├── MainContainer
│   ├── Logo
│   ├── Header (h1 + description)
│   ├── TabNavigation
│   ├── TabContent
│   │   ├── TriggeredTaskCalculator
│   │   │   └── CalculatorLayout
│   │   │       ├── FormField (x4)
│   │   │       ├── Button
│   │   │       └── ResultDisplay
│   │   │           └── InfoBanner (conditional)
│   │   ├── UltraTaskCalculator
│   │   │   └── CalculatorLayout
│   │   │       ├── FormField (x4)
│   │   │       ├── Button
│   │   │       └── ResultDisplay
│   │   ├── ScheduledTaskCalculator
│   │   │   └── CalculatorLayout
│   │   │       ├── FormField (x2)
│   │   │       ├── Toggle
│   │   │       ├── SelectField (conditional)
│   │   │       ├── Button
│   │   │       └── ResultDisplay
│   │   ├── HeadlessUltraCalculator
│   │   │   └── CalculatorLayout
│   │   │       ├── FormField (x4)
│   │   │       ├── Toggle
│   │   │       ├── Button
│   │   │       └── ResultDisplay
│   │   ├── DiagramTab
│   │   │   ├── MonacoEditor
│   │   │   ├── Button ("Generate JSON")
│   │   │   ├── Button ("Generate Diagram")
│   │   │   └── ExcalidrawDiagram
│   │   └── FAQTab
│   │       └── FAQItem (x7)
│   └── Footer
└── PasswordModal
```

---

## Core Components

### 1. App

**File Location:** Embedded in index.html `<script type="text/babel">`

**Responsibilities:**
- Root application component
- Manage global application state
- Provide context to child components
- Handle password authentication state
- Coordinate tab state

**Props:**
- None (root component)

**State:**
```javascript
{
  activeTab: string,              // 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5' | 'tab6'
  isPasswordUnlocked: boolean,    // Password protection state
  calculatorResults: {            // Store all calculator results
    triggered: object | null,
    ultra: object | null,
    scheduled: object | null,
    headlessUltra: object | null
  },
  isDiagramTabActive: boolean     // For body class management
}
```

**Methods/Handlers:**
- `handleTabChange(tabId: string) => void` - Switch active tab
- `handlePasswordUnlock() => void` - Unlock password-protected features
- `handleCalculatorResult(type: string, result: object) => void` - Store calculator results
- `getDiagramJSON() => object` - Generate JSON for diagram from all results

**Context Provided:**
```javascript
AppContext = {
  isPasswordUnlocked: boolean,
  calculatorResults: object,
  setCalculatorResult: function,
  activeTab: string
}
```

**Lifecycle:**
- `useEffect` to manage body class for diagram tab (`diagram-tab-active`)
- `useEffect` to handle window resize for diagram tab height

**Example Structure:**
```javascript
function App() {
  const [activeTab, setActiveTab] = useState('tab1');
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(false);
  const [calculatorResults, setCalculatorResults] = useState({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const contextValue = {
    isPasswordUnlocked,
    calculatorResults,
    setCalculatorResult: (type, result) => {
      setCalculatorResults(prev => ({ ...prev, [type]: result }));
    },
    activeTab
  };

  return (
    <AppContext.Provider value={contextValue}>
      <MainContainer isDiagramTabActive={activeTab === 'tab5'}>
        <Logo onClick={() => setShowPasswordModal(true)} />
        <h1>Node Sizing Calculator</h1>
        <TabNavigation 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
        <TabContent activeTab={activeTab} />
        <Footer />
      </MainContainer>
      {showPasswordModal && (
        <PasswordModal 
          onClose={() => setShowPasswordModal(false)}
          onUnlock={() => {
            setIsPasswordUnlocked(true);
            setShowPasswordModal(false);
          }}
        />
      )}
    </AppContext.Provider>
  );
}
```

---

### 2. TabNavigation

**Responsibilities:**
- Render tab buttons
- Handle tab switching
- Highlight active tab

**Props:**
```javascript
{
  activeTab: string,           // Currently active tab ID
  onTabChange: (tabId) => void // Tab change handler
}
```

**State:**
- None (controlled component)

**Tab Configuration:**
```javascript
const tabs = [
  { id: 'tab1', label: 'Triggered Task' },
  { id: 'tab2', label: 'Ultra Task' },
  { id: 'tab3', label: 'Scheduled Task' },
  { id: 'tab4', label: 'Headless Ultra Task' },
  { id: 'tab5', label: 'Diagram' },
  { id: 'tab6', label: 'FAQ' }
];
```

**Example Structure:**
```javascript
function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="tabs">
      {tabs.map(tab => (
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
```

---

### 3. TriggeredTaskCalculator

**Responsibilities:**
- Render form for triggered task inputs
- Calculate concurrent API and nodes required
- Display results
- Show recommendation for Ultra Pipeline when nodes > 6

**Props:**
```javascript
{
  isPasswordUnlocked: boolean,    // Show advanced fields
  onResultCalculated: (result) => void  // Callback with results
}
```

**State:**
```javascript
{
  formData: {
    apiPerDay: number,           // Default: 833333
    coverageHours: number,       // Default: 24
    apiResponseTime: number,     // Default: 1 (hidden unless unlocked)
    peak: number                 // Default: 150
  },
  result: {
    concurrentAPI: number,
    nodesRequired: number,
    haNodesRequired: number
  } | null
}
```

**Calculation Formula:**
```javascript
concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)
nodesRequired = concurrentAPI / (20 / apiExecutionTime)
haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2))
```

**Constants:**
- `TPS_PER_NODE = 20` (transactions per second per node)
- `HA_MULTIPLIER = 1.3`
- `MIN_HA_NODES = 2`
- `ULTRA_RECOMMENDATION_THRESHOLD = 6`

**Child Components:**
- CalculatorLayout
- FormField (x4)
- Button
- ResultDisplay
- InfoBanner (conditional)

**Methods:**
- `handleInputChange(field: string, value: number) => void`
- `handleCalculate() => void`
- `calculateResults(formData) => object`

**Example Structure:**
```javascript
function TriggeredTaskCalculator({ isPasswordUnlocked, onResultCalculated }) {
  const [formData, setFormData] = useState({
    apiPerDay: 833333,
    coverageHours: 24,
    apiResponseTime: 1,
    peak: 150
  });
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const concurrentAPI = formData.apiPerDay / formData.coverageHours / 60 / 60 * (formData.peak / 100);
    const nodesRequired = concurrentAPI / (20 / formData.apiResponseTime);
    const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));
    
    const calculatedResult = { concurrentAPI, nodesRequired, haNodesRequired };
    setResult(calculatedResult);
    onResultCalculated(calculatedResult);
  };

  return (
    <CalculatorLayout description="This calculator helps in sizing for triggered tasks with the assumption of an average execution time of 1 second.">
      <FormField 
        label="API requests per Day"
        type="number"
        value={formData.apiPerDay}
        onChange={(value) => setFormData(prev => ({ ...prev, apiPerDay: value }))}
      />
      {/* ... more fields ... */}
      <Button onClick={handleCalculate}>Calculate</Button>
      {result && (
        <>
          <ResultDisplay result={result} />
          {result.haNodesRequired > 6 && (
            <InfoBanner message="Consider looking into SnapLogic Ultra Pipeline for better performance." />
          )}
        </>
      )}
    </CalculatorLayout>
  );
}
```

---

### 4. UltraTaskCalculator

**Responsibilities:**
- Calculate ultra task sizing (execution + FeedMaster nodes)
- Handle dual node type calculations
- Display both execution and FM node requirements

**Props:**
```javascript
{
  isPasswordUnlocked: boolean,
  onResultCalculated: (result) => void
}
```

**State:**
```javascript
{
  formData: {
    apiPerDay: number,           // Default: 416667
    coverageHours: number,       // Default: 12
    apiResponseTime: number,     // Default: 0.3
    peak: number                 // Default: 150
  },
  result: {
    concurrentAPI: number,
    executionNodesRequired: number,
    haExecutionNodes: number,
    fmNodesRequired: number,
    haFmNodes: number
  } | null
}
```

**Calculation Formula:**
```javascript
concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)
executionNodesRequired = concurrentAPI / (100 / apiExecutionTime)
haExecutionNodes = Math.max(Math.ceil(executionNodesRequired * 1.3), 2)
fmNodesRequired = concurrentAPI / (200 / apiExecutionTime)
haFmNodes = Math.max(Math.ceil(fmNodesRequired * 1.3), 2)
```

**Constants:**
- `EXECUTION_TPS_PER_NODE = 100`
- `FM_TPS_PER_NODE = 200`
- `HA_MULTIPLIER = 1.3`
- `MIN_HA_NODES = 2`

**Result Display Fields:**
- API per second
- Execution Nodes Required (raw + HA)
- FeedMaster Nodes Required (raw + HA)

---

### 5. ScheduledTaskCalculator

**Responsibilities:**
- Calculate batch processing node requirements
- Toggle between GB and row count modes
- Handle transformation complexity multiplier
- Convert rows to GB when needed

**Props:**
```javascript
{
  isPasswordUnlocked: boolean,
  onResultCalculated: (result) => void
}
```

**State:**
```javascript
{
  formData: {
    batchSize: number,           // Default: 300 (GB) or 1500000000 (rows)
    processTime: number,         // Default: 12 (hours)
    complexityMultiplier: number // Default: 1 (hidden unless unlocked)
  },
  isBatchSize: boolean,          // true = GB mode, false = row mode
  result: {
    mbPerMinute: number,
    nodesRequired: number,
    haNodesRequired: number
  } | null
}
```

**Calculation Formula:**
```javascript
// Convert rows to GB if needed
batchSizeGB = isBatchSize 
  ? batchSize 
  : batchSize * 2000 / 10000000000

mbPerMinute = (batchSizeGB * 1024) / (processTime * 60)
nodesRequired = mbPerMinute * complexityMultiplier / 300
haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2))
```

**Constants:**
- `MB_PER_MINUTE_PER_NODE = 300`
- `ROW_SIZE_BYTES = 2000`
- `HA_MULTIPLIER = 1.3`
- `MIN_HA_NODES = 2`
- `DEFAULT_GB = 300`
- `DEFAULT_ROWS = 1500000000`

**Toggle Behavior:**
- When toggled: swap between GB/rows mode
- Update label text
- Update default value
- Recalculate if result exists

**Complexity Multiplier Options:**
```javascript
[
  { value: 1, label: 'straight pass through' },
  { value: 1.25, label: 'few sorts/aggregations' },
  { value: 1.5, label: 'moderate sorts/aggregations' },
  { value: 2, label: 'many sorts/aggregations' }
]
```

---

### 6. HeadlessUltraCalculator

**Responsibilities:**
- Calculate headless ultra task sizing
- Toggle between microbatching and non-microbatching modes
- Handle two different calculation methods
- Conditionally show message size or event response time

**Props:**
```javascript
{
  isPasswordUnlocked: boolean,
  onResultCalculated: (result) => void
}
```

**State:**
```javascript
{
  formData: {
    eventPerDay: number,         // Default: 20000000
    coverageHours: number,       // Default: 24
    eventResponseTime: number,   // Default: 0.3 (for microbatching)
    eventSize: number,           // Default: 2000 bytes (for non-microbatching)
    peak: number                 // Default: 150
  },
  isMicrobatching: boolean,      // Default: true
  result: {
    // Microbatching mode:
    eventPerSecond: number,
    executionNodesRequired: number,
    haExecutionNodes: number,
    // OR Non-microbatching mode:
    eventPerMinute: number,
    mbPerMinute: number,
    executionNodesRequired: number,
    haExecutionNodes: number
  } | null
}
```

**Calculation Formula (Microbatching):**
```javascript
concurrentEvent = eventPerDay / coverageHours / 60 / 60 * (peak / 100)
nodesRequired = concurrentEvent / (100 / eventExecutionTime)
haNodesRequired = Math.max(Math.ceil(nodesRequired * 1.3), 2)
```

**Calculation Formula (Non-Microbatching):**
```javascript
batchSizeGB = (eventSize * eventPerDay) / 10000000000
concurrentEvent = eventPerDay / coverageHours / 60 * (peak / 100)
mbPerMinute = ((batchSizeGB * 1024) / (coverageHours * 60)) * (peak / 100)
nodesRequired = mbPerMinute * complexityMultiplier / 150
haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2))
```

**Constants:**
- `MICROBATCHING_TPS_PER_NODE = 100`
- `NON_MICROBATCHING_MB_PER_MIN = 150`
- `HA_MULTIPLIER = 1.3`
- `MIN_HA_NODES = 2`
- `COMPLEXITY_MULTIPLIER = 1` (hardcoded)

**Toggle Behavior:**
- Show/hide `eventResponseTime` vs `eventSize` based on mode
- Update calculation method
- Recalculate if result exists

**Child Components:**
- CalculatorLayout
- FormField (x4, with conditional visibility)
- Toggle
- Button
- ResultDisplay

---

### 7. DiagramTab

**Responsibilities:**
- Render Monaco editor for JSON input/editing
- Generate JSON from all calculator results
- Render Excalidraw diagram
- Coordinate between JSON generation and diagram rendering

**Props:**
```javascript
{
  calculatorResults: object,     // All calculator results from context
  isActive: boolean              // Whether tab is active (for height calculation)
}
```

**State:**
```javascript
{
  jsonValue: string,             // Current JSON in editor
  error: string | null           // Error message if any
}
```

**Methods:**
- `handleGenerateJSON() => void` - Generate JSON from calculator results
- `handleGenerateDiagram() => void` - Parse JSON and create Excalidraw elements
- `buildDiagramJSON(results) => object` - Build JSON structure from results
- `parseAndVisualize(json) => void` - Parse JSON and create diagram

**Diagram JSON Structure:**
```javascript
[
  {
    "ControlPlane": "US",        // or "EMEA"
    "OrgName": "MyOrg-prod",
    "Snaplex": [
      {
        "name": "real-time",     // or "scheduled", "headless-ultra"
        "type": "cloudplex",     // or "groundplex"
        "nodes": [
          { "type": "JCC", "size": "m" },
          { "type": "FM", "size": "m" }
        ]
      }
    ]
  }
]
```

**JSON Generation Logic:**
```javascript
- If no calculations performed: return message
- Combine triggered + ultra execution nodes into "real-time" snaplex
- Add ultra FM nodes to "real-time" snaplex
- Create separate "scheduled" snaplex if scheduledNodes > 0
- Create separate "headless-ultra" snaplex if headlessUltraNodes > 0
```

**Child Components:**
- MonacoEditor
- Button ("Generate JSON")
- Button ("Generate Diagram")
- ExcalidrawDiagram

**Layout:**
```
+----------------------------------+
|  JSON Panel (500px)  | Diagram  |
|  +-----------------+ |          |
|  | Monaco Editor   | |          |
|  |                 | |          |
|  +-----------------+ |          |
|  [ Generate JSON ]  |          |
|  [ Generate Diagram]|          |
+----------------------------------+
```

**Example Structure:**
```javascript
function DiagramTab({ calculatorResults, isActive }) {
  const [jsonValue, setJsonValue] = useState('');
  const [error, setError] = useState(null);
  const monacoEditorRef = useRef(null);

  const handleGenerateJSON = () => {
    const json = buildDiagramJSON(calculatorResults);
    const formatted = JSON.stringify(json, null, 2);
    setJsonValue(formatted);
    if (monacoEditorRef.current) {
      monacoEditorRef.current.setValue(formatted);
    }
  };

  return (
    <div className="diagramator-container">
      <div className="json-input-panel">
        <MonacoEditor 
          ref={monacoEditorRef}
          value={jsonValue}
          onChange={setJsonValue}
        />
        <Button onClick={handleGenerateJSON}>Generate JSON</Button>
        <Button onClick={handleGenerateDiagram}>Generate Diagram</Button>
      </div>
      <div className="diagram-output">
        <ExcalidrawDiagram 
          jsonInput={jsonValue}
          onError={setError}
        />
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
```

---

### 8. FAQTab

**Responsibilities:**
- Render list of FAQ items
- Manage which FAQ is expanded (accordion behavior)
- Close other FAQs when one opens

**Props:**
```javascript
{} // No props needed
```

**State:**
```javascript
{
  openFaqId: string | null       // ID of currently open FAQ
}
```

**FAQ Data Structure:**
```javascript
const faqData = [
  {
    id: 'faq-1',
    question: 'What are the nodes?',
    answer: 'Nodes in SnapLogic are...'
  },
  // ... 7 total FAQs
];
```

**FAQ Content:**
1. What are the nodes?
2. What are feedmaster nodes?
3. Are there different sizes for nodes? Which are the available sizes?
4. Will the node sizing calculator recommend different node sizes?
5. What are memory optimized nodes?
6. Can SnapLogic be deployed with auto-scaling? How?
7. What are the recommended EC2 instance types? How about Azure and GCP?

**Behavior:**
- Click question to toggle answer
- Only one FAQ open at a time (accordion)
- Smooth transition animations

**Child Components:**
- FAQItem (x7)

**Example Structure:**
```javascript
function FAQTab() {
  const [openFaqId, setOpenFaqId] = useState(null);

  const handleToggle = (faqId) => {
    setOpenFaqId(openFaqId === faqId ? null : faqId);
  };

  return (
    <div>
      <h2>Frequently Asked Questions</h2>
      {faqData.map(faq => (
        <FAQItem 
          key={faq.id}
          question={faq.question}
          answer={faq.answer}
          isOpen={openFaqId === faq.id}
          onToggle={() => handleToggle(faq.id)}
        />
      ))}
    </div>
  );
}
```

---

## Shared Components

### 9. CalculatorLayout

**Responsibilities:**
- Provide consistent layout wrapper for all calculators
- Display calculator description
- Wrap form and result area

**Props:**
```javascript
{
  description: string,           // Calculator description text
  children: ReactNode            // Form fields, buttons, results
}
```

**State:**
- None

**Example Structure:**
```javascript
function CalculatorLayout({ description, children }) {
  return (
    <div className="calculator-content">
      <p>{description}</p>
      <form onSubmit={(e) => e.preventDefault()}>
        {children}
      </form>
    </div>
  );
}
```

---

### 10. FormField

**Responsibilities:**
- Render labeled input field
- Handle number input with validation
- Support conditional visibility

**Props:**
```javascript
{
  label: string,                 // Field label
  type: 'number' | 'text',       // Input type
  value: number | string,        // Current value
  onChange: (value) => void,     // Change handler
  visible: boolean,              // Default: true
  id: string,                    // Optional: for label association
  min: number,                   // Optional: min value
  max: number,                   // Optional: max value
  step: number                   // Optional: step increment
}
```

**State:**
- None (controlled component)

**Example Structure:**
```javascript
function FormField({ label, type, value, onChange, visible = true, id, ...rest }) {
  if (!visible) return null;

  const inputId = id || `field-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <>
      <label htmlFor={inputId}>{label}</label>
      <input 
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        {...rest}
      />
    </>
  );
}
```

---

### 11. SelectField

**Responsibilities:**
- Render labeled select dropdown
- Support option list
- Handle selection changes

**Props:**
```javascript
{
  label: string,                 // Field label
  value: any,                    // Current selected value
  options: Array<{               // Options list
    value: any,
    label: string
  }>,
  onChange: (value) => void,     // Change handler
  visible: boolean,              // Default: true
  id: string                     // Optional: for label association
}
```

**State:**
- None (controlled component)

**Example Structure:**
```javascript
function SelectField({ label, value, options, onChange, visible = true, id }) {
  if (!visible) return null;

  const selectId = id || `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <>
      <label htmlFor={selectId}>{label}</label>
      <select 
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </>
  );
}
```

---

### 12. Toggle

**Responsibilities:**
- Render toggle switch with label
- Handle on/off state
- Provide visual feedback

**Props:**
```javascript
{
  label: string,                 // Toggle label
  checked: boolean,              // Current state
  onChange: (checked) => void,   // Change handler
  id: string                     // Optional: for input association
}
```

**State:**
- None (controlled component)

**Styling:**
- Uses existing CSS classes: `.toggle-container`, `.toggle-switch`, `.slider`

**Example Structure:**
```javascript
function Toggle({ label, checked, onChange, id }) {
  const toggleId = id || `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="toggle-container">
      <label htmlFor={toggleId} className="toggle-label">
        {label}
      </label>
      <label className="toggle-switch">
        <input 
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}
```

---

### 13. Button

**Responsibilities:**
- Render styled button
- Handle click events
- Support disabled state

**Props:**
```javascript
{
  children: ReactNode,           // Button text/content
  onClick: () => void,           // Click handler
  disabled: boolean,             // Default: false
  type: 'button' | 'submit',     // Default: 'button'
  className: string              // Optional: additional classes
}
```

**State:**
- None

**Example Structure:**
```javascript
function Button({ children, onClick, disabled = false, type = 'button', className = '' }) {
  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}
```

---

### 14. ResultDisplay

**Responsibilities:**
- Display calculation results in consistent format
- Format numbers to 2 decimal places
- Handle null/undefined results

**Props:**
```javascript
{
  result: object,                // Result object with various fields
  fields: Array<{                // Field definitions
    key: string,
    label: string,
    format: 'number' | 'integer' // Default: 'number'
  }>
}
```

**State:**
- None

**Example Structure:**
```javascript
function ResultDisplay({ result, fields }) {
  if (!result) return null;

  return (
    <div className="result">
      <h2>Results</h2>
      {fields.map(field => {
        const value = result[field.key];
        const formatted = field.format === 'integer' 
          ? Math.ceil(value)
          : value.toFixed(2);
        
        return (
          <p key={field.key}>
            {field.label}: {formatted}
          </p>
        );
      })}
    </div>
  );
}
```

**Usage Example:**
```javascript
<ResultDisplay 
  result={result}
  fields={[
    { key: 'concurrentAPI', label: 'Concurrent API' },
    { key: 'nodesRequired', label: 'Nodes Required' },
    { key: 'haNodesRequired', label: 'HA Nodes Required', format: 'integer' }
  ]}
/>
```

---

### 15. PasswordModal

**Responsibilities:**
- Display password entry modal
- Validate password
- Handle unlock/cancel actions
- Show overlay backdrop

**Props:**
```javascript
{
  onClose: () => void,           // Close modal handler
  onUnlock: () => void           // Successful unlock handler
}
```

**State:**
```javascript
{
  password: string,              // Current password input
  error: string | null           // Error message
}
```

**Constants:**
```javascript
const CORRECT_PASSWORD = 'snapLogic4snapLogic';
```

**Methods:**
- `handleSubmit() => void` - Validate password and unlock
- `handleClose() => void` - Close modal without unlocking

**Example Structure:**
```javascript
function PasswordModal({ onClose, onUnlock }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = () => {
    if (password === 'snapLogic4snapLogic') {
      onUnlock();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <>
      <div className="overlay" onClick={onClose}></div>
      <div className="popup">
        <h2>Enter Password</h2>
        <input 
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {error && <p className="error">{error}</p>}
        <Button onClick={handleSubmit}>Submit</Button>
      </div>
    </>
  );
}
```

---

### 16. Logo

**Responsibilities:**
- Display SnapLogic logo
- Handle click to show password modal

**Props:**
```javascript
{
  onClick: () => void            // Click handler
}
```

**State:**
- None

**Example Structure:**
```javascript
function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick}>
      <img 
        src="https://www.snaplogic.com/wp-content/uploads/2022/09/SL_logo_blue_web.png" 
        alt="SnapLogic Logo"
      />
    </div>
  );
}
```

---

### 17. FAQItem

**Responsibilities:**
- Render single FAQ question/answer
- Handle expand/collapse animation
- Show/hide answer based on open state

**Props:**
```javascript
{
  question: string,              // FAQ question
  answer: string | ReactNode,    // FAQ answer (can include HTML)
  isOpen: boolean,               // Whether this FAQ is open
  onToggle: () => void           // Toggle handler
}
```

**State:**
- None (controlled component)

**Example Structure:**
```javascript
function FAQItem({ question, answer, isOpen, onToggle }) {
  return (
    <div className={`faq-item ${isOpen ? 'active' : ''}`}>
      <div className="faq-question" onClick={onToggle}>
        {question}
      </div>
      {isOpen && (
        <div className="faq-answer">
          {typeof answer === 'string' 
            ? <div dangerouslySetInnerHTML={{ __html: answer }} />
            : answer
          }
        </div>
      )}
    </div>
  );
}
```

---

### 18. InfoBanner

**Responsibilities:**
- Display informational message
- Support links
- Styled as info/notice

**Props:**
```javascript
{
  message: string | ReactNode,   // Message to display
  link: {                        // Optional: link object
    url: string,
    text: string
  }
}
```

**State:**
- None

**Example Structure:**
```javascript
function InfoBanner({ message, link }) {
  return (
    <p className="info">
      {message}
      {link && (
        <>
          {' '}
          <a href={link.url} target="_blank" rel="noopener noreferrer">
            {link.text}
          </a>
        </>
      )}
    </p>
  );
}
```

**Usage Example:**
```javascript
<InfoBanner 
  message="Consider looking into"
  link={{
    url: "https://www.snaplogic.com/resources/data-sheets/snaplogic-ultra-pipelines",
    text: "SnapLogic Ultra Pipeline"
  }}
/>
```

---

### 19-21. Layout Components

**MainContainer:**
```javascript
function MainContainer({ children, isDiagramTabActive }) {
  useEffect(() => {
    if (isDiagramTabActive) {
      document.body.classList.add('diagram-tab-active');
    } else {
      document.body.classList.remove('diagram-tab-active');
    }
    return () => document.body.classList.remove('diagram-tab-active');
  }, [isDiagramTabActive]);

  return <div className="main-container">{children}</div>;
}
```

**TabContent:**
```javascript
function TabContent({ activeTab }) {
  return (
    <>
      <div id="tab1" className={`tab-content ${activeTab === 'tab1' ? 'active' : ''}`}>
        <TriggeredTaskCalculator />
      </div>
      {/* ... other tabs ... */}
    </>
  );
}
```

**Footer:**
```javascript
function Footer() {
  return (
    <footer>
      <p>
        <b>Disclaimer: </b>
        The SnapLogic Sizing Calculator provides estimations based on user inputs and general assumptions...
      </p>
    </footer>
  );
}
```

---

### 22. MonacoEditor

**Responsibilities:**
- Initialize Monaco editor instance
- Manage editor value
- Handle editor configuration
- Forward ref for parent access

**Props:**
```javascript
{
  value: string,                 // Initial/controlled value
  onChange: (value) => void,     // Change handler
  language: string,              // Default: 'json'
  theme: string,                 // Default: 'vs-light'
  height: string,                // Default: 'calc(100% - 100px)'
  readOnly: boolean              // Default: false
}
```

**State:**
```javascript
{
  editorInstance: object | null, // Monaco editor instance
  isInitialized: boolean         // Whether editor is ready
}
```

**Methods:**
- `initializeEditor() => void` - Initialize Monaco editor
- `setValue(value: string) => void` - Set editor value programmatically
- `getValue() => string` - Get current editor value

**Lifecycle:**
- `useEffect` to initialize Monaco when component mounts
- `useImperativeHandle` to expose methods to parent via ref

**Example Structure:**
```javascript
const MonacoEditor = React.forwardRef(({ 
  value, 
  onChange, 
  language = 'json',
  theme = 'vs-light',
  height = 'calc(100% - 100px)',
  readOnly = false
}, ref) => {
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    require.config({ 
      paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }
    });
    
    require(['vs/editor/editor.main'], function() {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: value,
        language: language,
        theme: theme,
        automaticLayout: true,
        minimap: { enabled: false },
        readOnly: readOnly
      });

      editorRef.current.onDidChangeModelContent(() => {
        onChange(editorRef.current.getValue());
      });
    });

    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setValue: (newValue) => {
      if (editorRef.current) {
        editorRef.current.setValue(newValue);
      }
    },
    getValue: () => {
      return editorRef.current ? editorRef.current.getValue() : '';
    },
    refresh: () => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }
  }));

  return <div ref={containerRef} style={{ width: '100%', height }} />;
});
```

---

### 23. ExcalidrawDiagram

**Responsibilities:**
- Render Excalidraw component
- Parse JSON input to create diagram elements
- Generate infrastructure visualization
- Handle zoom and viewport management

**Props:**
```javascript
{
  jsonInput: string,             // JSON string to visualize
  onError: (error) => void       // Error handler
}
```

**State:**
```javascript
{
  elements: Array,               // Excalidraw elements
  appState: object               // Excalidraw app state
}
```

**Methods:**
- `parseJSON(jsonString) => object` - Parse and validate JSON
- `generateElements(data) => Array` - Create Excalidraw elements from data
- `createOrgShape(org, y) => [shape, text]` - Create organization container
- `createSnaplexShape(snaplex, x, y) => [shape, text]` - Create snaplex container
- `createNodeShape(node, x, y) => [shape, text]` - Create node element
- `createArrow(x1, y1, x2, y2) => arrow` - Create arrow element
- `calculateZoom(elements, viewportSize) => number` - Calculate optimal zoom

**Diagram Generation Logic:**
```javascript
1. Parse JSON input
2. For each organization:
   - Calculate org dimensions
   - Create org container with control plane emoji
   - For each snaplex:
     - Calculate snaplex dimensions
     - Create snaplex container with type icon
     - Create JCC nodes
     - Create FM nodes
     - Create arrows from FM to JCC
3. Calculate total diagram dimensions
4. Calculate optimal zoom level
5. Update Excalidraw scene
```

**Element Creation Helpers:**
```javascript
const createBasicShape = (type, x, y, width, height, text, shapeType) => {
  // Returns [shape, textElement]
};

const createArrow = (x1, y1, x2, y2) => {
  // Returns arrow element
};

const getNodeSize = (size) => {
  // 'm' => 1, 'l' => 1.5, 'xl' => 2, 'xxl' => 3
};

const getControlPlaneEmoji = (controlPlane) => {
  // 'US' => '🌎', 'EMEA' => '🌍'
};

const getOrgColor = () => {
  // Returns next unused color from palette
};
```

**Example Structure:**
```javascript
function ExcalidrawDiagram({ jsonInput, onError }) {
  const excalidrawRef = useRef(null);
  const [elements, setElements] = useState([]);

  const generateDiagram = useCallback(() => {
    try {
      const data = JSON.parse(jsonInput);
      const generatedElements = generateElements(data);
      setElements(generatedElements);

      if (excalidrawRef.current) {
        const totalHeight = Math.max(...generatedElements.map(e => e.y + e.height));
        const totalWidth = Math.max(...generatedElements.map(e => e.x + e.width));
        const zoom = calculateZoom({ width: totalWidth, height: totalHeight });

        excalidrawRef.current.updateScene({
          elements: generatedElements,
          appState: {
            viewBackgroundColor: "#ffffff",
            zoom: { value: zoom }
          }
        });
      }
    } catch (err) {
      onError(err.message);
    }
  }, [jsonInput, onError]);

  useEffect(() => {
    if (jsonInput) {
      generateDiagram();
    }
  }, [jsonInput, generateDiagram]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Excalidraw
        ref={excalidrawRef}
        initialData={{
          elements: [],
          appState: { viewBackgroundColor: "#ffffff" }
        }}
      />
    </div>
  );
}
```

---

## Custom Hooks

### useCalculator

**Purpose:**
Shared calculation logic and state management for all calculator components.

**Parameters:**
```javascript
{
  initialFormData: object,       // Initial form values
  calculationFn: (formData) => object, // Calculation function
  onResultCalculated: (result) => void // Result callback
}
```

**Returns:**
```javascript
{
  formData: object,              // Current form data
  result: object | null,         // Calculation result
  updateField: (field, value) => void, // Update single field
  calculate: () => void,         // Trigger calculation
  reset: () => void              // Reset to initial state
}
```

**Implementation:**
```javascript
function useCalculator({ initialFormData, calculationFn, onResultCalculated }) {
  const [formData, setFormData] = useState(initialFormData);
  const [result, setResult] = useState(null);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const calculate = useCallback(() => {
    const calculatedResult = calculationFn(formData);
    setResult(calculatedResult);
    onResultCalculated(calculatedResult);
  }, [formData, calculationFn, onResultCalculated]);

  const reset = useCallback(() => {
    setFormData(initialFormData);
    setResult(null);
  }, [initialFormData]);

  return { formData, result, updateField, calculate, reset };
}
```

**Usage Example:**
```javascript
function TriggeredTaskCalculator({ onResultCalculated }) {
  const { formData, result, updateField, calculate } = useCalculator({
    initialFormData: {
      apiPerDay: 833333,
      coverageHours: 24,
      apiResponseTime: 1,
      peak: 150
    },
    calculationFn: (data) => {
      const concurrentAPI = data.apiPerDay / data.coverageHours / 60 / 60 * (data.peak / 100);
      const nodesRequired = concurrentAPI / (20 / data.apiResponseTime);
      const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));
      return { concurrentAPI, nodesRequired, haNodesRequired };
    },
    onResultCalculated
  });

  // Use formData, result, updateField, calculate in component
}
```

---

### useMonacoEditor

**Purpose:**
Initialize and manage Monaco editor instance.

**Parameters:**
```javascript
{
  containerId: string,           // Container element ID
  initialValue: string,          // Initial editor value
  onChange: (value) => void,     // Change handler
  options: object                // Monaco editor options
}
```

**Returns:**
```javascript
{
  editorInstance: object | null, // Monaco editor instance
  isReady: boolean,              // Whether editor is initialized
  setValue: (value) => void,     // Set editor value
  getValue: () => string,        // Get editor value
  refresh: () => void            // Refresh editor layout
}
```

**Implementation:**
```javascript
function useMonacoEditor({ containerId, initialValue = '', onChange, options = {} }) {
  const [editorInstance, setEditorInstance] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    require.config({ 
      paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.30.1/min/vs' }
    });

    require(['vs/editor/editor.main'], function() {
      const editor = monaco.editor.create(container, {
        value: initialValue,
        language: 'json',
        theme: 'vs-light',
        automaticLayout: true,
        minimap: { enabled: false },
        ...options
      });

      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue());
      });

      setEditorInstance(editor);
      setIsReady(true);
    });

    return () => {
      if (editorInstance) {
        editorInstance.dispose();
      }
    };
  }, [containerId]);

  const setValue = useCallback((value) => {
    if (editorInstance) {
      editorInstance.setValue(value);
    }
  }, [editorInstance]);

  const getValue = useCallback(() => {
    return editorInstance ? editorInstance.getValue() : '';
  }, [editorInstance]);

  const refresh = useCallback(() => {
    if (editorInstance) {
      editorInstance.layout();
    }
  }, [editorInstance]);

  return { editorInstance, isReady, setValue, getValue, refresh };
}
```

---

### usePasswordProtection

**Purpose:**
Manage password protection state and unlocking logic.

**Parameters:**
- None

**Returns:**
```javascript
{
  isUnlocked: boolean,           // Whether advanced features are unlocked
  unlock: () => void,            // Unlock advanced features
  lock: () => void,              // Re-lock advanced features
  checkPassword: (password) => boolean // Validate password
}
```

**Implementation:**
```javascript
function usePasswordProtection() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const CORRECT_PASSWORD = 'snapLogic4snapLogic';

  const checkPassword = useCallback((password) => {
    return password === CORRECT_PASSWORD;
  }, []);

  const unlock = useCallback(() => {
    setIsUnlocked(true);
  }, []);

  const lock = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  return { isUnlocked, unlock, lock, checkPassword };
}
```

**Usage Example:**
```javascript
function App() {
  const { isUnlocked, unlock } = usePasswordProtection();

  return (
    <AppContext.Provider value={{ isUnlocked }}>
      {/* ... app content ... */}
      <PasswordModal onUnlock={unlock} />
    </AppContext.Provider>
  );
}
```

---

### useTabState

**Purpose:**
Manage tab navigation state and related side effects.

**Parameters:**
```javascript
{
  defaultTab: string             // Initial active tab (default: 'tab1')
}
```

**Returns:**
```javascript
{
  activeTab: string,             // Current active tab
  setActiveTab: (tabId) => void, // Change active tab
  isTabActive: (tabId) => boolean // Check if tab is active
}
```

**Implementation:**
```javascript
function useTabState({ defaultTab = 'tab1' } = {}) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const isTabActive = useCallback((tabId) => {
    return activeTab === tabId;
  }, [activeTab]);

  // Manage body class for diagram tab
  useEffect(() => {
    if (activeTab === 'tab5') {
      document.body.classList.add('diagram-tab-active');
    } else {
      document.body.classList.remove('diagram-tab-active');
    }

    return () => {
      document.body.classList.remove('diagram-tab-active');
    };
  }, [activeTab]);

  return { activeTab, setActiveTab, isTabActive };
}
```

---

### useDiagramHeight

**Purpose:**
Calculate and manage diagram tab height based on viewport.

**Parameters:**
- None

**Returns:**
```javascript
{
  height: number,                // Calculated height in pixels
  refreshHeight: () => void      // Recalculate height
}
```

**Implementation:**
```javascript
function useDiagramHeight() {
  const [height, setHeight] = useState(600);

  const calculateHeight = useCallback(() => {
    const windowHeight = window.innerHeight;
    const header = document.querySelector('h1')?.offsetHeight || 0;
    const tabs = document.querySelector('.tabs')?.offsetHeight || 0;
    const footer = document.querySelector('footer')?.offsetHeight || 0;
    const padding = 220;

    const availableHeight = windowHeight - header - tabs - footer - padding;
    setHeight(availableHeight);
  }, []);

  useEffect(() => {
    calculateHeight();
    window.addEventListener('resize', calculateHeight);

    return () => {
      window.removeEventListener('resize', calculateHeight);
    };
  }, [calculateHeight]);

  return { height, refreshHeight: calculateHeight };
}
```

---

## Component Patterns

### 1. Controlled vs Uncontrolled Components

**Decision: Use Controlled Components**

All form inputs will be controlled components where:
- State is managed by React (in component or hook)
- Value is passed via props
- Changes trigger state updates via callbacks

**Rationale:**
- Easier to validate and transform input
- Better testability
- Consistent with React best practices
- Enables easier debugging and state inspection

**Example:**
```javascript
// Controlled
<FormField 
  value={formData.apiPerDay}
  onChange={(value) => updateField('apiPerDay', value)}
/>

// NOT Uncontrolled (avoid this)
<input defaultValue={833333} ref={inputRef} />
```

---

### 2. Form Handling Pattern

**Pattern: State-driven Forms with Calculate Button**

Each calculator follows this pattern:
1. Form data stored in component state (or custom hook)
2. Inputs update state on change
3. Calculate button triggers calculation
4. Results stored in state and passed to parent
5. Form submission prevented (not a real form submission)

**Implementation:**
```javascript
function Calculator() {
  const { formData, result, updateField, calculate } = useCalculator({...});

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <FormField 
        value={formData.field1}
        onChange={(val) => updateField('field1', val)}
      />
      <Button onClick={calculate}>Calculate</Button>
      {result && <ResultDisplay result={result} />}
    </form>
  );
}
```

**Why:**
- No page refresh
- Explicit calculation trigger
- Users can modify inputs before calculating
- Matches current UX

---

### 3. Calculation Trigger Pattern

**Pattern: On-Demand Calculation**

Calculations are triggered by explicit user action (button click), not automatically on input change.

**Rationale:**
- Matches current behavior
- Gives users control
- Prevents unnecessary calculations while typing
- Better for complex/expensive calculations

**Alternative Considered:**
Auto-calculation on input change (useEffect watching formData)
- Rejected: May be jarring for users expecting current behavior
- Rejected: Could cause performance issues with rapid typing

---

### 4. Result Display Pattern

**Pattern: Conditional Rendering with Persistent Results**

Results are:
- Hidden until first calculation
- Persist when inputs change (until recalculated)
- Cleared on reset (if reset implemented)

**Implementation:**
```javascript
const [result, setResult] = useState(null);

// After calculation
setResult(calculatedResult);

// Render
{result && <ResultDisplay result={result} />}
```

---

### 5. Conditional Visibility Pattern

**Pattern: Props-driven Visibility**

Components that can be hidden (password-protected fields) use a `visible` prop:

**Implementation:**
```javascript
<FormField 
  label="API Response Time"
  visible={isPasswordUnlocked}
  value={formData.apiResponseTime}
  onChange={...}
/>

// Inside FormField
function FormField({ visible = true, ...props }) {
  if (!visible) return null;
  // ... render field
}
```

**Why:**
- Declarative
- Easy to toggle multiple fields
- No DOM manipulation
- Testable

---

### 6. Context Pattern for Shared State

**Pattern: React Context for Global State**

Use Context for:
- Password unlock state
- Calculator results (for diagram generation)
- Active tab state (if needed across components)

**Implementation:**
```javascript
const AppContext = React.createContext();

function App() {
  const [state, setState] = useState({...});

  return (
    <AppContext.Provider value={state}>
      {children}
    </AppContext.Provider>
  );
}

// In child components
function ChildComponent() {
  const { isPasswordUnlocked } = useContext(AppContext);
}
```

**What NOT to put in Context:**
- Calculator form data (local to each calculator)
- UI state (modal open/closed)
- Temporary values

---

### 7. Ref Pattern for Editor Integration

**Pattern: Forward Refs for Monaco/Excalidraw**

Components wrapping external libraries expose methods via forwardRef:

**Implementation:**
```javascript
const MonacoEditor = React.forwardRef((props, ref) => {
  const editorRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setValue: (value) => editorRef.current?.setValue(value),
    getValue: () => editorRef.current?.getValue()
  }));

  return <div ref={containerRef} />;
});

// Usage
function Parent() {
  const editorRef = useRef(null);

  const handleClick = () => {
    editorRef.current.setValue('new value');
  };

  return <MonacoEditor ref={editorRef} />;
}
```

---

## Reusability Strategy

### 1. Calculator Code Sharing

**Problem:** Four calculators have very similar structure but different:
- Number of fields
- Field labels and defaults
- Calculation formulas
- Result fields

**Solution: Configuration-Driven Calculator Component**

**Option A: Unified Calculator Component**

Create a single `GenericCalculator` component that accepts configuration:

```javascript
<GenericCalculator
  config={{
    type: 'triggered',
    description: 'This calculator helps in sizing...',
    fields: [
      { 
        name: 'apiPerDay', 
        label: 'API requests per Day', 
        defaultValue: 833333,
        type: 'number',
        passwordProtected: false
      },
      // ... more fields
    ],
    calculationFn: (formData) => {
      // Calculation logic
    },
    resultFields: [
      { key: 'concurrentAPI', label: 'Concurrent API' },
      // ... more result fields
    ],
    additionalComponents: [
      { type: 'toggle', props: {...} },
      { type: 'select', props: {...} }
    ]
  }}
/>
```

**Pros:**
- DRY (Don't Repeat Yourself)
- Single source of truth
- Easy to add new calculator types

**Cons:**
- More complex component
- Less readable
- Harder to customize individual calculators

**Option B: Shared Hook + Individual Components (RECOMMENDED)**

Use `useCalculator` hook for state management, keep components separate:

```javascript
// Shared logic in hook
function useCalculator({ initialFormData, calculationFn, onResultCalculated }) {
  // ... shared state and methods
}

// Individual calculator components
function TriggeredTaskCalculator() {
  const { formData, result, updateField, calculate } = useCalculator({
    initialFormData: TRIGGERED_TASK_DEFAULTS,
    calculationFn: calculateTriggeredTask,
    onResultCalculated: handleResult
  });

  // Render custom fields and layout
}
```

**Pros:**
- Balance between reusability and flexibility
- Easy to understand and maintain
- Easy to customize individual calculators
- Shared logic extracted

**Cons:**
- Some duplication in JSX structure

**Decision: Use Option B (Shared Hook + Individual Components)**

---

### 2. Shared Calculation Utilities

Extract common calculation utilities to separate module:

```javascript
// calculationUtils.js
const HA_MULTIPLIER = 1.3;
const MIN_HA_NODES = 2;

export function applyHAMultiplier(nodes) {
  return Math.ceil(Math.max(nodes * HA_MULTIPLIER, MIN_HA_NODES));
}

export function calculateConcurrentAPI(apiPerDay, coverageHours, peak) {
  return apiPerDay / coverageHours / 60 / 60 * (peak / 100);
}

export function calculateNodesFromTPS(concurrentTPS, tpsPerNode, executionTime) {
  return concurrentTPS / (tpsPerNode / executionTime);
}

// Usage in calculators
import { applyHAMultiplier, calculateConcurrentAPI } from './calculationUtils';

const concurrentAPI = calculateConcurrentAPI(apiPerDay, coverageHours, peak);
const haNodes = applyHAMultiplier(nodesRequired);
```

**Constants Module:**
```javascript
// constants.js
export const CALCULATOR_CONSTANTS = {
  TRIGGERED_TASK: {
    TPS_PER_NODE: 20,
    DEFAULT_EXECUTION_TIME: 1,
    ULTRA_RECOMMENDATION_THRESHOLD: 6
  },
  ULTRA_TASK: {
    EXECUTION_TPS_PER_NODE: 100,
    FM_TPS_PER_NODE: 200,
    DEFAULT_EXECUTION_TIME: 0.3
  },
  SCHEDULED_TASK: {
    MB_PER_MINUTE_PER_NODE: 300,
    ROW_SIZE_BYTES: 2000
  },
  HEADLESS_ULTRA: {
    MICROBATCHING_TPS_PER_NODE: 100,
    NON_MICROBATCHING_MB_PER_MIN: 150
  },
  COMMON: {
    HA_MULTIPLIER: 1.3,
    MIN_HA_NODES: 2
  }
};
```

---

### 3. Shared Validation Logic

Create validation utilities for form inputs:

```javascript
// validationUtils.js
export function validatePositiveNumber(value) {
  return !isNaN(value) && value > 0;
}

export function validatePercentage(value) {
  return validatePositiveNumber(value) && value <= 10000; // Max 10000%
}

export function validateHours(value) {
  return validatePositiveNumber(value) && value <= 24;
}

// In FormField component
function FormField({ value, onChange, validation, ...props }) {
  const [error, setError] = useState(null);

  const handleChange = (newValue) => {
    if (validation && !validation(newValue)) {
      setError('Invalid value');
      return;
    }
    setError(null);
    onChange(newValue);
  };

  return (
    <>
      <label>{props.label}</label>
      <input value={value} onChange={handleChange} />
      {error && <span className="error">{error}</span>}
    </>
  );
}
```

---

### 4. Result Display Configuration

Create reusable result display configurations:

```javascript
// resultConfigs.js
export const RESULT_CONFIGS = {
  TRIGGERED_TASK: [
    { key: 'concurrentAPI', label: 'Concurrent API', format: 'decimal' },
    { key: 'nodesRequired', label: 'Nodes Required', format: 'decimal' },
    { key: 'haNodesRequired', label: 'HA Nodes Required', format: 'integer' }
  ],
  ULTRA_TASK: [
    { key: 'concurrentAPI', label: 'API per second', format: 'decimal' },
    { key: 'executionNodesRequired', label: 'Execution Nodes Required', format: 'decimal' },
    { key: 'haExecutionNodes', label: 'HA Execution Nodes Required', format: 'integer' },
    { key: 'fmNodesRequired', label: 'FeedMaster Nodes Required', format: 'decimal' },
    { key: 'haFmNodes', label: 'HA FeedMaster Nodes Required', format: 'integer' }
  ],
  // ... other configs
};

// Usage
<ResultDisplay 
  result={result}
  config={RESULT_CONFIGS.TRIGGERED_TASK}
/>
```

---

## State Management

### Global State (Context)

**Stored in App Context:**
```javascript
{
  // Password protection
  isPasswordUnlocked: boolean,

  // Calculator results for diagram generation
  calculatorResults: {
    triggered: {
      haNodesRequired: number
    } | null,
    ultra: {
      haExecutionNodes: number,
      haFmNodes: number
    } | null,
    scheduled: {
      haNodesRequired: number
    } | null,
    headlessUltra: {
      haExecutionNodes: number
    } | null
  },

  // Current active tab
  activeTab: string
}
```

**Context Methods:**
```javascript
{
  setCalculatorResult: (type: string, result: object) => void,
  setActiveTab: (tabId: string) => void,
  unlockPassword: () => void
}
```

---

### Local Component State

**Calculator Components:**
```javascript
{
  formData: object,              // Form input values
  result: object | null          // Calculation results
}
```

**DiagramTab:**
```javascript
{
  jsonValue: string,             // Monaco editor content
  error: string | null           // Error messages
}
```

**FAQTab:**
```javascript
{
  openFaqId: string | null       // Currently open FAQ
}
```

**PasswordModal:**
```javascript
{
  password: string,              // Password input value
  error: string | null           // Error message
}
```

**Toggle Components (Scheduled/Headless):**
```javascript
{
  toggleState: boolean           // Toggle on/off state
}
```

---

### State Flow Diagram

```
┌─────────────────────────────────────────────┐
│                    App                      │
│  ┌────────────────────────────────────┐    │
│  │         AppContext                 │    │
│  │  - isPasswordUnlocked              │    │
│  │  - calculatorResults               │    │
│  │  - activeTab                       │    │
│  └────────────────────────────────────┘    │
│                    │                        │
│      ┌─────────────┼─────────────┐         │
│      │             │             │         │
│      ▼             ▼             ▼         │
│  Calculator    DiagramTab     FAQTab       │
│  (local        (local         (local       │
│   state)        state)         state)      │
│      │                                      │
│      │ onResultCalculated                  │
│      └─────────────►                        │
│        Update Context                      │
└─────────────────────────────────────────────┘
```

---

## Migration Notes

### Phase 1: Setup & Core Structure
1. Create component structure in single HTML file
2. Set up React Context
3. Implement App, MainContainer, TabNavigation
4. Implement Logo, Header, Footer

### Phase 2: Shared Components
5. Implement FormField, SelectField, Toggle, Button
6. Implement ResultDisplay, InfoBanner
7. Implement PasswordModal
8. Test shared components

### Phase 3: Calculator Components
9. Create useCalculator hook
10. Implement TriggeredTaskCalculator
11. Implement UltraTaskCalculator
12. Implement ScheduledTaskCalculator
13. Implement HeadlessUltraCalculator
14. Test all calculators

### Phase 4: Complex Features
15. Implement MonacoEditor component
16. Implement DiagramTab (without Excalidraw first)
17. Implement ExcalidrawDiagram component
18. Integrate diagram generation logic
19. Test diagram tab

### Phase 5: FAQ & Polish
20. Implement FAQTab and FAQItem
21. Test password protection flow
22. Test tab switching
23. Test responsive behavior
24. Cross-browser testing

### Phase 6: Cleanup
25. Remove old vanilla JS code
26. Clean up comments
27. Final testing
28. Documentation updates

---

### Backward Compatibility Notes

**Preserved Behaviors:**
- All existing calculations produce identical results
- Same default values
- Same password (`snapLogic4snapLogic`)
- Same tab structure and IDs
- Same CSS classes (no CSS changes needed)
- Same diagram visualization
- Same FAQ content
- Same disclaimer text

**Deprecated:**
- Global variables (`isBatchSize`, `isMicrobatching`, `pLocked`, `monacoEditor`)
  → Replaced with component state
- Global functions (`calculate()`, `openTab()`, etc.)
  → Replaced with component methods
- Direct DOM manipulation
  → Replaced with React rendering

---

### Testing Checklist

**Functional Testing:**
- [ ] All 4 calculators produce correct results
- [ ] Password unlock reveals advanced fields
- [ ] Tab switching works correctly
- [ ] Diagram JSON generation includes all results
- [ ] Excalidraw diagram renders correctly
- [ ] FAQ accordion works (one open at a time)
- [ ] Logo click opens password modal
- [ ] Form inputs accept valid values
- [ ] Results persist until recalculated
- [ ] Toggles switch modes correctly (scheduled/headless)

**Visual Testing:**
- [ ] All tabs display correctly
- [ ] Diagram tab expands to full width
- [ ] Monaco editor renders properly
- [ ] Buttons styled correctly
- [ ] Result displays formatted correctly
- [ ] Modal overlay works
- [ ] FAQ items expand/collapse smoothly
- [ ] Responsive layout on mobile

**Edge Cases:**
- [ ] Handle zero/negative inputs gracefully
- [ ] Handle missing calculator results in diagram
- [ ] Handle invalid JSON in diagram editor
- [ ] Handle password modal cancel
- [ ] Handle rapid tab switching
- [ ] Handle browser back/forward buttons
- [ ] Handle window resize

**Performance:**
- [ ] No unnecessary re-renders
- [ ] Monaco editor initializes once
- [ ] Excalidraw performs well with large diagrams
- [ ] Tab switching is smooth
- [ ] No memory leaks

---

## Conclusion

This component specification provides a comprehensive blueprint for migrating the SnapLogic Node Sizing Calculator to React. The design prioritizes:

1. **Modularity** - Small, focused components
2. **Reusability** - Shared hooks and components
3. **Maintainability** - Clear separation of concerns
4. **Testability** - Controlled components with predictable behavior
5. **Backward Compatibility** - Preserves all existing functionality

The specification balances code reuse with flexibility, using a shared hook pattern for calculators while keeping components independent enough to customize. The Context API provides global state management without overcomplicating the architecture.

Implementers should follow the phased migration plan, testing each component thoroughly before proceeding to the next phase.

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-08  
**Next Review:** After Phase 1 completion
