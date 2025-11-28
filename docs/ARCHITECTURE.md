# SnapLogic Node Sizing Calculator - React Migration Architecture

**Version:** 1.0  
**Date:** 2025-11-08  
**Status:** Design Phase

---

## 1. Executive Summary

### 1.1 Current State Overview

The SnapLogic Node Sizing Calculator is currently implemented as a **hybrid architecture**:

- **Vanilla JavaScript** (~430 lines): Handles calculators, tab navigation, form interactions, and Monaco Editor integration
- **React** (~425 lines): Powers only the Excalidraw diagram visualization
- **Single HTML file** (1,129 lines) with inline scripts and external CSS
- **No build process**: All dependencies loaded via CDN, JSX transformed via Babel Standalone

**Pain Points:**
- Dual paradigm creates cognitive overhead (imperative vs declarative)
- State synchronization between vanilla JS and React is brittle (global `monacoEditor` ref, manual DOM queries)
- No component reuse across calculators (4 duplicate form patterns)
- Difficult to test or refactor due to tight DOM coupling
- Global state variables (`pLocked`, `isBatchSize`, `isMicrobatching`) scattered throughout

### 1.2 Target State Overview

**Full React architecture** while maintaining zero-build-process constraint:

- **Component-based architecture**: 15-20 reusable components organized hierarchically
- **Centralized state management**: React Context API for global state, local state for UI concerns
- **Declarative UI patterns**: All DOM manipulation replaced with React rendering
- **Single file structure**: Organized into logical script blocks with clear separation
- **Performance**: Babel Standalone acceptable for this use case (~5KB gzipped, <100ms transform time)

**Benefits:**
- 40-50% code reduction through component reuse
- Simplified testing surface (pure functions, predictable state)
- Easier feature additions (e.g., export diagrams, save configurations)
- Better maintainability (component boundaries, props contracts)

### 1.3 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Build Process** | None (Babel Standalone) | Per requirement; acceptable perf for this app size |
| **React Version** | React 18 (latest) | Concurrent features, better Suspense, maintained long-term |
| **State Management** | Context API + useReducer | Simple enough for app scope; avoid Redux overhead |
| **Component Library** | Custom components | Small app; external UI lib adds unnecessary weight |
| **CSS Strategy** | Keep separate file | Easier to maintain; inline would bloat HTML |
| **TypeScript** | No | Requires build step; JSDoc comments for type hints |
| **Testing** | Manual (initial) | Can add Jest later if needed; focus on migration first |

---

## 2. System Architecture

### 2.1 Component Hierarchy (ASCII Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│  App (Root Component)                                           │
│  ├── Global State: CalculatorProvider (Context)                │
│  │   └── State: calculatorResults, settings, unlockStatus      │
│  └── Router State: activeTab                                   │
└─────────────────────────────────────────────────────────────────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
      ▼                    ▼                    ▼
┌──────────┐         ┌──────────┐        ┌──────────┐
│  Header  │         │ TabNav   │        │  Footer  │
│  └─Logo  │         │ (6 tabs) │        │(Disclaimr)│
└──────────┘         └──────────┘        └──────────┘
                           │
      ┌────────────────────┼────────────────────┬────────────┐
      │                    │                    │            │
      ▼                    ▼                    ▼            ▼
┌──────────────┐    ┌──────────────┐    ┌──────────┐  ┌─────────┐
│CalculatorTab │    │ DiagramTab   │    │  FAQTab  │  │Password │
│ (4 variants) │    │              │    │          │  │ Modal   │
└──────────────┘    └──────────────┘    └─────────┘  └─────────┘
      │                    │
      │              ┌─────┴─────┐
      ▼              ▼           ▼
┌─────────────┐  ┌──────────┐ ┌──────────────┐
│ Calculator  │  │MonacoPane│ │ExcalidrawPane│
│  └─Form     │  │ +Button  │ │ +Logic       │
│  └─Result   │  └──────────┘ └──────────────┘
└─────────────┘
      │
  ┌───┴───┐
  ▼       ▼
┌────┐ ┌────────┐
│Form│ │Results │
│Item│ │Display │
└────┘ └────────┘
```

### 2.2 Data Flow Diagram

```
┌───────────────────────────────────────────────────────────┐
│  USER ACTIONS                                             │
└───────────────────────────────────────────────────────────┘
         │                       │                 │
         │ Form Input            │ Tab Click       │ Generate JSON
         ▼                       ▼                 ▼
┌─────────────────┐      ┌─────────────┐   ┌─────────────────┐
│ Calculator      │      │   TabNav    │   │   MonacoPane    │
│ Dispatch Action │      │  Set Active │   │  Read Context   │
└─────────────────┘      └─────────────┘   └─────────────────┘
         │                       │                 │
         ▼                       ▼                 ▼
┌───────────────────────────────────────────────────────────┐
│  CONTEXT (CalculatorProvider)                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ State:                                              │  │
│  │  - calculatorResults: {                            │  │
│  │      triggered: { nodes, haNodes, concurrent },    │  │
│  │      ultra: { execNodes, fmNodes, ... },           │  │
│  │      scheduled: { ... },                           │  │
│  │      headlessUltra: { ... }                        │  │
│  │    }                                               │  │
│  │  - settings: {                                     │  │
│  │      isUnlocked: false,                            │  │
│  │      isBatchSizeMode: true,                        │  │
│  │      isMicrobatchingMode: true                     │  │
│  │    }                                               │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
         │                       │                 │
         ▼                       ▼                 ▼
┌─────────────────┐      ┌─────────────┐   ┌─────────────────┐
│ Results Display │      │ Tab Content │   │ Excalidraw Pane │
│ (read-only)     │      │ Re-render   │   │ (diagram)       │
└─────────────────┘      └─────────────┘   └─────────────────┘
```

### 2.3 State Management Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  GLOBAL STATE (React Context)                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ CalculatorContext                                     │  │
│  │  └── useReducer(calculatorReducer, initialState)     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │
         ├─── calculatorResults    (Object - all calc outputs)
         ├─── settings             (Object - global settings)
         │     ├── isUnlocked      (Boolean)
         │     ├── isBatchSizeMode (Boolean)
         │     └── isMicrobatching (Boolean)
         └─── dispatch             (Function - update state)

┌─────────────────────────────────────────────────────────────┐
│  LOCAL STATE (Component-level useState)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ App:           activeTab (string)                     │  │
│  │ PasswordModal: isVisible, password (string)           │  │
│  │ FAQItem:       isExpanded (boolean)                   │  │
│  │ MonacoPane:    editorInstance (ref), json (string)    │  │
│  │ Calculator:    formValues (object - ephemeral)        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DERIVED STATE (useMemo computations)                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ MonacoPane:                                           │  │
│  │   diagramJson = useMemo(() => {                       │  │
│  │     return generateJsonFromResults(calculatorResults) │  │
│  │   }, [calculatorResults])                             │  │
│  │                                                       │  │
│  │ Calculator:                                           │  │
│  │   validation = useMemo(() => {                        │  │
│  │     return validateFormInputs(formValues)             │  │
│  │   }, [formValues])                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 React Version and Justification

**Choice: React 18.3.1 (latest stable)**

**Rationale:**
- **Concurrent Features**: Automatic batching improves performance (multiple state updates batched)
- **Transitions API**: `useTransition` can mark diagram generation as non-urgent, keeping UI responsive
- **Suspense Improvements**: Better error boundaries for Monaco/Excalidraw loading
- **Long-term Support**: React 18 is current; React 17 enters maintenance mode
- **CDN Availability**: Full UMD builds available via unpkg/cdnjs
- **Backward Compatible**: Migration from 17→18 is seamless (no breaking changes in our use case)

**CDN Link:**
```html
<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
```

### 3.2 CDN Dependencies List

| Library | Version | Purpose | Size (gzipped) | Notes |
|---------|---------|---------|----------------|-------|
| **React** | 18.3.1 | Core library | ~8KB | Use production build |
| **React-DOM** | 18.3.1 | DOM renderer | ~38KB | Use production build |
| **Babel Standalone** | 7.23.x | JSX transform | ~5KB | Load async after page load |
| **Monaco Editor** | 0.45.0 | JSON editor | ~300KB | Consider lazy load on tab5 |
| **Excalidraw** | 0.17.x | Diagram library | ~400KB | Lazy load on tab5 |

**Migration Notes:**
- **Excalidraw 0.15.2 → 0.17.x**: API changes in `updateScene()` → use `updateLibrary()` + `scrollToContent()`
- **Monaco 0.30.1 → 0.45.0**: Better AMD loader, same API for our use case
- **Babel Standalone**: Keep for now; revisit if performance issues arise

**Loading Strategy:**
```html
<!-- Critical (loaded in <head>) -->
<script src="react.production.min.js"></script>
<script src="react-dom.production.min.js"></script>

<!-- Defer (loaded when tab5 active) -->
<script src="babel.min.js" defer></script>
<script src="monaco-editor/loader.min.js"></script>
<script src="excalidraw.production.min.js"></script>
```

### 3.3 Browser JSX Transformation Approach

**Keep Babel Standalone with optimizations:**

1. **Presets Configuration:**
   ```javascript
   Babel.registerPreset('custom', {
     presets: [[Babel.availablePresets['react'], { 
       runtime: 'automatic',  // Use new JSX transform (React 17+)
       development: false     // Production mode
     }]]
   });
   ```

2. **Lazy Transform Strategy:**
   - Transform JSX only once on page load
   - Cache transformed code in sessionStorage (future optimization)
   - Use `type="text/babel"` only for main app script

3. **Performance Target:**
   - Transform time: <100ms for ~500 lines of JSX
   - Acceptable for non-critical path (one-time cost)

**Alternative Considered (Rejected):**
- **Pre-transpile to JS in repository**: Breaks single-file + no-build requirement
- **React.createElement() manual calls**: Too verbose, loses JSX readability

---

## 4. Component Architecture

### 4.1 Top-Level Component Structure

```jsx
// Root component (lines 700-1100)
function App() {
  const [activeTab, setActiveTab] = useState('tab1');
  
  return (
    <CalculatorProvider>
      <div className="main-container">
        <Header />
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        <TabContent activeTab={activeTab} />
        <Footer />
        <PasswordModal />
      </div>
    </CalculatorProvider>
  );
}
```

### 4.2 Component Breakdown (15 Components)

#### **Container Components** (Smart - Connected to Context)

1. **App** (Root)
   - **Purpose**: Application shell, tab routing
   - **State**: `activeTab` (local)
   - **Children**: All top-level components
   - **Lines**: ~50

2. **CalculatorProvider** (Context Provider)
   - **Purpose**: Global state management
   - **State**: `calculatorResults`, `settings` via useReducer
   - **Children**: Wraps entire app
   - **Lines**: ~80

3. **TriggeredTaskCalculator** (+ 3 variants: Ultra, Scheduled, HeadlessUltra)
   - **Purpose**: Calculator logic + form management
   - **Props**: None (reads/writes to context)
   - **State**: `formValues` (local, ephemeral)
   - **Children**: `<CalculatorForm>`, `<ResultsDisplay>`
   - **Lines**: ~60 each (240 total)

4. **DiagramTab**
   - **Purpose**: Diagram generation orchestration
   - **Props**: None
   - **Children**: `<MonacoPane>`, `<ExcalidrawPane>`
   - **Lines**: ~40

5. **MonacoPane**
   - **Purpose**: Monaco editor + JSON generation
   - **Props**: None (reads context)
   - **State**: `editorInstance` (ref), `jsonValue` (local)
   - **Lines**: ~70

6. **ExcalidrawPane**
   - **Purpose**: Excalidraw rendering + diagram generation
   - **Props**: `jsonInput` (from Monaco)
   - **State**: `excalidrawRef` (ref), `error` (local)
   - **Lines**: ~150

#### **Presentation Components** (Dumb - Pure Props)

7. **Header**
   - **Purpose**: Logo + title
   - **Props**: `onLogoClick` (callback for password modal)
   - **Lines**: ~15

8. **TabNav**
   - **Purpose**: Tab navigation UI
   - **Props**: `activeTab`, `onTabChange`
   - **Lines**: ~25

9. **TabContent**
   - **Purpose**: Conditional rendering of active tab
   - **Props**: `activeTab`
   - **Children**: Renders appropriate calculator/diagram/FAQ
   - **Lines**: ~30

10. **CalculatorForm**
    - **Purpose**: Reusable form with dynamic fields
    - **Props**: `fields` (config array), `values`, `onChange`, `onSubmit`, `isUnlocked`
    - **Lines**: ~80

11. **FormField**
    - **Purpose**: Single form input (number/select)
    - **Props**: `type`, `label`, `value`, `onChange`, `visible`
    - **Lines**: ~30

12. **ToggleSwitch**
    - **Purpose**: Reusable toggle component
    - **Props**: `label`, `checked`, `onChange`
    - **Lines**: ~20

13. **ResultsDisplay**
    - **Purpose**: Calculation results presentation
    - **Props**: `results` (object), `type` (calculator type)
    - **Lines**: ~40

14. **FAQTab**
    - **Purpose**: FAQ list
    - **Props**: None
    - **Children**: Multiple `<FAQItem>`
    - **Lines**: ~30

15. **FAQItem**
    - **Purpose**: Collapsible FAQ item
    - **Props**: `question`, `answer`
    - **State**: `isExpanded` (local)
    - **Lines**: ~25

16. **PasswordModal**
    - **Purpose**: Password unlock UI
    - **Props**: None (uses context)
    - **State**: `isVisible`, `password` (local)
    - **Lines**: ~40

17. **Footer**
    - **Purpose**: Disclaimer text
    - **Props**: None
    - **Lines**: ~10

### 4.3 Component Communication Patterns

```
┌─────────────────────────────────────────────────────────┐
│  PATTERN 1: Props Down (Parent → Child)                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  App                                              │  │
│  │    activeTab="tab1"                               │  │
│  │         ↓ (props)                                 │  │
│  │  TabNav(activeTab, onTabChange)                   │  │
│  │         ↓ (callback)                              │  │
│  │  App.setActiveTab("tab2")                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PATTERN 2: Context (Global State)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  TriggeredTaskCalculator                          │  │
│  │    const { dispatch, results } = useCalculator()  │  │
│  │         ↓ (context)                               │  │
│  │  CalculatorProvider (shared state)                │  │
│  │         ↓ (context)                               │  │
│  │  MonacoPane                                       │  │
│  │    const { results } = useCalculator()            │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  PATTERN 3: Refs (Imperative APIs)                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  MonacoPane                                       │  │
│  │    const editorRef = useRef(null)                 │  │
│  │    useEffect(() => {                              │  │
│  │      editorRef.current = monaco.create(...)       │  │
│  │    }, [])                                         │  │
│  │                                                   │  │
│  │    const getJson = () => {                        │  │
│  │      return editorRef.current?.getValue()         │  │
│  │    }                                              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Props vs Context Decisions

| State/Data | Storage | Rationale |
|------------|---------|-----------|
| **Calculator Results** | Context | Shared across tabs (diagram needs all results) |
| **Settings (unlock, toggles)** | Context | Global config affecting multiple components |
| **Active Tab** | Local (App) | Only App and TabNav need this |
| **Form Input Values** | Local (Calculator) | Ephemeral, discarded after calculation |
| **Monaco Editor Instance** | Local Ref (MonacoPane) | Imperative API, doesn't trigger re-renders |
| **Excalidraw Ref** | Local Ref (ExcalidrawPane) | Same as Monaco |
| **FAQ Expanded State** | Local (FAQItem) | Each item independent |
| **Password Modal Visible** | Local (PasswordModal) | UI state, doesn't affect other components |

**Guideline:**
- **Context**: Data needed by 3+ non-adjacent components OR global settings
- **Props**: Parent-child communication, simple data flow
- **Local State**: UI state, form state, component-specific flags
- **Refs**: Imperative APIs (Monaco, Excalidraw), DOM nodes

### 4.5 Shared Component Library (Reusable)

**FormField Component** (Most Important Reusable Component)

```jsx
function FormField({ 
  type = 'number',    // 'number' | 'select' | 'text'
  label, 
  value, 
  onChange,
  options = [],        // For select: [{ value, label }]
  visible = true,
  id,
  placeholder
}) {
  if (!visible) return null;
  
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {type === 'select' ? (
        <select id={id} value={value} onChange={onChange}>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input 
          type={type} 
          id={id} 
          value={value} 
          onChange={onChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
```

**ToggleSwitch Component**

```jsx
function ToggleSwitch({ label, checked, onChange, id }) {
  return (
    <div className="toggle-container">
      <label htmlFor={id} className="toggle-label">{label}</label>
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          id={id} 
          checked={checked} 
          onChange={onChange} 
        />
        <span className="slider"></span>
      </label>
    </div>
  );
}
```

**Button Component**

```jsx
function Button({ 
  children, 
  onClick, 
  variant = 'primary',  // 'primary' | 'secondary'
  disabled = false,
  fullWidth = true 
}) {
  return (
    <button 
      className={`btn btn-${variant} ${fullWidth ? 'full-width' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

---

## 5. State Management Strategy

### 5.1 Global State (Context API)

**Context Structure:**

```javascript
// Initial state shape
const initialState = {
  calculatorResults: {
    triggered: null,      // { concurrent, nodes, haNodes }
    ultra: null,          // { concurrent, execNodes, fmNodes, haExecNodes, haFmNodes }
    scheduled: null,      // { mbPerMinute, nodes, haNodes }
    headlessUltra: null   // { concurrent, nodes, haNodes } or { mbPerMinute, nodes, haNodes }
  },
  settings: {
    isUnlocked: false,
    isBatchSizeMode: true,
    isMicrobatchingMode: true
  }
};

// Reducer actions
const actions = {
  SET_TRIGGERED_RESULT: 'SET_TRIGGERED_RESULT',
  SET_ULTRA_RESULT: 'SET_ULTRA_RESULT',
  SET_SCHEDULED_RESULT: 'SET_SCHEDULED_RESULT',
  SET_HEADLESS_ULTRA_RESULT: 'SET_HEADLESS_ULTRA_RESULT',
  TOGGLE_UNLOCK: 'TOGGLE_UNLOCK',
  TOGGLE_BATCH_SIZE_MODE: 'TOGGLE_BATCH_SIZE_MODE',
  TOGGLE_MICROBATCHING_MODE: 'TOGGLE_MICROBATCHING_MODE'
};

// Reducer function
function calculatorReducer(state, action) {
  switch (action.type) {
    case actions.SET_TRIGGERED_RESULT:
      return {
        ...state,
        calculatorResults: {
          ...state.calculatorResults,
          triggered: action.payload
        }
      };
    
    case actions.TOGGLE_UNLOCK:
      return {
        ...state,
        settings: {
          ...state.settings,
          isUnlocked: true
        }
      };
    
    // ... other cases
    
    default:
      return state;
  }
}
```

**Provider Implementation:**

```jsx
const CalculatorContext = React.createContext(null);

function CalculatorProvider({ children }) {
  const [state, dispatch] = React.useReducer(calculatorReducer, initialState);
  
  // Memoize context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    calculatorResults: state.calculatorResults,
    settings: state.settings,
    dispatch
  }), [state]);
  
  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
}

// Custom hook for consuming context
function useCalculator() {
  const context = React.useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within CalculatorProvider');
  }
  return context;
}
```

### 5.2 Local State (Component-level)

**Guidelines:**

1. **Form State (Ephemeral)**
   - Use `useState` for form inputs
   - Only commit to context on "Calculate" button click
   - Allows user to edit without affecting global state

   ```jsx
   function TriggeredTaskCalculator() {
     const [formValues, setFormValues] = useState({
       apiPerDay: 833333,
       coverageHours: 24,
       peak: 150,
       apiResponseTime: 1
     });
     const { dispatch, settings } = useCalculator();
     
     const handleCalculate = () => {
       const results = calculateTriggered(formValues);
       dispatch({ 
         type: 'SET_TRIGGERED_RESULT', 
         payload: results 
       });
     };
   }
   ```

2. **UI State (Component-specific)**
   - Modal visibility
   - FAQ expanded/collapsed
   - Form validation errors

   ```jsx
   function FAQItem({ question, answer }) {
     const [isExpanded, setIsExpanded] = useState(false);
     
     return (
       <div className={`faq-item ${isExpanded ? 'active' : ''}`}>
         <div 
           className="faq-question" 
           onClick={() => setIsExpanded(!isExpanded)}
         >
           {question}
         </div>
         {isExpanded && (
           <div className="faq-answer">{answer}</div>
         )}
       </div>
     );
   }
   ```

3. **Refs (Imperative APIs)**
   - Monaco Editor instance
   - Excalidraw instance
   - DOM nodes for scrolling

   ```jsx
   function MonacoPane() {
     const editorRef = useRef(null);
     const { calculatorResults } = useCalculator();
     
     useEffect(() => {
       require(['vs/editor/editor.main'], function() {
         editorRef.current = monaco.editor.create(
           document.getElementById('monaco-editor'),
           { /* config */ }
         );
       });
       
       return () => {
         editorRef.current?.dispose();
       };
     }, []);
   }
   ```

### 5.3 Derived State Approach

**Use `useMemo` for expensive computations:**

```jsx
function MonacoPane() {
  const { calculatorResults } = useCalculator();
  
  // Only recompute JSON when results change
  const diagramJson = useMemo(() => {
    return generateDiagramJson(calculatorResults);
  }, [calculatorResults]);
  
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setValue(
        JSON.stringify(diagramJson, null, 2)
      );
    }
  }, [diagramJson]);
}
```

**Avoid these patterns:**
- ❌ Storing derived data in state (e.g., `haNodes` can be computed from `nodes`)
- ❌ Duplicating data across context and local state
- ❌ Computing on every render without `useMemo`

### 5.4 State Update Patterns

**Pattern 1: Action Creators (Helper Functions)**

```javascript
// utils/actions.js (inline in script section)
const calculatorActions = {
  setTriggeredResult: (results) => ({
    type: 'SET_TRIGGERED_RESULT',
    payload: results
  }),
  
  setUltraResult: (results) => ({
    type: 'SET_ULTRA_RESULT',
    payload: results
  }),
  
  toggleUnlock: () => ({
    type: 'TOGGLE_UNLOCK'
  })
};
```

**Pattern 2: Optimistic Updates**

For UI toggles that don't need validation:

```jsx
function ScheduledTaskCalculator() {
  const { settings, dispatch } = useCalculator();
  
  const handleToggleBatchMode = () => {
    // Immediate UI update
    dispatch({ type: 'TOGGLE_BATCH_SIZE_MODE' });
    
    // Reset form to default value for new mode
    setFormValues(prev => ({
      ...prev,
      batchSize: settings.isBatchSizeMode ? 1500000000 : 300
    }));
  };
}
```

**Pattern 3: Batched Updates (React 18)**

React 18 automatically batches multiple state updates:

```jsx
// These will batch into single re-render
dispatch({ type: 'SET_TRIGGERED_RESULT', payload: result1 });
dispatch({ type: 'SET_ULTRA_RESULT', payload: result2 });
setActiveTab('tab5');
```

---

## 6. Integration Points

### 6.1 Monaco Editor Integration Pattern

**Challenge**: Monaco requires AMD loader, imperative API

**Solution**: Lazy load, manage via ref, sync with React state

```jsx
function MonacoPane() {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const { calculatorResults } = useCalculator();
  
  // 1. Initialize Monaco on mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
    script.onload = initMonaco;
    document.head.appendChild(script);
    
    return () => {
      editorRef.current?.dispose();
    };
  }, []);
  
  function initMonaco() {
    require.config({ 
      paths: { 
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' 
      } 
    });
    
    require(['vs/editor/editor.main'], function() {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: JSON.stringify({ msg: 'Click Generate JSON' }, null, 2),
        language: 'json',
        theme: 'vs-light',
        automaticLayout: true,
        minimap: { enabled: false }
      });
      
      setIsLoading(false);
    });
  }
  
  // 2. Generate and set JSON when results change
  const diagramJson = useMemo(() => {
    return generateDiagramJson(calculatorResults);
  }, [calculatorResults]);
  
  const handleGenerateJson = () => {
    if (editorRef.current) {
      editorRef.current.setValue(
        JSON.stringify(diagramJson, null, 2)
      );
    }
  };
  
  return (
    <div className="json-input-panel">
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: 'calc(100% - 100px)' }}
      />
      {isLoading && <div>Loading editor...</div>}
      <button onClick={handleGenerateJson}>Generate JSON</button>
    </div>
  );
}
```

**Key Points:**
- Monaco loaded only when DiagramTab mounts (lazy load optimization)
- Editor instance stored in ref (doesn't trigger re-renders)
- React state (`isLoading`) used for loading UI
- Manual `setValue()` for updates (Monaco doesn't support controlled input pattern)

### 6.2 Excalidraw Integration Pattern

**Challenge**: Excalidraw is a full React app, needs careful integration

**Solution**: Use their component, manage via ref, handle scene updates

```jsx
function ExcalidrawPane({ jsonInput }) {
  const excalidrawRef = useRef(null);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Import Excalidraw component (available via CDN)
  const { Excalidraw } = window.ExcalidrawLib;
  
  const handleGenerateDiagram = useCallback(() => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const data = JSON.parse(jsonInput);
      const elements = generateExcalidrawElements(data);
      
      if (excalidrawRef.current) {
        excalidrawRef.current.updateScene({
          elements,
          appState: {
            viewBackgroundColor: "#ffffff"
          }
        });
        
        // Auto-zoom to fit content
        excalidrawRef.current.scrollToContent();
      }
    } catch (err) {
      setError(`Error generating diagram: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [jsonInput]);
  
  return (
    <div className="diagram-output">
      <Excalidraw
        ref={excalidrawRef}
        initialData={{
          elements: [],
          appState: { viewBackgroundColor: "#ffffff" }
        }}
      />
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}
```

**Key Points:**
- Excalidraw component renders independently
- Use ref for imperative API (`updateScene()`, `scrollToContent()`)
- Error handling in React state (displayed in UI)
- `useCallback` to prevent unnecessary re-renders

**Diagram Generation Logic** (Pure Function):

```javascript
// utils/diagramGenerator.js (inline)
function generateExcalidrawElements(data) {
  const elements = [];
  let yOffset = 0;
  
  data.forEach((org, orgIndex) => {
    // Create org container
    const orgElements = createOrgContainer(org, yOffset);
    elements.push(...orgElements);
    
    // Create snaplexes
    org.Snaplex.forEach((snaplex, snaplexIndex) => {
      const snaplexElements = createSnaplexElements(
        snaplex, 
        yOffset, 
        snaplexIndex
      );
      elements.push(...snaplexElements);
    });
    
    yOffset += calculateOrgHeight(org);
  });
  
  return elements;
}
```

### 6.3 Password Unlock Mechanism

**Current**: Hardcoded password, global flag

**React Pattern**: Context-managed, modal component

```jsx
function PasswordModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useCalculator();
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (password === 'snapLogic4snapLogic') {
      dispatch({ type: 'TOGGLE_UNLOCK' });
      setIsVisible(false);
      setPassword('');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
    }
  };
  
  return (
    <>
      {isVisible && (
        <>
          <div className="overlay" onClick={() => setIsVisible(false)} />
          <div className="popup">
            <h2>Enter Password</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              {error && <div className="error">{error}</div>}
              <button type="submit">Submit</button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
```

**Header Integration**:

```jsx
function Header() {
  // Access modal via context (alternative to lifting state)
  const { settings } = useCalculator();
  
  return (
    <div className="logo" onClick={handleLogoClick}>
      <img src="..." alt="SnapLogic Logo" />
      {settings.isUnlocked && (
        <span className="unlock-indicator">🔓</span>
      )}
    </div>
  );
}
```

### 6.4 Tab Navigation System

**Current**: Vanilla JS event handlers, DOM class manipulation

**React Pattern**: Controlled component with state

```jsx
function App() {
  const [activeTab, setActiveTab] = useState('tab1');
  
  return (
    <CalculatorProvider>
      <div className={`main-container ${activeTab === 'tab5' ? 'diagram-tab-active' : ''}`}>
        <Header />
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
        <TabContent activeTab={activeTab} />
        <Footer />
      </div>
    </CalculatorProvider>
  );
}

function TabNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'tab1', label: 'Triggered Task' },
    { id: 'tab2', label: 'Ultra Task' },
    { id: 'tab3', label: 'Scheduled Task' },
    { id: 'tab4', label: 'Headless Ultra Task' },
    { id: 'tab5', label: 'Diagram' },
    { id: 'tab6', label: 'FAQ' }
  ];
  
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

function TabContent({ activeTab }) {
  const renderTab = () => {
    switch (activeTab) {
      case 'tab1': return <TriggeredTaskCalculator />;
      case 'tab2': return <UltraTaskCalculator />;
      case 'tab3': return <ScheduledTaskCalculator />;
      case 'tab4': return <HeadlessUltraCalculator />;
      case 'tab5': return <DiagramTab />;
      case 'tab6': return <FAQTab />;
      default: return null;
    }
  };
  
  return (
    <div className="tab-content active">
      {renderTab()}
    </div>
  );
}
```

**Benefits:**
- Declarative tab switching (no DOM queries)
- Easy to add new tabs (just update array)
- Type-safe with JSDoc comments (future enhancement)

---

## 7. File Structure

### 7.1 Single HTML File Organization

**Proposed Structure** (~1,200 lines total):

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SnapLogic Sizing Calculator</title>
    
    <!-- CDN Dependencies (lines 7-15) -->
    <script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script src="https://unpkg.com/@excalidraw/excalidraw@0.17.0/dist/excalidraw.production.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@7.23.0/babel.min.js"></script>
    
    <!-- External CSS (line 16) -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Root Mounting Point (lines 18-20) -->
    <div id="root"></div>
    
    <!-- Footer (static HTML, lines 22-30) -->
    <footer>
        <p><b>Disclaimer:</b> ...</p>
    </footer>
    
    <!-- ========================================== -->
    <!-- SECTION 1: UTILITY FUNCTIONS (lines 35-250) -->
    <!-- ========================================== -->
    <script>
        // Constants
        const CONSTANTS = {
            TRIGGERED_TPS_PER_NODE: 20,
            ULTRA_EXEC_TPS_PER_NODE: 100,
            ULTRA_FM_TPS_PER_NODE: 200,
            SCHEDULED_MB_PER_MIN_PER_NODE: 300,
            HA_MULTIPLIER: 1.3,
            MIN_HA_NODES: 2,
            PASSWORD: 'snapLogic4snapLogic'
        };
        
        // Calculator Functions (pure)
        function calculateTriggered(formValues) {
            // ... implementation
        }
        
        function calculateUltra(formValues) {
            // ... implementation
        }
        
        function calculateScheduled(formValues) {
            // ... implementation
        }
        
        function calculateHeadlessUltra(formValues, isMicrobatching) {
            // ... implementation
        }
        
        // Diagram Generation (pure)
        function generateDiagramJson(calculatorResults) {
            // ... implementation
        }
        
        function generateExcalidrawElements(data) {
            // ... implementation
        }
        
        function createOrgContainer(org, yOffset) {
            // ... implementation
        }
        
        function createSnaplexElements(snaplex, yOffset, index) {
            // ... implementation
        }
        
        // FAQ Data
        const FAQ_DATA = [
            {
                question: "What are the nodes?",
                answer: "Nodes in SnapLogic are..."
            },
            // ... other FAQ items
        ];
    </script>
    
    <!-- ========================================== -->
    <!-- SECTION 2: REACT APPLICATION (lines 255-1100) -->
    <!-- ========================================== -->
    <script type="text/babel">
        const { useState, useEffect, useRef, useMemo, useCallback, useReducer, useContext, createContext } = React;
        
        // ========== CONTEXT & STATE MANAGEMENT ==========
        
        // Initial state
        const initialState = {
            // ... (see section 5.1)
        };
        
        // Reducer
        function calculatorReducer(state, action) {
            // ... (see section 5.1)
        }
        
        // Context
        const CalculatorContext = createContext(null);
        
        function CalculatorProvider({ children }) {
            // ... (see section 5.1)
        }
        
        function useCalculator() {
            // ... (see section 5.1)
        }
        
        // ========== PRESENTATION COMPONENTS ==========
        
        function Button({ children, onClick, disabled, variant }) {
            // ... (see section 4.5)
        }
        
        function FormField({ type, label, value, onChange, visible, options }) {
            // ... (see section 4.5)
        }
        
        function ToggleSwitch({ label, checked, onChange, id }) {
            // ... (see section 4.5)
        }
        
        function ResultsDisplay({ results, type }) {
            // ... (see section 4.2)
        }
        
        // ========== CALCULATOR COMPONENTS ==========
        
        function TriggeredTaskCalculator() {
            // ... (see section 4.2)
        }
        
        function UltraTaskCalculator() {
            // ... (similar pattern)
        }
        
        function ScheduledTaskCalculator() {
            // ... (similar pattern)
        }
        
        function HeadlessUltraCalculator() {
            // ... (similar pattern)
        }
        
        // ========== DIAGRAM COMPONENTS ==========
        
        function DiagramTab() {
            // ... (see section 4.2)
        }
        
        function MonacoPane() {
            // ... (see section 6.1)
        }
        
        function ExcalidrawPane({ jsonInput }) {
            // ... (see section 6.2)
        }
        
        // ========== OTHER COMPONENTS ==========
        
        function Header() {
            // ... (see section 4.2)
        }
        
        function TabNav({ activeTab, onTabChange }) {
            // ... (see section 6.4)
        }
        
        function TabContent({ activeTab }) {
            // ... (see section 6.4)
        }
        
        function FAQTab() {
            // ... (see section 4.2)
        }
        
        function FAQItem({ question, answer }) {
            // ... (see section 4.2)
        }
        
        function PasswordModal() {
            // ... (see section 6.3)
        }
        
        function Footer() {
            // ... (see section 4.2)
        }
        
        // ========== ROOT APP COMPONENT ==========
        
        function App() {
            // ... (see section 4.1)
        }
        
        // ========== INITIALIZATION ==========
        
        function initializeApp() {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }
    </script>
</body>
</html>
```

### 7.2 Script Tag Organization

**Three Script Sections:**

1. **Vanilla JS Utilities (lines 35-250)**
   - `<script>` (no Babel transform)
   - Pure functions (calculators, diagram generators)
   - Constants
   - FAQ data

2. **React Application (lines 255-1100)**
   - `<script type="text/babel">` (JSX transform)
   - All React components
   - Context/state management
   - Initialization

**Why This Split?**
- Utilities are vanilla JS → no transform overhead
- React code isolated → easier to debug Babel issues
- Clear separation of concerns

### 7.3 CSS Organization

**Keep External File** (`styles.css`)

**Rationale:**
- Easier to edit (syntax highlighting, linting)
- Cacheable (browser caches separately)
- Inline CSS would add ~400 lines to HTML
- No benefit to inlining (not a performance bottleneck)

**Alternative Considered (Rejected):**
- **CSS-in-JS (styled-components)**: Requires build step or large runtime
- **Inline styles in JSX**: Loses pseudo-selectors, media queries

---

## 8. Constraints & Considerations

### 8.1 No Build Process Requirement

**Implications:**
- ✅ Cannot use TypeScript (requires tsc)
- ✅ Cannot use module imports (ESM requires bundler for browser compat)
- ✅ Cannot use npm packages directly
- ✅ Must use UMD builds from CDN

**Workarounds:**
- **Type Safety**: JSDoc comments for IDE support
  ```javascript
  /**
   * @typedef {Object} CalculatorResult
   * @property {number} nodes
   * @property {number} haNodes
   * @property {number} concurrent
   */
  
  /**
   * @param {Object} formValues
   * @param {number} formValues.apiPerDay
   * @returns {CalculatorResult}
   */
  function calculateTriggered(formValues) {
    // ...
  }
  ```

- **Module Pattern**: IIFE for encapsulation
  ```javascript
  const CalculatorUtils = (function() {
    function calculate() { /* ... */ }
    return { calculate };
  })();
  ```

### 8.2 Single File Constraint

**Challenges:**
- Large file size (~1,200 lines)
- Harder to navigate
- Git merge conflicts

**Mitigation:**
- **Clear Section Comments**: Use ASCII headers to visually separate
- **Consistent Ordering**: Always put components in same order
- **Find-in-File**: Rely on Cmd+F / Ctrl+F (search "function MonacoPane")
- **Editor Folding**: Use code folding to collapse sections

**Not a Dealbreaker:**
- 1,200 lines is manageable (< 2,000 threshold)
- Single file simplifies deployment (no build, no CDN upload)

### 8.3 Performance Implications of Babel Standalone

**Benchmark (Typical)**:
- **Transform Time**: ~50-100ms for 500 lines of JSX (one-time cost)
- **Runtime Overhead**: None (compiles to React.createElement calls)
- **Bundle Size**: ~300KB (uncompressed), ~5KB (gzipped)

**Is This Acceptable?**
- ✅ **Yes** for this app:
  - Not a performance-critical SaaS (internal tool)
  - One-time transform on page load (not per-render)
  - 100ms is imperceptible (user sees logo, content loads)
  
- ⚠️ **Consider Build Process If:**
  - Transform time > 500ms (page stutters)
  - Mobile users complain (slow devices)
  - App grows to > 2,000 lines JSX

**Optimization:**
- Load Babel `async` (don't block page render)
- Use production React build (dev build is 10x slower)
- Cache transformed code in sessionStorage (future)

### 8.4 Browser Compatibility Requirements

**Target:** Modern browsers (last 2 years)

| Feature | Browser Support | Fallback |
|---------|----------------|----------|
| **React 18** | Chrome 90+, Firefox 88+, Safari 14+ | None needed (modern only) |
| **ES6 (arrow functions, const/let)** | All modern browsers | None needed |
| **CSS Grid** | Chrome 57+, Firefox 52+, Safari 10.1+ | None needed |
| **Monaco Editor** | Chrome/Edge only (fully), degraded in Firefox/Safari | Show warning for Firefox/Safari |

**Monaco Warning Example:**

```jsx
function MonacoPane() {
  const [browserWarning, setBrowserWarning] = useState(null);
  
  useEffect(() => {
    const isFirefox = navigator.userAgent.includes('Firefox');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    if (isFirefox || isSafari) {
      setBrowserWarning(
        'Monaco Editor works best in Chrome/Edge. You may experience issues in Firefox/Safari.'
      );
    }
  }, []);
  
  return (
    <div className="json-input-panel">
      {browserWarning && (
        <div className="warning-banner">{browserWarning}</div>
      )}
      {/* ... rest of component */}
    </div>
  );
}
```

**IE11 Support:** ❌ Not supported (React 18 requires ES6)

---

## 9. Migration Plan (High-Level)

### 9.1 Phase 1: Foundation (Week 1)
1. Set up React 18 + Babel Standalone
2. Implement Context + Reducer
3. Create shared components (Button, FormField, ToggleSwitch)

### 9.2 Phase 2: Calculator Components (Week 2)
4. Migrate TriggeredTaskCalculator
5. Migrate UltraTaskCalculator
6. Migrate ScheduledTaskCalculator
7. Migrate HeadlessUltraCalculator

### 9.3 Phase 3: Diagram Tab (Week 3)
8. Migrate MonacoPane
9. Migrate ExcalidrawPane
10. Test diagram generation end-to-end

### 9.4 Phase 4: UI Components (Week 4)
11. Migrate TabNav + TabContent
12. Migrate FAQTab
13. Migrate PasswordModal
14. Polish + Bug Fixes

### 9.5 Success Criteria
- ✅ All features working (calculators, diagram, FAQ, password)
- ✅ No vanilla JS DOM manipulation remaining
- ✅ Code reduction: ~600 lines (50% less)
- ✅ Performance: Page load < 1 second, calculations instant

---

## 10. Future Enhancements (Post-Migration)

### 10.1 Short-Term (Next 6 Months)
- **Export Diagrams**: Download as PNG/SVG
- **Save Configurations**: LocalStorage for form values
- **Dark Mode**: Toggle CSS theme
- **Form Validation**: Real-time error messages

### 10.2 Long-Term (Next Year)
- **Build Process**: Consider Vite if app grows > 2,000 lines
- **TypeScript**: If team wants type safety
- **Unit Tests**: Jest for calculator functions
- **Backend API**: Save configurations to database

---

## 11. Appendix

### 11.1 Useful Resources
- [React 18 Docs](https://react.dev)
- [Context API Guide](https://react.dev/learn/passing-data-deeply-with-context)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [Excalidraw API](https://docs.excalidraw.com/)
- [Babel Standalone](https://babeljs.io/docs/en/babel-standalone)

### 11.2 Component Props Reference

```typescript
// Button
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  fullWidth?: boolean;
}

// FormField
interface FormFieldProps {
  type?: 'number' | 'select' | 'text';
  label: string;
  value: string | number;
  onChange: (e: ChangeEvent) => void;
  options?: { value: string; label: string }[];
  visible?: boolean;
  id: string;
}

// ToggleSwitch
interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (e: ChangeEvent) => void;
  id: string;
}

// ResultsDisplay
interface ResultsDisplayProps {
  results: CalculatorResult | null;
  type: 'triggered' | 'ultra' | 'scheduled' | 'headlessUltra';
}

// TabNav
interface TabNavProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

// TabContent
interface TabContentProps {
  activeTab: string;
}
```

### 11.3 Context API Reference

```typescript
interface CalculatorState {
  calculatorResults: {
    triggered: CalculatorResult | null;
    ultra: UltraCalculatorResult | null;
    scheduled: CalculatorResult | null;
    headlessUltra: CalculatorResult | null;
  };
  settings: {
    isUnlocked: boolean;
    isBatchSizeMode: boolean;
    isMicrobatchingMode: boolean;
  };
}

interface CalculatorResult {
  concurrent: number;
  nodes: number;
  haNodes: number;
}

interface UltraCalculatorResult {
  concurrent: number;
  execNodes: number;
  fmNodes: number;
  haExecNodes: number;
  haFmNodes: number;
}

type CalculatorAction =
  | { type: 'SET_TRIGGERED_RESULT'; payload: CalculatorResult }
  | { type: 'SET_ULTRA_RESULT'; payload: UltraCalculatorResult }
  | { type: 'SET_SCHEDULED_RESULT'; payload: CalculatorResult }
  | { type: 'SET_HEADLESS_ULTRA_RESULT'; payload: CalculatorResult }
  | { type: 'TOGGLE_UNLOCK' }
  | { type: 'TOGGLE_BATCH_SIZE_MODE' }
  | { type: 'TOGGLE_MICROBATCHING_MODE' };
```

---

**End of Document**

This architecture document serves as the blueprint for migrating the SnapLogic Node Sizing Calculator from a hybrid vanilla JS/React application to a full React architecture while maintaining the zero-build-process constraint. All technical decisions, component structures, and integration patterns are designed to be implemented within a single HTML file using CDN dependencies.
