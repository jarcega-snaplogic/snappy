# SnapLogic Calculator - React Migration Project Plan

> **Program Lead Review Document**
>
> This document consolidates all technical planning artifacts and provides a go/no-go decision framework for the React migration project.

---

## 📋 Planning Status

### Planning Documents Completed ✅

| Document | Status | Size | Agent | Review Status |
|----------|--------|------|-------|---------------|
| **ARCHITECTURE.md** | ✅ Complete | 55KB (1,647 lines) | Senior Architect | ⏳ Pending Review |
| **COMPONENTS.md** | ✅ Complete | 61KB (23 components) | React Developer | ⏳ Pending Review |
| **MIGRATION_STRATEGY.md** | ✅ Complete | 62KB (6 phases) | Program Manager | ⏳ Pending Review |
| **STATE_MANAGEMENT.md** | ✅ Complete | 42KB (3 contexts) | State Expert | ⏳ Pending Review |
| **RISK_ASSESSMENT.md** | ✅ Complete | 31KB (18 risks) | Risk Manager | ⏳ Pending Review |

**Total Planning Effort**: 5 parallel agents × ~4 hours = 20 agent-hours

---

## 🎯 Executive Summary for Leadership

### The Problem
Current SnapLogic Node Sizing Calculator uses a **hybrid architecture** that mixes:
- Vanilla JavaScript for calculators (imperative, DOM manipulation)
- React for diagram generation only (declarative)

This creates:
- **Maintainability issues** - Two paradigms to understand
- **Bug-prone code** - Global variables, tight coupling
- **Difficult enhancements** - No clear pattern to extend

### The Solution
Migrate to **100% React** architecture:
- Single paradigm throughout (React)
- Proper state management (Context API)
- Component reusability (40-50% code reduction)
- Future-proof for testing, accessibility, new features

### Constraints Preserved
✅ **No build process** - Remains single HTML file
✅ **Zero infrastructure changes** - CDN dependencies only
✅ **100% feature parity** - All calculations preserved exactly
✅ **No downtime** - Git branching enables safe rollback

### Investment Required

| Resource | Estimate | Notes |
|----------|----------|-------|
| **Developer Time** | 53-93 hours | 2-4 weeks depending on team size |
| **QA Time** | 6-12 hours | Manual testing with checklist |
| **Risk Level** | Medium | 5 critical risks identified with mitigation |
| **Financial Cost** | $0 | No new tools or infrastructure |

### Return on Investment

**Short-term** (Immediate):
- 40-50% code reduction (easier maintenance)
- Elimination of 4 global variables (fewer bugs)
- Proper state management (easier debugging)

**Long-term** (6-12 months):
- Easier to add features (unit testing, state persistence, export/import)
- Faster onboarding for new developers (single paradigm)
- Foundation for advanced features (dark mode, accessibility, mobile optimization)

---

## 📊 Planning Document Summary

### 1. Architecture Design ([ARCHITECTURE.md](./ARCHITECTURE.md))

**Key Decisions**:
- **React Version**: 18.3.1 (concurrent features, long-term support)
- **State Management**: Context API with 3 providers
- **Component Count**: 17 components (8 core, 9 shared)
- **File Structure**: Single HTML file preserved (~1,200 lines projected)

**Technical Highlights**:
- ASCII component hierarchy diagram
- Data flow diagrams (user action → context → render)
- Integration patterns for Monaco Editor and Excalidraw
- Performance analysis (Babel Standalone <100ms overhead)

**Review Questions**:
- [ ] Is React 18 the right choice vs staying on React 17?
- [ ] Should we use single context or 3 contexts? (3 recommended)
- [ ] Is 40-50% code reduction realistic? (Yes, shared components)

---

### 2. Component Specifications ([COMPONENTS.md](./COMPONENTS.md))

**Component Inventory**:
- **8 Core Components**: App, TabNav, 4 Calculators, DiagramTab, FAQTab
- **10 Shared Components**: FormField, Toggle, Button, ResultDisplay, PasswordModal, etc.
- **5 Custom Hooks**: useCalculator, useMonacoEditor, usePasswordProtection, etc.

**Reusability Strategy**:
- Shared `FormField` eliminates duplicate input code across 4 calculators
- Shared `useCalculator` hook for common calculation patterns
- Configuration-driven vs individual components (Option B chosen)

**Formula Preservation**:
- All calculation constants documented (20 TPS/node, 100 TPS/node, etc.)
- Exact formulas specified for each calculator
- HA multiplier (1.3) and minimums (2 nodes) preserved

**Review Questions**:
- [ ] Are 23 components too many? (No, many are small/shared)
- [ ] Should calculators share more code? (Already using shared hook)
- [ ] Do we need TypeScript? (No, using JSDoc comments)

---

### 3. Migration Strategy ([MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md))

**Phased Approach** (6 Phases):

| Phase | Deliverable | Effort | Dependencies | Risk |
|-------|-------------|--------|--------------|------|
| 0 | React shell, contexts, utils | 6-8h | None | Low |
| 1 | Shared components | 8-10h | Phase 0 | Low |
| 2 | FAQ tab (simplest) | 3-4h | Phase 1 | Low |
| 3 | Calculator tabs (critical) | 20-24h | Phase 1 | **High** |
| 4 | Diagram tab | 6-8h | Phase 3 | Medium |
| 5 | Password modal, polish | 4-6h | All | Low |
| 6 | Testing & validation | 6-8h | Phase 5 | **High** |

**Timeline**:
- **Solo Developer**: 3-4 weeks (sequential)
- **Team of 3**: 2-3 weeks (parallel phases 1-3)
- **Buffer Recommended**: 30-40% (realistic 78-93 hours)

**Testing Strategy**:
- **Golden Dataset**: Capture current outputs before migration
- **Side-by-side Validation**: Run new React calculators vs old vanilla JS
- **100+ Test Cases**: Comprehensive checklist in Risk Assessment

**Rollback Plan**:
- Git tag `v1.0-stable` before migration
- Feature branch `feature/react-migration`
- Recovery time: 15-30 minutes (git revert)

**Review Questions**:
- [ ] Should we do big-bang vs incremental? (Incremental recommended)
- [ ] Can we afford 2-4 weeks? (ROI positive in 6-12 months)
- [ ] Do we have sufficient testing resources? (Manual checklist provided)

---

### 4. State Management ([STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md))

**Architecture Choice**: **3 React Contexts** (vs single global store)

```javascript
// 1. AppContext - UI & Settings
{
  activeTab: 'tab1',
  passwordUnlocked: false
}

// 2. CalculatorContext - Results (for diagram)
{
  triggeredResult: { ... },
  ultraResult: { ... },
  scheduledResult: { ... },
  headlessUltraResult: { ... }
}

// 3. DiagramContext - Monaco & JSON
{
  monacoEditorInstance: ref,
  diagramJson: '...'
}
```

**Why 3 Contexts?**
- Prevents re-render cascades (changing tab doesn't re-render calculators)
- Logical separation of concerns
- Easier to reason about state updates

**Migration from Globals**:
- `pLocked` → `AppContext.passwordUnlocked`
- `isBatchSize` → `ScheduledTaskCalculator` local state
- `isMicrobatching` → `HeadlessUltraCalculator` local state
- `monacoEditor` → `DiagramContext.monacoEditorInstance`

**Performance Optimization**:
- `useMemo` for derived state (total nodes)
- `useCallback` for stable function references
- Context value memoization

**Review Questions**:
- [ ] Is 3 contexts overkill? (No, prevents re-render issues)
- [ ] Should form inputs be in context? (No, high-frequency local state)
- [ ] Do we need Redux? (No, Context API sufficient for this scale)

---

### 5. Risk Assessment ([RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md))

**Risk Matrix** (18 Risks Total):

| Priority | Count | Risk IDs | Mitigation Required |
|----------|-------|----------|---------------------|
| **P1 (Critical)** | 5 | CALC-01, INT-01, STATE-01, PROC-01, PERF-01 | Before go-live |
| **P2 (High)** | 6 | CALC-02, INT-02, PROC-02, BUS-01, TEST-01, TEST-02 | During development |
| **P3 (Medium)** | 4 | TECH-01, PROC-03, BUS-02, TEST-03 | Monitor |
| **P4 (Low)** | 3 | TECH-02, PROC-04, BUS-03 | Informational |

**Top 5 Critical Risks**:

1. **CALC-01: Calculation Formula Errors** (P1)
   - **Impact**: Wrong sizing recommendations → business credibility loss
   - **Mitigation**: Golden dataset validation, side-by-side testing
   - **Go/No-Go**: Must pass 100% of formula tests

2. **INT-01: Monaco Editor Integration** (P1)
   - **Impact**: Diagram tab broken
   - **Mitigation**: Proper useRef/useEffect patterns, lazy loading
   - **Go/No-Go**: Diagram tab functional in all browsers

3. **STATE-01: JSON Generation from State** (P1)
   - **Impact**: Diagram generation fails
   - **Mitigation**: Centralized state, remove DOM scraping
   - **Go/No-Go**: JSON generation works for all calculator combinations

4. **PROC-01: Incomplete Testing** (P1)
   - **Impact**: Bugs in production
   - **Mitigation**: 100+ test case checklist, cross-browser matrix
   - **Go/No-Go**: All P1/P2 test cases pass

5. **PERF-01: Performance Degradation** (P1)
   - **Impact**: Slower user experience
   - **Mitigation**: Babel overhead acceptable (<100ms), memoization
   - **Go/No-Go**: Page load <2s, calculations <100ms

**Rollback Triggers**:
- Formula calculations produce different results (>1% variance)
- Critical browser incompatibility discovered
- Performance degradation >50% (page load >3 seconds)
- Showstopper bugs discovered in UAT

**Review Questions**:
- [ ] Are 5 P1 risks acceptable? (Yes, all have mitigation plans)
- [ ] Should we establish UAT environment? (Recommended)
- [ ] Who approves go/no-go decision? (Program lead + stakeholder)

---

## ✅ Go/No-Go Decision Framework

### Prerequisites (Must Complete Before Migration)

- [ ] **Planning Review**: All 5 documents reviewed and approved
- [ ] **Stakeholder Buy-in**: Leadership approves 2-4 week investment
- [ ] **Resource Allocation**: Developer(s) assigned, QA time reserved
- [ ] **Backup Created**: Current version tagged as `v1.0-stable`
- [ ] **Golden Dataset**: Test inputs/outputs captured for validation
- [ ] **Performance Baseline**: Current metrics recorded (load time, calculation time)

### Go Criteria (Approve Migration)

✅ **Technical Feasibility**
- [ ] React 18 CDN available and tested
- [ ] No show-stopper technical risks identified
- [ ] Team has React expertise (or training plan in place)

✅ **Business Case**
- [ ] ROI positive (maintenance savings > investment)
- [ ] Timeline acceptable (2-4 weeks)
- [ ] Risk level acceptable (Medium with mitigation)

✅ **Resource Availability**
- [ ] Developer(s) available for 2-4 week commitment
- [ ] QA/testing resources available
- [ ] Rollback plan documented and tested

### No-Go Criteria (Delay/Cancel Migration)

❌ **Block Migration If**:
- [ ] Critical business deadline conflicts with 2-4 week timeline
- [ ] No React expertise available and no training budget
- [ ] High-priority bugs in current version need immediate fixing
- [ ] Leadership not convinced of ROI
- [ ] No rollback mechanism possible

---

## 📅 Proposed Timeline

### Option A: Solo Developer (3-4 Weeks)

```
Week 1: Phase 0-1 (Setup + Shared Components)
├── Mon-Tue: React shell, Context providers
├── Wed-Thu: Shared components (FormField, Toggle, Button)
└── Fri: FAQ tab migration, testing

Week 2: Phase 3A (Calculator Tabs 1-2)
├── Mon-Tue: TriggeredTaskCalculator
├── Wed-Thu: UltraTaskCalculator
└── Fri: Testing, golden dataset validation

Week 3: Phase 3B (Calculator Tabs 3-4)
├── Mon-Tue: ScheduledTaskCalculator
├── Wed-Thu: HeadlessUltraCalculator
└── Fri: Testing, formula verification

Week 4: Phase 4-6 (Diagram + Polish + Testing)
├── Mon-Tue: DiagramTab migration
├── Wed: Password modal, cleanup
├── Thu: Cross-browser testing
└── Fri: Final QA, deployment prep
```

### Option B: Team of 3 (2-3 Weeks)

```
Week 1: Parallel Development
├── Dev 1: Phase 0-1 (Setup + Shared Components)
├── Dev 2: Phase 2 (FAQ) → Phase 3A (Triggered + Ultra)
└── Dev 3: Documentation, golden dataset setup

Week 2: Calculator Migration
├── Dev 1: Phase 3B (Scheduled + Headless Ultra)
├── Dev 2: Phase 4 (Diagram Tab)
└── Dev 3: Testing infrastructure, QA prep

Week 3: Testing & Deployment
├── All Devs: Phase 5-6 (Polish + Testing)
├── QA: Cross-browser, regression testing
└── Program Lead: Final review, go/no-go decision
```

---

## 🚦 Phase Gates (Quality Checkpoints)

### Phase 0 Gate: Foundation Ready
- [ ] React 18 loads from CDN without errors
- [ ] 3 Context providers implemented and accessible
- [ ] Utility functions tested (calculation constants)
- [ ] App component renders correctly

**Decision**: ✅ Proceed to Phase 1 | ⏸️ Fix Issues | ❌ Abort

---

### Phase 1 Gate: Shared Components Ready
- [ ] FormField accepts all input types (number, select, password)
- [ ] Toggle switch works in both directions
- [ ] Button component styled correctly
- [ ] ResultDisplay shows formatted output

**Decision**: ✅ Proceed to Phase 2 | ⏸️ Fix Issues | ❌ Abort

---

### Phase 3 Gate: Calculators Functional (CRITICAL)
- [ ] All 4 calculators render forms correctly
- [ ] **Calculation results match golden dataset (100% accuracy)**
- [ ] Password-protected fields show/hide correctly
- [ ] HA multiplier (1.3) applied correctly
- [ ] All formulas verified side-by-side

**Decision**: ✅ Proceed to Phase 4 | ⏸️ Fix Issues | ❌ Rollback

---

### Phase 4 Gate: Diagram Integration
- [ ] Monaco Editor loads without AMD conflicts
- [ ] JSON generation works from state (no DOM scraping)
- [ ] Excalidraw renders diagram correctly
- [ ] All calculator combinations produce valid JSON

**Decision**: ✅ Proceed to Phase 5 | ⏸️ Fix Issues | ❌ Rollback

---

### Phase 6 Gate: Production Ready (GO/NO-GO)
- [ ] All P1 test cases pass (100%)
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] Performance benchmarks met (load <2s, calc <100ms)
- [ ] Documentation updated (CLAUDE.md)
- [ ] Rollback plan tested and ready

**Decision**: ✅ Deploy to Production | ⏸️ UAT Required | ❌ Rollback

---

## 📞 Stakeholder Communication Plan

### Weekly Status Updates (During Migration)

**Template**:
```
Subject: SnapLogic Calculator Migration - Week X Status

Progress:
- Phase X completed: [deliverables]
- Current phase: [phase name]
- Blockers: [none | list]

Metrics:
- Hours spent: X / 93 budgeted
- Test cases passed: X / 100+
- Risks mitigated: X / 5 critical

Next Week:
- [planned phases]
- [key milestones]

Actions Needed:
- [decisions required]
- [resources needed]
```

### Escalation Path

| Issue Severity | Response Time | Escalation Path |
|----------------|---------------|-----------------|
| **P1 (Blocking)** | 4 hours | Program Lead → Tech Lead → VP Engineering |
| **P2 (Major)** | 1 business day | Program Lead → Tech Lead |
| **P3 (Minor)** | 3 business days | Program Lead logs, addresses in next sprint |

---

## 🎓 Lessons Learned (Post-Migration)

### Retrospective Template

**What Went Well**:
- [ ] [To be filled after migration]

**What Could Be Improved**:
- [ ] [To be filled after migration]

**Action Items for Future**:
- [ ] [To be filled after migration]

**Metrics Captured**:
- Actual effort vs estimated: ___ hours
- Bugs found in production: ___
- Performance impact: ___ (positive/negative/neutral)
- Developer feedback: ___

---

## 📚 Appendices

### A. Key Formulas (Reference)

See **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Appendix A

### B. Testing Checklist (100+ Cases)

See **[RISK_ASSESSMENT.md](./RISK_ASSESSMENT.md)** - Appendix B

### C. Component Props Reference

See **[COMPONENTS.md](./COMPONENTS.md)** - Sections 2-3

### D. Code Examples

All planning documents include copy-pasteable React code for:
- Context providers ([STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) Section 3)
- Custom hooks ([COMPONENTS.md](./COMPONENTS.md) Section 4)
- Calculator components ([MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md) Section 3)
- Integration patterns ([ARCHITECTURE.md](./ARCHITECTURE.md) Section 6)

---

## ✍️ Sign-off

### Planning Phase Approval

| Role | Name | Decision | Date | Signature |
|------|------|----------|------|-----------|
| **Program Lead** | [Name] | ✅ Approve / ❌ Reject / 🔄 Revise | YYYY-MM-DD | _________ |
| **Tech Lead** | [Name] | ✅ Approve / ❌ Reject / 🔄 Revise | YYYY-MM-DD | _________ |
| **Product Owner** | [Name] | ✅ Approve / ❌ Reject / 🔄 Revise | YYYY-MM-DD | _________ |

### Comments/Revisions Requested

```
[Space for feedback and revision requests]
```

---

## 📝 Next Actions

### If Approved (✅)
1. Schedule kickoff meeting (1 hour)
2. Assign phase ownership (developers)
3. Create `feature/react-migration` branch
4. Tag current version as `v1.0-stable`
5. Setup golden dataset (QA)
6. Begin Phase 0: Setup & Foundation

### If Revisions Requested (🔄)
1. Document specific concerns in Comments section
2. Assign revision owners
3. Set deadline for revised plan
4. Re-review cycle

### If Rejected (❌)
1. Document rejection reasons
2. Archive planning documents
3. Identify alternative approaches
4. Reschedule for future consideration

---

**Document Status**: ⏳ Awaiting Review & Approval
**Last Updated**: 2025-11-08
**Program Lead**: Claude (AI Assistant)
**Next Review Date**: [To be scheduled]
