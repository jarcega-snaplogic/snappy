# SnapLogic Node Sizing Calculator

A self-contained, single-page web application that helps estimate infrastructure requirements for SnapLogic deployments. Built with React 18, this calculator provides sizing recommendations based on the [SnapLogic Sigma Framework Capacity Guide](https://community.snaplogic.com/t5/sigma-framework-library/snaplex-capacity-tuning-guide/td-p/23787).

## Features

### 🧮 Four Calculator Types

1. **Triggered Task Calculator**
   - Estimates nodes for API-triggered tasks
   - Default: 833,333 API calls/day (300M/year)
   - Factors in peak load, coverage hours, and response time
   - 20 TPS per node baseline

2. **Ultra Task Calculator**
   - High-throughput API processing
   - Separate calculations for Execution and FeedMaster nodes
   - 100 TPS per execution node, 200 TPS per FM node
   - Default: 416,667 API calls/day (100M/year)

3. **Scheduled Task Calculator**
   - Batch processing workloads
   - GB or row count input modes
   - 300 MB/min per node baseline
   - Transformation complexity multiplier

4. **Headless Ultra Task Calculator**
   - Event-driven processing
   - Microbatching and non-microbatching modes
   - Message size considerations
   - 150 MB/min per node (non-microbatching)

### 📊 Visual Diagram Generation

- **Interactive Architecture Diagrams**: Generate SnapLogic infrastructure topology diagrams
- **Monaco Editor**: JSON editor with syntax highlighting for diagram configuration
- **Excalidraw Integration**: Beautiful, interactive diagrams showing:
  - Organization containers with regional emoji indicators
  - Snaplex groupings (cloudplex ☁️ / groundplex 🏠)
  - Node representations (JCC 🖥️ / FM 🔄)
  - FM→JCC relationships with arrows

### 🔒 Advanced Features (Password Protected)

Password: `snapLogic4snapLogic`

Unlock hidden inputs for:
- Custom API/Event response times
- Transformation complexity multipliers
- Message size for headless ultra tasks

### ❓ FAQ Section

Comprehensive FAQ covering:
- Node types and their roles
- Node sizes and configurations
- Auto-scaling with Kubernetes
- Cloud provider recommendations (AWS, Azure, GCP)

## Technology Stack

- **React 18.3.1** - UI framework with concurrent features
- **Babel Standalone 7** - In-browser JSX transformation
- **Monaco Editor 0.30.1** - JSON editor with syntax highlighting
- **Excalidraw 0.15.2** - Interactive diagram generation
- **Pure HTML/CSS/JavaScript** - No build process required

## Quick Start

### Run Locally

**Option 1: Direct File Access**
```bash
# Open directly in browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

**Option 2: HTTP Server (Recommended)**
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with http-server)
npx http-server -p 8000

# Then visit: http://localhost:8000
```

### Deploy to Production

**GitHub Pages:**
```bash
# Already configured with .nojekyll file
# Just enable GitHub Pages in repository settings
```

**Any Static Hosting:**
- Netlify, Vercel, AWS S3, Azure Static Web Apps, etc.
- Simply upload `index.html` and `styles.css`
- No build step required

## Project Structure

```
snappy/
├── index.html          # Main application file (1,973 lines)
│                       # Contains all JavaScript, React components, and markup
├── styles.css          # All styling (398 lines)
│                       # Responsive layouts, tab styling, form elements
├── .nojekyll           # Disables Jekyll processing for GitHub Pages
├── CLAUDE.md           # Development guidance for Claude Code
├── README.md           # This file
└── docs/               # Comprehensive planning documentation
    ├── ARCHITECTURE.md
    ├── COMPONENTS.md
    ├── MIGRATION_STRATEGY.md
    ├── PROJECT_PLAN.md
    ├── RISK_ASSESSMENT.md
    └── STATE_MANAGEMENT.md
```

## Architecture Highlights

### React Context Architecture

**Three-Context Design:**
- **AppContext**: Application-wide state (active tab, password unlock)
- **CalculatorContext**: Calculator results for all 4 calculators
- **DiagramContext**: Monaco editor instance and diagram JSON

### Custom Hooks
- `useApp()` - Access application state
- `useCalculator()` - Access calculator results
- `useDiagram()` - Access diagram functionality

### Component Hierarchy

```
App
├── AppProvider
│   ├── CalculatorProvider
│   │   ├── DiagramProvider
│   │   │   └── MainContent
│   │   │       ├── Header
│   │   │       ├── PasswordModal
│   │   │       ├── TabBar
│   │   │       ├── TriggeredTaskCalculator
│   │   │       ├── UltraTaskCalculator
│   │   │       ├── ScheduledTaskCalculator
│   │   │       ├── HeadlessUltraCalculator
│   │   │       ├── DiagramTab
│   │   │       │   ├── MonacoEditorPane
│   │   │       │   └── ExcalidrawPane
│   │   │       └── FAQTab
│   │   │           └── FAQItem (×7)
```

## Calculator Formulas

All formulas reference the [Sigma Framework Capacity Guide](https://community.snaplogic.com/t5/sigma-framework-library/snaplex-capacity-tuning-guide/td-p/23787).

### High Availability (HA) Multiplier
- All node calculations include **1.3x HA multiplier**
- Minimum **2 nodes** for high availability

### Triggered Tasks
```javascript
concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)
nodesRequired = concurrentAPI / (20 / apiResponseTime)
haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2))
```

### Ultra Tasks
```javascript
concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)
executionNodesRequired = concurrentAPI / (100 / apiResponseTime)
fmNodesRequired = concurrentAPI / (200 / apiResponseTime)
haNodes = Math.max(Math.ceil(nodes * 1.3), 2)
```

### Scheduled Tasks
```javascript
mbPerMinute = (batchSizeGB * 1024) / (processTime * 60)
nodesRequired = mbPerMinute * complexityMultiplier / 300
haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2))
```

### Headless Ultra (Non-Microbatching)
```javascript
batchSize = (eventSize * eventPerDay) / 10000000000
mbPerMinute = ((batchSize * 1024) / (coverageHours * 60)) * (peak / 100)
executionNodesRequired = mbPerMinute * complexityMultiplier / 150
haNodesRequired = Math.ceil(Math.max(executionNodesRequired * 1.3, 2))
```

## Development Notes

### Key Design Decisions

1. **No Build Process**: Self-contained HTML/CSS/JS for maximum portability
2. **CDN Dependencies**: External libraries loaded via CDN for simplicity
3. **Single File Pattern**: All React code in one `<script type="text/babel">` block
4. **Babel 7 Compatibility**: Uses `@babel/standalone@7` for React 18 support
5. **AMD Loader Isolation**: Monaco Editor dynamically loaded to avoid conflicts

### Browser Compatibility

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **React 18 Features**: Concurrent rendering, automatic batching
- **Monaco Editor**: Requires modern JavaScript features (ES6+)

### Known Limitations

- **In-Browser Transformation**: Babel transpiles JSX in the browser (not recommended for large-scale production)
- **No TypeScript**: Pure JavaScript for simplicity
- **No Testing Framework**: Manual testing only
- **Single HTML File**: All code in one file limits modularity

### Future Enhancements

- [ ] Pre-compile JSX for production (remove Babel Standalone)
- [ ] Add input validation with error messages
- [ ] Export diagram as PNG/SVG
- [ ] Save/load calculator configurations
- [ ] Dark mode support
- [ ] Mobile responsive improvements
- [ ] Unit tests with Jest/React Testing Library

## Migration History

This application was migrated from a hybrid vanilla JS/React architecture to pure React 18:

**Before:**
- Mixed vanilla JavaScript (DOM manipulation) + React (Excalidraw only)
- Global variables and imperative state management
- Event handlers with `getElementById` and `querySelector`

**After:**
- Full React 18.3.1 with hooks (useState, useEffect, useCallback, useMemo)
- Context API for state management
- Declarative component architecture
- 100% formula accuracy preserved

See `docs/` folder for detailed migration planning and architecture documentation.

## Contributing

This is a SnapLogic internal tool. For questions or improvements, please contact the SnapLogic engineering team.

## License

Copyright © SnapLogic. All rights reserved.

## Disclaimer

The SnapLogic Sizing Calculator provides estimations based on user inputs and general assumptions. The results generated by this tool are intended for preliminary planning purposes only and should not be considered as definitive or binding. Actual sizing requirements may vary based on specific use cases, system configurations, workload variations, and other factors not accounted for in this tool. We recommend consulting with a SnapLogic representative or conducting a detailed analysis for precise sizing and configuration.

## References

- [SnapLogic Sigma Framework Capacity Guide](https://community.snaplogic.com/t5/sigma-framework-library/snaplex-capacity-tuning-guide/td-p/23787)
- [React 18 Documentation](https://react.dev/)
- [Monaco Editor Documentation](https://microsoft.github.io/monaco-editor/)
- [Excalidraw Documentation](https://docs.excalidraw.com/)

---

**Last Updated:** November 2025
**Version:** 2.0 (React 18 Migration)
