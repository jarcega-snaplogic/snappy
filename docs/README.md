# SnapLogic Calculator - React Migration Planning Documents

> **Status**: Planning Phase Complete ✅
> **Last Updated**: 2025-11-08
> **Program Lead**: Claude
> **Estimated Effort**: 53-93 hours (2-4 weeks depending on team size)

## 📋 Document Index

This directory contains comprehensive technical planning for migrating the SnapLogic Node Sizing Calculator from a hybrid vanilla JavaScript/React architecture to a full React application.

### Core Planning Documents

| Document | Purpose | Key Decisions | Size |
|----------|---------|---------------|------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design & component hierarchy | React 18, Context API, 17 components, single-file structure | 55KB |
| **[COMPONENTS.md](./COMPONENTS.md)** | Detailed component specifications | 23 components, props interfaces, 5 custom hooks | 61KB |
| **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** | Phased rollout plan & timeline | 6 phases, parallel development, testing strategy | 62KB |
| **[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)** | State architecture design | 3 Context providers, global vs local state | 42KB |
| **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** | Risks, mitigation, rollback plans | 18 risks identified, 5 critical (P1) | 31KB |

---

## 🎯 Quick Start Guide

### For Project Managers
1. Read **Executive Summary** (below)
2. Review **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** - Timeline & Resources
3. Review **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Go/No-Go Criteria

### For Architects
1. Read **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System Design
2. Review **[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)** - Data Flow
3. Scan **[COMPONENTS.md](./COMPONENTS.md)** - Component Structure

### For Developers
1. Read **[COMPONENTS.md](./COMPONENTS.md)** - What to Build
2. Review **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** - Phase Details
3. Use **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Integration Patterns

### For QA/Testers
1. Read **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Appendix B Testing Checklist
2. Review **[MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)** - Golden Dataset Strategy
3. Use **[COMPONENTS.md](./COMPONENTS.md)** - Feature Inventory

---

## 📊 Executive Summary

### Current State
- **Architecture**: Hybrid vanilla JavaScript (calculators, tabs, forms) + React 17 (Excalidraw diagram only)
- **Size**: 1,129 lines HTML + 398 lines CSS
- **Issues**:
  - Mixed paradigms (imperative DOM manipulation + React)
  - Global variable pollution (4 mutable globals)
  - Tight coupling between vanilla JS and React
  - Difficult to maintain and extend

### Target State
- **Architecture**: Full React 18 application
- **Size**: ~1,200 lines (40-50% code reduction after refactor)
- **Benefits**:
  - Single paradigm (declarative React throughout)
  - Proper state management (Context API)
  - Component reusability (shared FormField, Toggle, Button)
  - Easier testing and maintenance
  - Future-proof for enhancements

### Constraints Preserved
✅ **No build process** - Still a single HTML file
✅ **CDN dependencies** - React, Excalidraw, Monaco via unpkg/CDN
✅ **Browser JSX transformation** - Babel Standalone (same as current)
✅ **100% feature parity** - All calculations, diagrams, FAQ preserved

---

## 🏗️ Architecture Highlights

### Component Hierarchy (17 Components)

```
App (Root)
├── Header (Logo + Title)
├── CalculatorProvider (State Management)
│   ├── TabNavigation (6 Tabs)
│   ├── TriggeredTaskCalculator
│   │   ├── FormField × 4
│   │   ├── Button (Calculate)
│   │   └── ResultDisplay
│   ├── UltraTaskCalculator
│   │   ├── FormField × 4
│   │   ├── Button (Calculate)
│   │   └── ResultDisplay
│   ├── ScheduledTaskCalculator
│   │   ├── FormField × 3
│   │   ├── ToggleSwitch (GB ↔ Rows)
│   │   ├── Button (Calculate)
│   │   └── ResultDisplay
│   ├── HeadlessUltraCalculator
│   │   ├── FormField × 4
│   │   ├── ToggleSwitch (Microbatching)
│   │   ├── Button (Calculate)
│   │   └── ResultDisplay
│   ├── DiagramTab
│   │   ├── MonacoEditorPane (JSON input)
│   │   └── ExcalidrawPane (Diagram output)
│   └── FAQTab
│       └── FAQItem × 7
├── PasswordModal (Advanced Features)
└── Footer (Disclaimer)
```

### State Management (3 Contexts)

```javascript
// AppContext - UI & Settings
{
  activeTab: 'tab1',
  passwordUnlocked: false,
  setActiveTab: (tab) => {},
  unlockPassword: () => {}
}

// CalculatorContext - Results (for diagram generation)
{
  triggeredResult: { concurrentAPI, nodesRequired, haNodesRequired },
  ultraResult: { ... },
  scheduledResult: { ... },
  headlessUltraResult: { ... },
  setTriggeredResult: (result) => {},
  // ... setters for other calculators
}

// DiagramContext - Monaco & JSON
{
  monacoEditorInstance: ref,
  diagramJson: '...',
  generateJsonFromResults: () => {},
  updateDiagram: () => {}
}
```

---

## 📅 Migration Timeline

### 6-Phase Approach (2-4 Weeks)

| Phase | Deliverable | Effort | Risk |
|-------|-------------|--------|------|
| **0. Setup** | React architecture, Context providers, utilities | 6-8h | Low |
| **1. Shared** | Button, FormField, Toggle, ResultDisplay components | 8-10h | Low |
| **2. FAQ** | Simple tab migration (validation of approach) | 3-4h | Low |
| **3. Calculators** | All 4 calculator tabs with formula preservation | 20-24h | **High** |
| **4. Diagram** | Monaco + Excalidraw integration, state-based JSON | 6-8h | Medium |
| **5. Password** | Password modal, cleanup, final polish | 4-6h | Low |
| **6. Testing** | Cross-browser, regression, golden dataset validation | 6-8h | **High** |

**Total**: 53-68 hours (optimistic) → 78-93 hours (with buffer)

**Team Options**:
- **Solo Developer**: 3-4 weeks (sequential phases)
- **Team of 3**: 2-3 weeks (parallel work on phases 1-3)

---

## ⚠️ Top 5 Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Calculation Formula Errors** | Critical - Wrong sizing recommendations | Golden dataset validation, side-by-side testing, formula preservation checklist |
| **Monaco Editor Integration** | High - Diagram tab breaks | Proper useRef/useEffect patterns, lazy loading, fallback UI |
| **JSON Generation from State** | High - Diagram fails | Centralized state, remove DOM scraping, direct state access |
| **Incomplete Testing** | High - Bugs in production | 100+ test case checklist, cross-browser matrix, regression suite |
| **Performance Degradation** | Medium - Slower UX | Babel overhead acceptable (<100ms), memoization, code splitting |

**Rollback Strategy**: Git tags + backup branch → 15-30 min recovery time

---

## ✅ Success Criteria

### Functional (Must Have)
- [ ] All 4 calculators produce identical results to current version
- [ ] Diagram generation works from all calculator combinations
- [ ] FAQ collapsible sections function correctly
- [ ] Password unlock reveals advanced fields
- [ ] Tab navigation preserves state
- [ ] All formulas byte-for-byte identical

### Technical (Must Have)
- [ ] No console errors in Chrome, Firefox, Safari, Edge
- [ ] React DevTools shows proper component hierarchy
- [ ] Context updates don't cause unnecessary re-renders
- [ ] Monaco Editor loads without AMD conflicts
- [ ] Excalidraw diagram renders correctly

### Performance (Should Have)
- [ ] Initial page load <2 seconds
- [ ] Tab switching <200ms
- [ ] Calculation results <100ms
- [ ] Diagram generation <500ms

### Documentation (Must Have)
- [ ] CLAUDE.md updated with new architecture
- [ ] Component responsibilities documented
- [ ] State management explained
- [ ] Migration notes captured

---

## 🚀 Next Steps

### Before Starting Migration
1. **Stakeholder Review** - Get approval on planning documents
2. **Create Backups** - Tag current version as `v1.0-stable`
3. **Establish Baselines** - Run performance benchmarks, capture golden dataset
4. **Setup Branch** - Create `feature/react-migration` branch
5. **Team Kickoff** - Review architecture and assign phase ownership

### Phase 0 - Week 1
1. Create basic React app shell (App component)
2. Implement 3 Context providers
3. Setup utility functions (calculation constants)
4. Verify React 18 CDN loads correctly

### After Migration
1. **Testing** - Complete Appendix B checklist (100+ items)
2. **Documentation** - Update CLAUDE.md
3. **Cleanup** - Remove 600+ lines of vanilla JS
4. **Monitoring** - Track user feedback for 2 weeks
5. **Retrospective** - Capture lessons learned

---

## 📚 Additional Resources

### Calculation Formulas (Reference)
See **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Appendix A for all 4 calculator formulas with constants.

### Testing Checklist
See **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Appendix B for 100+ test cases.

### Component Props Reference
See **[COMPONENTS.md](./COMPONENTS.md)** - Section 2-3 for all props interfaces.

### Code Examples
All documents include copy-pasteable React code examples for:
- Context providers
- Custom hooks
- Form handling
- Calculator components
- Integration patterns

---

## 📞 Questions or Issues?

### Decision Log
- **Why React 18?** - Concurrent features, long-term support, minimal API changes from 17
- **Why Context API?** - Right-sized for app complexity, no external dependencies
- **Why not TypeScript?** - Single-file constraint, JSDoc provides types
- **Why keep Babel Standalone?** - No build process requirement, <100ms overhead acceptable
- **Why 3 contexts?** - Prevents re-render cascades, logical separation of concerns

### Open Questions (To Resolve)
- [ ] Browser support minimum versions? (Recommend Chrome 90+, Firefox 88+, Safari 14+)
- [ ] Performance benchmarks acceptable? (Recommend <2s initial load)
- [ ] Testing: Manual only or add basic assertions? (Recommend manual with checklist)
- [ ] Deployment process? (Recommend staging environment before production)

---

## 📝 Document Change Log

| Date | Document | Change | Author |
|------|----------|--------|--------|
| 2025-11-08 | All | Initial planning documents created | Claude (Program Lead) |

---

**Ready to Proceed?** Review the 5 planning documents, resolve open questions, then begin Phase 0: Setup & Foundation.
