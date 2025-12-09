# State Management Design Document

**Project:** SnapLogic Node Sizing Calculator - React Migration
**Date:** 2025-11-08
**Purpose:** Comprehensive state architecture for migrating from vanilla JavaScript to React

---

## 1. State Inventory

### 1.1 Current State Analysis

**Existing Global Variables (lines 266-269 in index.html):**
```javascript
let isBatchSize = true;          // Scheduled task toggle (GB vs Rows)
let isMicrobatching = true;      // Headless ultra task mode toggle
let pLocked = true;              // Password unlock status
let monacoEditor;                // Monaco editor instance
```

### 1.2 Complete State Categorization

#### **GLOBAL STATE (Shared Across Components)**

**A. Application Settings**
- `passwordUnlocked: boolean` - Controls visibility of advanced fields
- Category: Global, Persistent (session)

**B. Active Tab**
- `activeTab: string` - Currently active calculator tab ('tab1' through 'tab6')
- Category: Global, Ephemeral

**C. Calculator Results**
- `triggeredTaskResult: object | null` - Results from triggered task calculator
- `ultraTaskResult: object | null` - Results from ultra task calculator
- `scheduledTaskResult: object | null` - Results from scheduled task calculator
- `headlessUltraTaskResult: object | null` - Results from headless ultra task calculator
- Category: Global, Ephemeral (needed for diagram generation)

**D. Diagram State**
- `diagramJson: string` - Generated JSON configuration for diagram
- `monacoEditorInstance: object | null` - Monaco editor instance reference
- Category: Global, Ephemeral

#### **LOCAL STATE (Component-Specific)**

**E. Calculator Form Inputs** (4 separate calculator components)
- Triggered Task inputs: apiPerDay, coverageHours, apiResponseTime, peak
- Ultra Task inputs: apiPerDayUltra, coverageHoursUltra, apiResponseTimeUltra, peakUltra
- Scheduled Task inputs: batchSize, processTime, complexityMultiplier, isBatchSize
- Headless Ultra inputs: eventPerDay, coverageHoursEvent, eventResponseTime, eventSize, peakEvent, isMicrobatching
- Category: Local, Ephemeral

**F. UI Component State**
- Password popup visibility: `showPasswordPopup: boolean`
- Password input value: `passwordInput: string`
- FAQ accordion state: `activeFaqIndex: number | null`
- Category: Local, Ephemeral

---

## 2. State Architecture Decision

### 2.1 Chosen Approach: **React Context API**

**Rationale:**
1. **Simplicity** - No external dependencies, built into React
2. **Right-sized** - Application has moderate state complexity, not warranting Redux/MobX
3. **Multiple Contexts** - Allows logical separation of concerns
4. **Performance** - Can optimize re-renders with multiple smaller contexts
5. **Migration-friendly** - Easy to upgrade to more complex solution if needed

### 2.2 Alternatives Considered (and rejected)

**Redux/Redux Toolkit:**
- ❌ Overkill for this application size
- ❌ Adds significant boilerplate
- ❌ Learning curve for team
- ✅ Would be useful if: scaling to 20+ components, time-travel debugging needed

**Zustand/Jotai:**
- ❌ External dependency
- ✅ Would consider if: Context API causes performance issues

**Component Props Drilling:**
- ❌ Calculator results need to be accessed by non-adjacent components (diagram generator)
- ❌ Active tab state needed in multiple places

### 2.3 Number of Contexts: **3 Contexts**

**Why Multiple Contexts?**
1. **Performance Optimization** - Components only re-render when their specific context changes
2. **Separation of Concerns** - Clear boundaries between different state domains
3. **Easier Testing** - Can test contexts independently

**Context Breakdown:**
1. **AppContext** - App-wide settings and UI state (password unlock, active tab)
2. **CalculatorContext** - Calculator results for diagram generation
3. **DiagramContext** - Diagram JSON and Monaco editor instance

---

## 3. Global State Design

### 3.1 Context Structures

#### **AppContext**
```javascript
{
  // Settings
  passwordUnlocked: false,
  
  // Navigation
  activeTab: 'tab1',
  
  // Methods
  setPasswordUnlocked: (unlocked: boolean) => void,
  setActiveTab: (tabName: string) => void
}
```

**Rationale:**
- Small, frequently accessed state
- Changes affect multiple components (tab visibility, field visibility)
- No complex update logic needed

#### **CalculatorContext**
```javascript
{
  results: {
    triggered: {
      concurrentAPI: number,
      nodesRequired: number,
      haNodesRequired: number
    } | null,
    
    ultra: {
      concurrentAPI: number,
      executionNodesRequired: number,
      fmNodesRequired: number,
      haExecutionNodesRequired: number,
      haFmNodesRequired: number
    } | null,
    
    scheduled: {
      mbPerMinute: number,
      nodesRequired: number,
      haNodesRequired: number
    } | null,
    
    headlessUltra: {
      concurrentEvent: number,
      eventPerMinute: number,
      mbPerMinute: number,
      executionNodesRequired: number,
      haExecutionNodesRequired: number
    } | null
  },
  
  // Methods
  setTriggeredResult: (result: object | null) => void,
  setUltraResult: (result: object | null) => void,
  setScheduledResult: (result: object | null) => void,
  setHeadlessUltraResult: (result: object | null) => void,
  clearAllResults: () => void
}
```

**Rationale:**
- Results only updated on calculation button click (infrequent updates)
- Diagram generator needs access to all results
- Structured to match current result format from calculations

#### **DiagramContext**
```javascript
{
  diagramJson: '',
  monacoEditorInstance: null,
  
  // Methods
  setDiagramJson: (json: string) => void,
  setMonacoEditorInstance: (instance: object) => void,
  generateJsonFromResults: () => void  // Derived from CalculatorContext
}
```

**Rationale:**
- Monaco editor instance needs to be accessible by both JSON generator and diagram generator
- JSON generation logic can be centralized here
- Diagram-specific state isolated from calculator logic

### 3.2 Provider Hierarchy

```jsx
<AppProvider>
  <CalculatorProvider>
    <DiagramProvider>
      <App />
    </DiagramProvider>
  </CalculatorProvider>
</AppProvider>
```

**Nesting Order Justification:**
1. **AppProvider** (outermost) - Most fundamental state, changes affect everything
2. **CalculatorProvider** (middle) - Diagram depends on calculator results
3. **DiagramProvider** (inner) - Only diagram tab needs this context

### 3.3 Access Patterns (Custom Hooks)

```javascript
// hooks/useApp.js
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// hooks/useCalculator.js
export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (!context) {
    throw new Error('useCalculator must be used within CalculatorProvider');
  }
  return context;
};

// hooks/useDiagram.js
export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (!context) {
    throw new Error('useDiagram must be used within DiagramProvider');
  }
  return context;
};
```

**Benefits:**
- Error checking if context used outside provider
- Autocomplete support in IDEs
- Single import point for context

---

## 4. Local State Design

### 4.1 Component Local State (useState)

**Calculator Form Components:**
```javascript
// Example: TriggeredTaskCalculator.jsx
const [formInputs, setFormInputs] = useState({
  apiPerDay: 833333,
  coverageHours: 24,
  apiResponseTime: 1,
  peak: 150
});
```

**Justification for Local State:**
- ✅ Form inputs only relevant to specific calculator
- ✅ No other components need this data
- ✅ Reduces global state complexity
- ✅ Form state updated frequently (every keystroke)
- ✅ Only final result (on button click) goes to global state

**UI Component State:**
```javascript
// PasswordPopup.jsx
const [password, setPassword] = useState('');
const [showPopup, setShowPopup] = useState(false);

// FAQ.jsx
const [activeIndex, setActiveIndex] = useState(null);
```

**Justification:**
- ✅ Transient UI state
- ✅ No persistence needed
- ✅ Component-specific behavior

### 4.2 When to Keep State Local

**Decision Matrix:**

| Criteria | Local State | Global State |
|----------|-------------|--------------|
| Used by multiple components? | No | Yes |
| Persists across navigation? | No | Maybe |
| Updated frequently? | Maybe | Prefer No |
| Derived from other state? | Compute locally | useMemo |
| Form input state? | Yes | No |
| Needs to survive unmount? | No | Yes |

---

## 5. State Shape Specification

### 5.1 Complete State Tree

```javascript
// AppContext State
const appState = {
  passwordUnlocked: false,
  activeTab: 'tab1'
};

// CalculatorContext State
const calculatorState = {
  results: {
    triggered: {
      concurrentAPI: 14.47,
      nodesRequired: 0.72,
      haNodesRequired: 2
    } | null,
    
    ultra: {
      concurrentAPI: 12.04,
      executionNodesRequired: 0.04,
      fmNodesRequired: 0.02,
      haExecutionNodesRequired: 2,
      haFmNodesRequired: 2
    } | null,
    
    scheduled: {
      mbPerMinute: 42.67,
      nodesRequired: 0.14,
      haNodesRequired: 2
    } | null,
    
    headlessUltra: {
      concurrentEvent: 694.44,
      eventPerMinute: 41666.67,
      mbPerMinute: 115.74,
      executionNodesRequired: 2.08,
      haExecutionNodesRequired: 3
    } | null
  }
};

// DiagramContext State
const diagramState = {
  diagramJson: '{"msg": "Click Generate JSON button"}',
  monacoEditorInstance: null
};
```

### 5.2 TypeScript Interface (Future Consideration)

```typescript
// types/state.ts

// App State
interface AppSettings {
  passwordUnlocked: boolean;
}

interface AppState {
  passwordUnlocked: boolean;
  activeTab: 'tab1' | 'tab2' | 'tab3' | 'tab4' | 'tab5' | 'tab6';
}

// Calculator State
interface TriggeredTaskResult {
  concurrentAPI: number;
  nodesRequired: number;
  haNodesRequired: number;
}

interface UltraTaskResult {
  concurrentAPI: number;
  executionNodesRequired: number;
  fmNodesRequired: number;
  haExecutionNodesRequired: number;
  haFmNodesRequired: number;
}

interface ScheduledTaskResult {
  mbPerMinute: number;
  nodesRequired: number;
  haNodesRequired: number;
}

interface HeadlessUltraTaskResult {
  concurrentEvent: number;
  eventPerMinute?: number;
  mbPerMinute?: number;
  executionNodesRequired: number;
  haExecutionNodesRequired: number;
}

interface CalculatorResults {
  triggered: TriggeredTaskResult | null;
  ultra: UltraTaskResult | null;
  scheduled: ScheduledTaskResult | null;
  headlessUltra: HeadlessUltraTaskResult | null;
}

// Diagram State
interface DiagramState {
  diagramJson: string;
  monacoEditorInstance: any | null;  // Monaco editor type
}
```

---

## 6. State Update Patterns

### 6.1 Context Providers Implementation

#### **AppProvider Pattern**
```javascript
// contexts/AppContext.jsx
import React, { createContext, useState } from 'react';

export const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState('tab1');

  const value = {
    passwordUnlocked,
    setPasswordUnlocked,
    activeTab,
    setActiveTab
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

**Update Pattern:**
```javascript
// In PasswordPopup.jsx
const { setPasswordUnlocked } = useApp();

const handlePasswordSubmit = (password) => {
  if (password === 'snapLogic4snapLogic') {
    setPasswordUnlocked(true);
  }
};
```

#### **CalculatorProvider Pattern with Reducer** (Alternative)

For more complex update logic, can use useReducer:

```javascript
// contexts/CalculatorContext.jsx
const calculatorReducer = (state, action) => {
  switch (action.type) {
    case 'SET_TRIGGERED_RESULT':
      return {
        ...state,
        results: { ...state.results, triggered: action.payload }
      };
    case 'SET_ULTRA_RESULT':
      return {
        ...state,
        results: { ...state.results, ultra: action.payload }
      };
    case 'SET_SCHEDULED_RESULT':
      return {
        ...state,
        results: { ...state.results, scheduled: action.payload }
      };
    case 'SET_HEADLESS_ULTRA_RESULT':
      return {
        ...state,
        results: { ...state.results, headlessUltra: action.payload }
      };
    case 'CLEAR_ALL_RESULTS':
      return {
        results: {
          triggered: null,
          ultra: null,
          scheduled: null,
          headlessUltra: null
        }
      };
    default:
      return state;
  }
};

export const CalculatorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(calculatorReducer, {
    results: {
      triggered: null,
      ultra: null,
      scheduled: null,
      headlessUltra: null
    }
  });

  const setTriggeredResult = (result) => 
    dispatch({ type: 'SET_TRIGGERED_RESULT', payload: result });
  
  const setUltraResult = (result) => 
    dispatch({ type: 'SET_ULTRA_RESULT', payload: result });
  
  const setScheduledResult = (result) => 
    dispatch({ type: 'SET_SCHEDULED_RESULT', payload: result });
  
  const setHeadlessUltraResult = (result) => 
    dispatch({ type: 'SET_HEADLESS_ULTRA_RESULT', payload: result });
  
  const clearAllResults = () => 
    dispatch({ type: 'CLEAR_ALL_RESULTS' });

  const value = {
    results: state.results,
    setTriggeredResult,
    setUltraResult,
    setScheduledResult,
    setHeadlessUltraResult,
    clearAllResults
  };

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};
```

**Recommendation:** Start with useState, migrate to useReducer if update logic becomes complex.

### 6.2 Form Submission Flow

```javascript
// Example: TriggeredTaskCalculator.jsx
const TriggeredTaskCalculator = () => {
  const { passwordUnlocked } = useApp();
  const { setTriggeredResult } = useCalculator();
  
  // Local form state
  const [formInputs, setFormInputs] = useState({
    apiPerDay: 833333,
    coverageHours: 24,
    apiResponseTime: 1,
    peak: 150
  });

  const handleInputChange = (field, value) => {
    setFormInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = () => {
    // Perform calculation
    const { apiPerDay, coverageHours, peak, apiResponseTime } = formInputs;
    
    const concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100);
    const nodesRequired = concurrentAPI / (20 / apiResponseTime);
    const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));

    // Store result in global state
    setTriggeredResult({
      concurrentAPI,
      nodesRequired,
      haNodesRequired
    });
  };

  return (
    <form>
      <input 
        type="number" 
        value={formInputs.apiPerDay}
        onChange={(e) => handleInputChange('apiPerDay', e.target.value)}
      />
      
      {passwordUnlocked && (
        <input 
          type="number" 
          value={formInputs.apiResponseTime}
          onChange={(e) => handleInputChange('apiResponseTime', e.target.value)}
        />
      )}
      
      <button type="button" onClick={handleCalculate}>Calculate</button>
    </form>
  );
};
```

### 6.3 Diagram JSON Generation from State

```javascript
// contexts/DiagramContext.jsx
import { useCalculator } from '../hooks/useCalculator';

export const DiagramProvider = ({ children }) => {
  const { results } = useCalculator();
  const [diagramJson, setDiagramJson] = useState('');
  const [monacoEditorInstance, setMonacoEditorInstance] = useState(null);

  const generateJsonFromResults = useCallback(() => {
    const { triggered, ultra, scheduled, headlessUltra } = results;
    
    const triggeredNodes = triggered?.haNodesRequired || 0;
    const ultraExecutionNodes = ultra?.haExecutionNodesRequired || 0;
    const ultraFMNodes = ultra?.haFmNodesRequired || 0;
    const scheduledNodes = scheduled?.haNodesRequired || 0;
    const headlessUltraNodes = headlessUltra?.haExecutionNodesRequired || 0;

    if (triggeredNodes + ultraExecutionNodes + ultraFMNodes + scheduledNodes + headlessUltraNodes === 0) {
      const json = {
        msg: "No calculations have been performed yet. Please use the calculator tabs and click 'Calculate' before generating the JSON."
      };
      const formattedJson = JSON.stringify(json, null, 2);
      setDiagramJson(formattedJson);
      return;
    }

    const jsonOutput = [
      {
        ControlPlane: "US",
        OrgName: "MyOrg-prod",
        Snaplex: []
      }
    ];

    // Real-time snaplex
    if (triggeredNodes + ultraExecutionNodes + ultraFMNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "real-time",
        type: "cloudplex",
        nodes: [
          ...Array(triggeredNodes + ultraExecutionNodes).fill({ type: "JCC", size: "m" }),
          ...Array(ultraFMNodes).fill({ type: "FM", size: "m" })
        ]
      });
    }

    // Scheduled snaplex
    if (scheduledNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "scheduled",
        type: "cloudplex",
        nodes: Array(scheduledNodes).fill({ type: "JCC", size: "m" })
      });
    }

    // Headless ultra snaplex
    if (headlessUltraNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "headless-ultra",
        type: "cloudplex",
        nodes: Array(headlessUltraNodes).fill({ type: "JCC", size: "m" })
      });
    }

    const formattedJson = JSON.stringify(jsonOutput, null, 2);
    setDiagramJson(formattedJson);
    
    // Update Monaco editor if available
    if (monacoEditorInstance) {
      monacoEditorInstance.setValue(formattedJson);
    }
  }, [results, monacoEditorInstance]);

  const value = {
    diagramJson,
    setDiagramJson,
    monacoEditorInstance,
    setMonacoEditorInstance,
    generateJsonFromResults
  };

  return (
    <DiagramContext.Provider value={value}>
      {children}
    </DiagramContext.Provider>
  );
};
```

---

## 7. Derived State

### 7.1 Computed Values with useMemo

**Example: Total Nodes Across All Calculators**

```javascript
// In DiagramContext or custom hook
const useTotalNodes = () => {
  const { results } = useCalculator();
  
  const totalNodes = useMemo(() => {
    const triggered = results.triggered?.haNodesRequired || 0;
    const ultraExec = results.ultra?.haExecutionNodesRequired || 0;
    const ultraFm = results.ultra?.haFmNodesRequired || 0;
    const scheduled = results.scheduled?.haNodesRequired || 0;
    const headless = results.headlessUltra?.haExecutionNodesRequired || 0;
    
    return {
      total: triggered + ultraExec + ultraFm + scheduled + headless,
      byType: {
        triggered,
        ultraExecution: ultraExec,
        ultraFeedmaster: ultraFm,
        scheduled,
        headlessUltra: headless
      }
    };
  }, [results]);
  
  return totalNodes;
};
```

**Usage:**
```javascript
const DiagramTab = () => {
  const totalNodes = useTotalNodes();
  
  return (
    <div>
      <p>Total nodes required: {totalNodes.total}</p>
    </div>
  );
};
```

### 7.2 Memoization Strategy

**When to use useMemo:**
- ✅ Expensive calculations (e.g., aggregating results)
- ✅ Derived arrays/objects that trigger re-renders
- ✅ Values used as dependencies in other hooks

**When NOT to use useMemo:**
- ❌ Simple arithmetic or string operations
- ❌ Premature optimization
- ❌ Values that change every render anyway

**Example: Don't Memo Simple Checks**
```javascript
// ❌ Unnecessary
const hasResults = useMemo(() => 
  results.triggered !== null, 
  [results.triggered]
);

// ✅ Better
const hasResults = results.triggered !== null;
```

### 7.3 Performance Considerations

**Context Re-render Optimization:**

```javascript
// Split context value into stable references
export const CalculatorProvider = ({ children }) => {
  const [results, setResults] = useState({
    triggered: null,
    ultra: null,
    scheduled: null,
    headlessUltra: null
  });

  // Memoize methods to prevent re-renders
  const setTriggeredResult = useCallback((result) => {
    setResults(prev => ({ ...prev, triggered: result }));
  }, []);

  const setUltraResult = useCallback((result) => {
    setResults(prev => ({ ...prev, ultra: result }));
  }, []);

  // Memoize entire context value
  const value = useMemo(() => ({
    results,
    setTriggeredResult,
    setUltraResult,
    // ... other methods
  }), [results, setTriggeredResult, setUltraResult]);

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};
```

**Component Optimization:**
```javascript
// Wrap components that shouldn't re-render often
const TriggeredTaskCalculator = React.memo(({ }) => {
  // Component implementation
});

// Only re-render if specific context values change
const DiagramTab = () => {
  const { results } = useCalculator();
  
  // Only subscribe to what you need
  const triggeredNodes = results.triggered?.haNodesRequired;
  
  return <div>Nodes: {triggeredNodes}</div>;
};
```

---

## 8. State Initialization

### 8.1 Default Values

```javascript
// constants/defaults.js
export const DEFAULT_FORM_VALUES = {
  triggeredTask: {
    apiPerDay: 833333,
    coverageHours: 24,
    apiResponseTime: 1,
    peak: 150
  },
  ultraTask: {
    apiPerDay: 416667,
    coverageHours: 12,
    apiResponseTime: 0.3,
    peak: 150
  },
  scheduledTask: {
    batchSize: 300,
    processTime: 12,
    complexityMultiplier: 1,
    isBatchSize: true
  },
  headlessUltraTask: {
    eventPerDay: 20000000,
    coverageHours: 24,
    eventResponseTime: 0.3,
    eventSize: 2000,
    peak: 150,
    isMicrobatching: true
  }
};

export const DEFAULT_APP_STATE = {
  passwordUnlocked: false,
  activeTab: 'tab1'
};

export const DEFAULT_CALCULATOR_STATE = {
  results: {
    triggered: null,
    ultra: null,
    scheduled: null,
    headlessUltra: null
  }
};

export const DEFAULT_DIAGRAM_STATE = {
  diagramJson: '{"msg": "Click on the Generate JSON button to start"}',
  monacoEditorInstance: null
};
```

### 8.2 Loading State (Future Consideration)

```javascript
// If integrating with backend or localStorage
const CalculatorProvider = ({ children }) => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage
    const savedResults = localStorage.getItem('calculatorResults');
    if (savedResults) {
      setResults(JSON.parse(savedResults));
    } else {
      setResults(DEFAULT_CALCULATOR_STATE.results);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  // ... rest of provider
};
```

### 8.3 URL Parameters (Future Enhancement)

```javascript
// Example: Open to specific tab via URL
// URL: ?tab=ultra&autoCalculate=true

const AppProvider = ({ children }) => {
  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || 'tab1';
  
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // ... rest of provider
};
```

---

## 9. Context Provider Implementation

### 9.1 File Structure

```
src/
├── contexts/
│   ├── AppContext.jsx
│   ├── CalculatorContext.jsx
│   └── DiagramContext.jsx
├── hooks/
│   ├── useApp.js
│   ├── useCalculator.js
│   ├── useDiagram.js
│   └── useTotalNodes.js (custom derived state hook)
├── constants/
│   └── defaults.js
└── types/ (future)
    └── state.ts
```

### 9.2 AppContext Full Implementation

```javascript
// contexts/AppContext.jsx
import React, { createContext, useState, useMemo, useCallback } from 'react';
import { DEFAULT_APP_STATE } from '../constants/defaults';

export const AppContext = createContext(undefined);

export const AppProvider = ({ children }) => {
  const [passwordUnlocked, setPasswordUnlocked] = useState(
    DEFAULT_APP_STATE.passwordUnlocked
  );
  const [activeTab, setActiveTab] = useState(
    DEFAULT_APP_STATE.activeTab
  );

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSetPasswordUnlocked = useCallback((unlocked) => {
    setPasswordUnlocked(unlocked);
  }, []);

  const handleSetActiveTab = useCallback((tabName) => {
    setActiveTab(tabName);
    
    // Side effect: Update body class for diagram tab
    if (tabName === 'tab5') {
      document.body.classList.add('diagram-tab-active');
    } else {
      document.body.classList.remove('diagram-tab-active');
    }
  }, []);

  const value = useMemo(() => ({
    passwordUnlocked,
    setPasswordUnlocked: handleSetPasswordUnlocked,
    activeTab,
    setActiveTab: handleSetActiveTab
  }), [passwordUnlocked, activeTab, handleSetPasswordUnlocked, handleSetActiveTab]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
```

### 9.3 CalculatorContext Full Implementation

```javascript
// contexts/CalculatorContext.jsx
import React, { createContext, useState, useMemo, useCallback } from 'react';
import { DEFAULT_CALCULATOR_STATE } from '../constants/defaults';

export const CalculatorContext = createContext(undefined);

export const CalculatorProvider = ({ children }) => {
  const [results, setResults] = useState(DEFAULT_CALCULATOR_STATE.results);

  const setTriggeredResult = useCallback((result) => {
    setResults(prev => ({ ...prev, triggered: result }));
  }, []);

  const setUltraResult = useCallback((result) => {
    setResults(prev => ({ ...prev, ultra: result }));
  }, []);

  const setScheduledResult = useCallback((result) => {
    setResults(prev => ({ ...prev, scheduled: result }));
  }, []);

  const setHeadlessUltraResult = useCallback((result) => {
    setResults(prev => ({ ...prev, headlessUltra: result }));
  }, []);

  const clearAllResults = useCallback(() => {
    setResults({
      triggered: null,
      ultra: null,
      scheduled: null,
      headlessUltra: null
    });
  }, []);

  const value = useMemo(() => ({
    results,
    setTriggeredResult,
    setUltraResult,
    setScheduledResult,
    setHeadlessUltraResult,
    clearAllResults
  }), [
    results, 
    setTriggeredResult, 
    setUltraResult, 
    setScheduledResult, 
    setHeadlessUltraResult,
    clearAllResults
  ]);

  return (
    <CalculatorContext.Provider value={value}>
      {children}
    </CalculatorContext.Provider>
  );
};
```

### 9.4 DiagramContext Full Implementation

```javascript
// contexts/DiagramContext.jsx
import React, { createContext, useState, useMemo, useCallback } from 'react';
import { DEFAULT_DIAGRAM_STATE } from '../constants/defaults';
import { useCalculator } from '../hooks/useCalculator';

export const DiagramContext = createContext(undefined);

export const DiagramProvider = ({ children }) => {
  const { results } = useCalculator();
  const [diagramJson, setDiagramJson] = useState(DEFAULT_DIAGRAM_STATE.diagramJson);
  const [monacoEditorInstance, setMonacoEditorInstance] = useState(null);

  const generateJsonFromResults = useCallback(() => {
    const { triggered, ultra, scheduled, headlessUltra } = results;
    
    const triggeredNodes = Math.ceil(triggered?.haNodesRequired || 0);
    const ultraExecutionNodes = Math.ceil(ultra?.haExecutionNodesRequired || 0);
    const ultraFMNodes = Math.ceil(ultra?.haFmNodesRequired || 0);
    const scheduledNodes = Math.ceil(scheduled?.haNodesRequired || 0);
    const headlessUltraNodes = Math.ceil(headlessUltra?.haExecutionNodesRequired || 0);

    if (triggeredNodes + ultraExecutionNodes + ultraFMNodes + scheduledNodes + headlessUltraNodes === 0) {
      const json = {
        msg: "No calculations have been performed yet. Please use the calculator tabs and click 'Calculate' before generating the JSON."
      };
      const formattedJson = JSON.stringify(json, null, 2);
      setDiagramJson(formattedJson);
      if (monacoEditorInstance) {
        monacoEditorInstance.setValue(formattedJson);
      }
      return;
    }

    const jsonOutput = [
      {
        ControlPlane: "US",
        OrgName: "MyOrg-prod",
        Snaplex: []
      }
    ];

    // Real-time snaplex
    if (triggeredNodes + ultraExecutionNodes + ultraFMNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "real-time",
        type: "cloudplex",
        nodes: [
          ...Array(triggeredNodes + ultraExecutionNodes).fill({ type: "JCC", size: "m" }),
          ...Array(ultraFMNodes).fill({ type: "FM", size: "m" })
        ]
      });
    }

    // Scheduled snaplex
    if (scheduledNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "scheduled",
        type: "cloudplex",
        nodes: Array(scheduledNodes).fill({ type: "JCC", size: "m" })
      });
    }

    // Headless ultra snaplex
    if (headlessUltraNodes > 0) {
      jsonOutput[0].Snaplex.push({
        name: "headless-ultra",
        type: "cloudplex",
        nodes: Array(headlessUltraNodes).fill({ type: "JCC", size: "m" })
      });
    }

    const formattedJson = JSON.stringify(jsonOutput, null, 2);
    setDiagramJson(formattedJson);
    
    if (monacoEditorInstance) {
      monacoEditorInstance.setValue(formattedJson);
    }
  }, [results, monacoEditorInstance]);

  const value = useMemo(() => ({
    diagramJson,
    setDiagramJson,
    monacoEditorInstance,
    setMonacoEditorInstance,
    generateJsonFromResults
  }), [diagramJson, monacoEditorInstance, generateJsonFromResults]);

  return (
    <DiagramContext.Provider value={value}>
      {children}
    </DiagramContext.Provider>
  );
};
```

### 9.5 Custom Hooks

```javascript
// hooks/useApp.js
import { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// hooks/useCalculator.js
import { useContext } from 'react';
import { CalculatorContext } from '../contexts/CalculatorContext';

export const useCalculator = () => {
  const context = useContext(CalculatorContext);
  if (context === undefined) {
    throw new Error('useCalculator must be used within CalculatorProvider');
  }
  return context;
};

// hooks/useDiagram.js
import { useContext } from 'react';
import { DiagramContext } from '../contexts/DiagramContext';

export const useDiagram = () => {
  const context = useContext(DiagramContext);
  if (context === undefined) {
    throw new Error('useDiagram must be used within DiagramProvider');
  }
  return context;
};

// hooks/useTotalNodes.js (custom derived state hook)
import { useMemo } from 'react';
import { useCalculator } from './useCalculator';

export const useTotalNodes = () => {
  const { results } = useCalculator();
  
  return useMemo(() => {
    const triggered = results.triggered?.haNodesRequired || 0;
    const ultraExec = results.ultra?.haExecutionNodesRequired || 0;
    const ultraFm = results.ultra?.haFmNodesRequired || 0;
    const scheduled = results.scheduled?.haNodesRequired || 0;
    const headless = results.headlessUltra?.haExecutionNodesRequired || 0;
    
    return {
      total: Math.ceil(triggered + ultraExec + ultraFm + scheduled + headless),
      byType: {
        triggered: Math.ceil(triggered),
        ultraExecution: Math.ceil(ultraExec),
        ultraFeedmaster: Math.ceil(ultraFm),
        scheduled: Math.ceil(scheduled),
        headlessUltra: Math.ceil(headless)
      }
    };
  }, [results]);
};
```

---

## 10. Migration from Global Variables

### 10.1 Global Variable Mapping

| Current Global Variable | New State Location | Migration Notes |
|------------------------|-------------------|-----------------|
| `isBatchSize` | ScheduledTaskCalculator (local state) | Component-specific, stays local |
| `isMicrobatching` | HeadlessUltraCalculator (local state) | Component-specific, stays local |
| `pLocked` | AppContext.passwordUnlocked | Renamed for clarity, inverted boolean |
| `monacoEditor` | DiagramContext.monacoEditorInstance | Renamed for clarity |

### 10.2 Conversion Strategy

**Phase 1: Create Contexts (Week 1)**
1. Implement all three context providers
2. Implement custom hooks
3. Set up provider hierarchy in App.jsx
4. Create constants/defaults.js

**Phase 2: Migrate Password System (Week 1)**
1. Convert `pLocked` to `passwordUnlocked` in AppContext
2. Update PasswordPopup component to use useApp hook
3. Update all conditional field visibility to use passwordUnlocked from context
4. Remove global `pLocked` variable

**Phase 3: Migrate Calculator Components (Week 2-3)**
1. Convert each calculator to React component one at a time
2. Move form inputs to local useState
3. Connect calculation results to CalculatorContext
4. Test each calculator independently
5. Remove vanilla JS calculate functions

**Phase 4: Migrate Diagram System (Week 3)**
1. Convert Monaco editor initialization to use DiagramContext
2. Update generateDiagramJson to use context instead of DOM scraping
3. Connect Excalidraw component to DiagramContext
4. Remove global `monacoEditor` variable

**Phase 5: Migrate Tab System (Week 4)**
1. Convert tab switching to use AppContext.activeTab
2. Update openTab function to use setActiveTab
3. Remove DOM-based active class management
4. Implement React-based tab visibility

### 10.3 Backward Compatibility During Migration

**Strategy: Gradual Migration with Bridge Functions**

```javascript
// utils/legacyBridge.js
// Temporary bridge to maintain compatibility during migration

// Read from React state, write to global variable
export const syncToGlobal = (reactState) => {
  window.__legacyState = {
    pLocked: !reactState.passwordUnlocked,
    monacoEditor: reactState.monacoEditorInstance
  };
};

// Allow vanilla JS to read React state
export const getLegacyState = () => {
  return window.__legacyState;
};
```

**Usage in Transition Period:**
```javascript
// In AppProvider
useEffect(() => {
  // Sync React state to global during migration
  syncToGlobal({ passwordUnlocked, monacoEditorInstance });
}, [passwordUnlocked, monacoEditorInstance]);
```

**Remove bridge functions once migration is complete!**

### 10.4 Testing Strategy During Migration

**Unit Tests for Contexts:**
```javascript
// __tests__/AppContext.test.js
import { renderHook, act } from '@testing-library/react-hooks';
import { AppProvider } from '../contexts/AppContext';
import { useApp } from '../hooks/useApp';

test('passwordUnlocked defaults to false', () => {
  const { result } = renderHook(() => useApp(), {
    wrapper: AppProvider
  });
  expect(result.current.passwordUnlocked).toBe(false);
});

test('setPasswordUnlocked updates state', () => {
  const { result } = renderHook(() => useApp(), {
    wrapper: AppProvider
  });
  
  act(() => {
    result.current.setPasswordUnlocked(true);
  });
  
  expect(result.current.passwordUnlocked).toBe(true);
});
```

**Integration Tests:**
```javascript
// Test calculator result flow
test('calculator result stored in context', () => {
  const { result } = renderHook(() => useCalculator(), {
    wrapper: CalculatorProvider
  });
  
  const testResult = {
    concurrentAPI: 10.5,
    nodesRequired: 2.3,
    haNodesRequired: 3
  };
  
  act(() => {
    result.current.setTriggeredResult(testResult);
  });
  
  expect(result.current.results.triggered).toEqual(testResult);
});
```

---

## 11. Performance Optimization Checklist

### 11.1 Context Optimization

- [ ] Memoize context values with useMemo
- [ ] Memoize setter functions with useCallback
- [ ] Split contexts by update frequency (fast-changing vs slow-changing)
- [ ] Use multiple small contexts instead of one large context
- [ ] Only subscribe to needed context values in components

### 11.2 Component Optimization

- [ ] Use React.memo for pure components
- [ ] Use useCallback for event handlers passed to child components
- [ ] Use useMemo for expensive calculations
- [ ] Avoid inline object/array creation in render
- [ ] Lazy load heavy components (Excalidraw, Monaco)

### 11.3 Rendering Optimization

```javascript
// Example: Prevent unnecessary re-renders
const ResultDisplay = React.memo(({ result }) => {
  return (
    <div>
      <h2>Results</h2>
      <p>Nodes Required: {result.haNodesRequired}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if result actually changed
  return prevProps.result?.haNodesRequired === nextProps.result?.haNodesRequired;
});
```

---

## 12. Future Enhancements

### 12.1 Persistence

**localStorage Integration:**
```javascript
// hooks/useLocalStorage.js
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
};

// Usage in CalculatorProvider
const [results, setResults] = useLocalStorage('calculatorResults', DEFAULT_CALCULATOR_STATE.results);
```

### 12.2 Undo/Redo Functionality

```javascript
// hooks/useHistory.js
const useHistory = (initialState) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];

  const setState = (newState) => {
    const newHistory = history.slice(0, currentIndex + 1);
    setHistory([...newHistory, newState]);
    setCurrentIndex(newHistory.length);
  };

  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return { state, setState, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
};
```

### 12.3 State Debugging

**Redux DevTools Integration (even without Redux):**
```javascript
// utils/devtools.js
export const connectToDevTools = (state, stateName) => {
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
      name: stateName
    });
    
    devTools.init(state);
    
    return (newState, action) => {
      devTools.send(action, newState);
    };
  }
  
  return () => {};
};

// Usage in context
const sendToDevTools = connectToDevTools(initialState, 'CalculatorContext');

const setTriggeredResult = (result) => {
  setResults(prev => {
    const newState = { ...prev, triggered: result };
    sendToDevTools(newState, { type: 'SET_TRIGGERED_RESULT', payload: result });
    return newState;
  });
};
```

---

## 13. Summary & Recommendations

### 13.1 Architecture Summary

**Chosen Pattern:** React Context API with multiple contexts
- **3 Contexts:** AppContext, CalculatorContext, DiagramContext
- **State Scope:** Global state in contexts, local state in components
- **Update Pattern:** useState + useCallback/useMemo for optimization

### 13.2 Key Design Decisions

1. **Multiple Contexts over Single Global Store**
   - Prevents unnecessary re-renders
   - Clear separation of concerns
   - Easier to test and maintain

2. **Calculator Results in Global State**
   - Required by diagram generator
   - Alternative (scraping DOM) is anti-pattern in React

3. **Form Inputs Stay Local**
   - High-frequency updates
   - Component-specific
   - No cross-component dependencies

4. **Derived State with useMemo**
   - Total node calculations
   - JSON generation from results
   - Prevents expensive re-calculations

### 13.3 Implementation Checklist

**Week 1:**
- [ ] Create context providers (AppContext, CalculatorContext, DiagramContext)
- [ ] Create custom hooks (useApp, useCalculator, useDiagram)
- [ ] Create constants/defaults.js
- [ ] Set up provider hierarchy
- [ ] Migrate password system

**Week 2:**
- [ ] Convert TriggeredTaskCalculator to React
- [ ] Convert UltraTaskCalculator to React
- [ ] Connect calculators to CalculatorContext
- [ ] Test calculator state flow

**Week 3:**
- [ ] Convert ScheduledTaskCalculator to React
- [ ] Convert HeadlessUltraCalculator to React
- [ ] Migrate Monaco editor to DiagramContext
- [ ] Migrate diagram JSON generation

**Week 4:**
- [ ] Migrate tab system to AppContext
- [ ] Remove all global variables
- [ ] Remove legacy bridge code
- [ ] Performance optimization pass
- [ ] Final testing

### 13.4 Success Metrics

**Code Quality:**
- ✅ Zero global variables (except React libraries)
- ✅ All state changes through React state management
- ✅ No direct DOM manipulation for state

**Performance:**
- ✅ No unnecessary re-renders (verify with React DevTools Profiler)
- ✅ Fast tab switching (<100ms)
- ✅ Smooth diagram generation

**Maintainability:**
- ✅ Clear data flow (props down, callbacks up)
- ✅ Single source of truth for each piece of state
- ✅ Easy to add new calculator types

### 13.5 When to Reconsider This Architecture

**Migrate to Redux/Zustand if:**
- State complexity grows beyond 10+ contexts
- Need middleware (logging, async actions)
- Team needs Redux DevTools time-travel debugging
- Need state normalization for large datasets

**Migrate to Server State Library (React Query) if:**
- Adding backend API for saving/loading calculations
- Need caching, background sync
- Need optimistic updates

---

## Appendix A: Quick Reference

### Context Imports
```javascript
import { useApp } from '../hooks/useApp';
import { useCalculator } from '../hooks/useCalculator';
import { useDiagram } from '../hooks/useDiagram';
```

### Common Patterns
```javascript
// Get password unlock status
const { passwordUnlocked } = useApp();

// Set calculator result
const { setTriggeredResult } = useCalculator();
setTriggeredResult({ concurrentAPI: 10.5, nodesRequired: 2, haNodesRequired: 3 });

// Generate diagram JSON
const { generateJsonFromResults } = useDiagram();
generateJsonFromResults();
```

### State Access Patterns
```javascript
// Read state
const { results } = useCalculator();
const triggeredNodes = results.triggered?.haNodesRequired;

// Update state
const { setActiveTab } = useApp();
setActiveTab('tab5');

// Derived state
const totalNodes = useTotalNodes();
console.log(totalNodes.total);
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-08  
**Author:** Claude Code State Management Architecture Team
