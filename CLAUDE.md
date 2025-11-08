# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **SnapLogic Node Sizing Calculator** - a self-contained, single-page web application that helps estimate infrastructure requirements for SnapLogic deployments. The application runs entirely in the browser with no build process or backend dependencies.

## Architecture

### File Structure
- **index.html** (~1129 lines): Contains all HTML markup, JavaScript logic, and React components
- **styles.css** (~398 lines): All styling, including responsive layouts for the diagram tab

### Technology Stack
- **Pure HTML/CSS/JavaScript** - No framework or build system required
- **External CDN Dependencies**:
  - Monaco Editor (v0.30.1) - JSON editor with syntax highlighting
  - React 17 - Used only for the Excalidraw diagram component
  - Excalidraw (v0.15.2) - Interactive diagram generation
  - jsonlint - JSON validation (though not actively used in current code)
  - Babel Standalone - For JSX transformation in browser

### Dual Architecture Pattern
The application uses two distinct JavaScript paradigms:

1. **Vanilla JavaScript** (lines 271-697): Handles calculator logic, tab switching, and form interactions
2. **React/JSX** (lines 703-1127): Powers the diagram generation and Excalidraw integration

This creates a hybrid where simple calculators use imperative DOM manipulation, while complex diagram visualization uses React's declarative approach.

## Running the Application

**To test/preview:**
```bash
# Option 1: Open directly in browser
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows

# Option 2: Use a simple HTTP server (recommended for CDN reliability)
python3 -m http.server 8000
# Then visit: http://localhost:8000
```

No build, compilation, or installation steps required.

## Core Features & Implementation

### Calculator Tabs (4 types)
Each calculator follows the same pattern:
1. **Triggered Task** (tab1): Lines 37-56, calculation at lines 489-518
2. **Ultra Task** (tab2): Lines 58-77, calculation at lines 520-544
3. **Scheduled Task** (tab3): Lines 79-107, calculation at lines 629-654
4. **Headless Ultra Task** (tab4): Lines 109-140, calculation at lines 545-588

**Key Calculation Pattern:**
- User inputs → concurrent load calculation → node estimation → HA (High Availability) multiplier (1.3x, minimum 2 nodes)
- All formulas reference the [Sigma Framework Capacity Guide](https://community.snaplogic.com/t5/sigma-framework-library/snaplex-capacity-tuning-guide/td-p/23787)

### Diagram Generation System (tab5)
**Workflow:**
1. User clicks "Generate JSON" button → `generateDiagramJson()` (lines 346-417)
2. Function scrapes results from other calculator tabs
3. Generates JSON config for SnapLogic infrastructure topology
4. JSON displayed in Monaco Editor (lines 277-290)
5. User clicks "Generate Diagram" → React component renders via Excalidraw (lines 741-931)

**Architecture visualization creates:**
- Organization containers (with regional emoji indicators)
- Snaplex groupings (cloud ☁️ or ground 🏠 based)
- Node representations (JCC execution nodes 🖥️ and FM feedmaster nodes 🔄)
- Arrows showing FM→JCC relationships

### Advanced Features (Password-Protected)
Password: `snapLogic4snapLogic` (hardcoded at line 676)

Unlocks hidden inputs:
- API/Event response time fields
- Transformation complexity multiplier for scheduled tasks
- Message size for headless ultra tasks

When modifying these features, search for `pLocked` variable and associated display toggles.

## Key Functions to Understand

- **Tab Management**: `openTab()` (lines 318-337) - Handles tab switching and diagram height adjustment
- **Monaco Editor Init**: `initMonacoEditor()` (lines 277-291) - Sets up JSON editor when DOM ready
- **Diagram Height**: `setDiagramTabHeight()` (lines 300-316) - Dynamically sizes diagram to viewport
- **Toggle Functions**:
  - `toggleBatchMode()` (lines 598-611) - Switches between GB and row count
  - `toggleMicrobatchingMode()` (lines 613-635) - Changes headless ultra calculation method

## Calculation Formulas Reference

**Triggered Tasks** (line 497):
```javascript
concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)
nodesRequired = concurrentAPI / (20 / apiExecutionTime)
```
Default: 833,333 API/day (equivalent to 300M/year distributed over 30 days/month)

**Ultra Tasks** (line 528):
- Execution nodes: `concurrentAPI / (100 / apiExecutionTime)`
- FeedMaster nodes: `concurrentAPI / (200 / apiExecutionTime)`
- Formula: `concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100)`
- Default: 416,667 API/day (equivalent to 100M/year distributed over 20 days/month)

**Scheduled Tasks** (line 652):
```javascript
mbPerMinute = (batchSize * 1024) / (processTime * 60)
nodesRequired = mbPerMinute * complexityMultiplier / 300
```

**Headless Ultra** (lines 564-595):
- Microbatching mode: Similar to ultra tasks (100 events/sec per node)
- Non-microbatching: Uses data volume calculation (150 MB/min per node baseline)

## Making Changes

### Adding New Calculator Types
1. Add new tab HTML structure following existing pattern (lines 37-140)
2. Create calculate function following naming convention `calculate[Name]()`
3. Wire up button onclick and result div
4. Update `generateDiagramJson()` to scrape new results

### Modifying Formulas
All calculation constants are inline within their respective functions. Common values:
- **20** - Triggered task TPS per node (line 498)
- **100** - Ultra execution TPS per node (line 529)
- **200** - Ultra FM TPS per node (line 531)
- **300** - Scheduled task MB/min per node (line 644)
- **1.3** - HA multiplier (lines 499, 530, 532, 645, 577)

### Styling the Diagram Tab
When diagram tab is active, body gets class `diagram-tab-active` (line 330), which removes max-width constraint on main container (lines 16-20 in styles.css).

## FAQ Content
The FAQ tab (tab6, lines 162-263) contains important SnapLogic domain knowledge. When answering user questions about nodes, sizing, or deployment options, reference this section first.

## Testing Changes
Since there's no test suite, manually verify:
1. All 4 calculator tabs produce results
2. Results appear in diagram JSON generation
3. Diagram renders without console errors
4. All toggles function correctly
5. Password unlock reveals hidden fields
6. Responsive layout works on different viewport sizes
