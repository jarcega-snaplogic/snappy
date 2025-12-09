# Phase 3 Implementation Test Cases
**SnapLogic Calculator - React Migration**

**Date:** 2025-11-08
**Phase:** 3 - Calculator Components Implementation
**Status:** Testing Required

---

## Formula Verification Matrix

### 1. Triggered Task Calculator

**Original Formula (backup lines 497-499):**
```javascript
const concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100);
const nodesRequired = concurrentAPI / (20 / apiExecutionTime);
const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));
```

**Test Case 1: Default Values**
- Input:
  - API per Day: 833,333
  - Coverage Hours: 24
  - API Response Time: 1
  - Peak: 150%
- Expected Output:
  - Concurrent API: `833333 / 24 / 60 / 60 * 1.5 = 14.47` (approx)
  - Nodes Required: `14.47 / (20 / 1) = 0.72` (approx)
  - HA Nodes Required: `Math.ceil(Math.max(0.72 * 1.3, 2)) = 2`

**Test Case 2: High Load**
- Input:
  - API per Day: 10,000,000
  - Coverage Hours: 12
  - API Response Time: 1
  - Peak: 200%
- Expected Output:
  - Concurrent API: `10000000 / 12 / 60 / 60 * 2 = 462.96`
  - Nodes Required: `462.96 / 20 = 23.15`
  - HA Nodes Required: `Math.ceil(23.15 * 1.3) = 31`

**Test Case 3: Minimum Nodes (Edge Case)**
- Input:
  - API per Day: 1,000
  - Coverage Hours: 24
  - API Response Time: 1
  - Peak: 100%
- Expected Output:
  - Concurrent API: `1000 / 24 / 60 / 60 = 0.0116`
  - Nodes Required: `0.0116 / 20 = 0.00058`
  - HA Nodes Required: `Math.ceil(Math.max(0.00058 * 1.3, 2)) = 2` (minimum enforced)

---

### 2. Ultra Task Calculator

**Original Formula (backup lines 528-532):**
```javascript
const concurrentAPI = apiPerDay / coverageHours / 60 / 60 * (peak / 100);
const nodesRequired = concurrentAPI / (100 / apiExecutionTime);
const haNodesRequired = Math.max(Math.ceil(nodesRequired * 1.3), 2);
const fmNodesRequired = concurrentAPI / (200 / apiExecutionTime);
const haFmNodesRequired = Math.max(Math.ceil(fmNodesRequired * 1.3), 2);
```

**Test Case 1: Default Values**
- Input:
  - API per Day: 416,667
  - Coverage Hours: 12
  - API Response Time: 0.3
  - Peak: 150%
- Expected Output:
  - Concurrent API: `416667 / 12 / 60 / 60 * 1.5 = 14.47`
  - Execution Nodes: `14.47 / (100 / 0.3) = 0.0434`
  - HA Execution Nodes: `Math.max(Math.ceil(0.0434 * 1.3), 2) = 2`
  - FM Nodes: `14.47 / (200 / 0.3) = 0.0217`
  - HA FM Nodes: `Math.max(Math.ceil(0.0217 * 1.3), 2) = 2`

**Test Case 2: High Volume**
- Input:
  - API per Day: 100,000,000
  - Coverage Hours: 24
  - API Response Time: 0.3
  - Peak: 150%
- Expected Output:
  - Concurrent API: `100000000 / 24 / 60 / 60 * 1.5 = 1736.11`
  - Execution Nodes: `1736.11 / (100 / 0.3) = 5.21`
  - HA Execution Nodes: `Math.max(Math.ceil(5.21 * 1.3), 2) = 7`
  - FM Nodes: `1736.11 / (200 / 0.3) = 2.60`
  - HA FM Nodes: `Math.max(Math.ceil(2.60 * 1.3), 2) = 4`

---

### 3. Scheduled Task Calculator

**Original Formula (backup lines 643-645):**
```javascript
const mbPerMinute = (batchSize * 1024) / (processTime * 60);
const nodesRequired = mbPerMinute * complexityMultiplier / 300;
const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));
```

**Test Case 1: Default GB Mode**
- Input:
  - Batch Size: 300 GB
  - Process Time: 12 hours
  - Complexity: 1 (straight pass through)
- Expected Output:
  - MB per Minute: `(300 * 1024) / (12 * 60) = 426.67`
  - Nodes Required: `426.67 * 1 / 300 = 1.42`
  - HA Nodes Required: `Math.ceil(Math.max(1.42 * 1.3, 2)) = 2`

**Test Case 2: Rows Mode**
- Input:
  - Batch Volume: 1,500,000,000 rows
  - Process Time: 12 hours
  - Complexity: 1
- Expected Output:
  - Batch Size in GB: `1500000000 * 2000 / 10000000000 = 300 GB`
  - MB per Minute: `(300 * 1024) / (12 * 60) = 426.67`
  - Nodes Required: `426.67 * 1 / 300 = 1.42`
  - HA Nodes Required: `Math.ceil(Math.max(1.42 * 1.3, 2)) = 2`

**Test Case 3: High Complexity**
- Input:
  - Batch Size: 500 GB
  - Process Time: 6 hours
  - Complexity: 2 (many sorts/aggregations)
- Expected Output:
  - MB per Minute: `(500 * 1024) / (6 * 60) = 1422.22`
  - Nodes Required: `1422.22 * 2 / 300 = 9.48`
  - HA Nodes Required: `Math.ceil(9.48 * 1.3) = 13`

---

### 4. Headless Ultra Calculator

**Microbatching Mode (backup lines 558-560):**
```javascript
const concurrentEvent = eventPerDay / coverageHours / 60 / 60 * (peak / 100);
const nodesRequired = concurrentEvent / (100 / eventExecutionTime);
const haNodesRequired = Math.max(Math.ceil(nodesRequired * 1.3), 2);
```

**Non-Microbatching Mode (backup lines 571-577):**
```javascript
batchSize = (eventSize * eventPerDay) / 10000000000;
const concurrentEvent = eventPerDay / coverageHours / 60 * (peak / 100);
const mbPerMinute = ((batchSize * 1024) / (coverageHours * 60)) * (peak / 100);
const nodesRequired = mbPerMinute * complexityMultiplier / 150;
const haNodesRequired = Math.ceil(Math.max(nodesRequired * 1.3, 2));
```

**Test Case 1: Microbatching ON (Default)**
- Input:
  - Event per Day: 20,000,000
  - Coverage Hours: 24
  - Event Response Time: 0.3
  - Peak: 150%
- Expected Output:
  - Event per Second: `20000000 / 24 / 60 / 60 * 1.5 = 347.22`
  - Execution Nodes: `347.22 / (100 / 0.3) = 1.04`
  - HA Execution Nodes: `Math.max(Math.ceil(1.04 * 1.3), 2) = 2`

**Test Case 2: Microbatching OFF**
- Input:
  - Event per Day: 20,000,000
  - Coverage Hours: 24
  - Event Size: 2000 bytes
  - Peak: 150%
  - (complexityMultiplier = 1, hardcoded)
- Expected Output:
  - Batch Size: `(2000 * 20000000) / 10000000000 = 4 GB`
  - Event per Minute: `20000000 / 24 / 60 * 1.5 = 20833.33`
  - MB per Minute: `((4 * 1024) / (24 * 60)) * 1.5 = 4.27`
  - Execution Nodes: `4.27 * 1 / 150 = 0.028`
  - HA Execution Nodes: `Math.ceil(Math.max(0.028 * 1.3, 2)) = 2`

**Test Case 3: Microbatching OFF - High Volume**
- Input:
  - Event per Day: 1,000,000,000
  - Coverage Hours: 12
  - Event Size: 5000 bytes
  - Peak: 200%
- Expected Output:
  - Batch Size: `(5000 * 1000000000) / 10000000000 = 500 GB`
  - Event per Minute: `1000000000 / 12 / 60 * 2 = 2777777.78`
  - MB per Minute: `((500 * 1024) / (12 * 60)) * 2 = 1422.22`
  - Execution Nodes: `1422.22 * 1 / 150 = 9.48`
  - HA Execution Nodes: `Math.ceil(9.48 * 1.3) = 13`

---

## Manual Testing Checklist

### Pre-Migration Baseline
- [ ] Record original calculator outputs with default values
- [ ] Test all toggles in original version
- [ ] Document password unlock behavior

### Post-Migration Testing

#### Triggered Task Calculator
- [ ] Default values produce correct results
- [ ] Password unlock reveals API Response Time field
- [ ] All inputs accept numeric values
- [ ] Calculate button works
- [ ] Results display correctly
- [ ] "Consider Ultra Pipeline" message shows when nodes > 6
- [ ] Results save to CalculatorContext

#### Ultra Task Calculator
- [ ] Default values produce correct results
- [ ] Password unlock reveals API Response Time field
- [ ] Calculate button works
- [ ] Both execution and FM node results display
- [ ] Results save to CalculatorContext

#### Scheduled Task Calculator
- [ ] Default GB mode works
- [ ] Toggle switches to Rows mode correctly
- [ ] Row conversion formula accurate
- [ ] Password unlock reveals Complexity dropdown
- [ ] All complexity multipliers work (1, 1.25, 1.5, 2)
- [ ] Results save to CalculatorContext

#### Headless Ultra Calculator
- [ ] Default microbatching mode works
- [ ] Toggle switches between modes correctly
- [ ] Password unlock reveals correct field based on mode:
  - Microbatching ON: Event Response Time
  - Microbatching OFF: Message Size
- [ ] Both calculation paths produce correct results
- [ ] Results save to CalculatorContext

### Integration Testing
- [ ] Tab switching between calculators works
- [ ] All calculators can be used in same session
- [ ] Results persist when switching tabs
- [ ] Diagram JSON generation includes all calculator results
- [ ] Password unlock affects all calculators
- [ ] No JavaScript console errors

### Edge Cases
- [ ] Zero inputs handled gracefully
- [ ] Negative inputs (should be prevented or handled)
- [ ] Very large numbers (billions)
- [ ] Decimal inputs
- [ ] Rapid calculate button clicks
- [ ] Calculate without changing defaults

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Formula Comparison Report

### Side-by-Side Comparison

| Calculator | Original Formula | React Formula | Match? |
|------------|-----------------|---------------|--------|
| Triggered | `concurrentAPI / (20 / apiExecutionTime)` | ✓ Exact match | ✅ |
| Triggered HA | `Math.ceil(Math.max(nodesRequired * 1.3, 2))` | ✓ Exact match | ✅ |
| Ultra Execution | `concurrentAPI / (100 / apiExecutionTime)` | ✓ Exact match | ✅ |
| Ultra Execution HA | `Math.max(Math.ceil(nodesRequired * 1.3), 2)` | ✓ Exact match | ✅ |
| Ultra FM | `concurrentAPI / (200 / apiExecutionTime)` | ✓ Exact match | ✅ |
| Ultra FM HA | `Math.max(Math.ceil(fmNodesRequired * 1.3), 2)` | ✓ Exact match | ✅ |
| Scheduled | `mbPerMinute * complexityMultiplier / 300` | ✓ Exact match | ✅ |
| Scheduled HA | `Math.ceil(Math.max(nodesRequired * 1.3, 2))` | ✓ Exact match | ✅ |
| Headless Micro | `concurrentEvent / (100 / eventExecutionTime)` | ✓ Exact match | ✅ |
| Headless Micro HA | `Math.max(Math.ceil(nodesRequired * 1.3), 2)` | ✓ Exact match | ✅ |
| Headless Non-Micro | `mbPerMinute * complexityMultiplier / 150` | ✓ Exact match | ✅ |
| Headless Non-Micro HA | `Math.ceil(Math.max(nodesRequired * 1.3, 2))` | ✓ Exact match | ✅ |

### Constants Verification

| Constant | Original Value | React Value | Match? |
|----------|---------------|-------------|--------|
| Triggered TPS/node | 20 | 20 | ✅ |
| Ultra Execution TPS/node | 100 | 100 | ✅ |
| Ultra FM TPS/node | 200 | 200 | ✅ |
| Scheduled MB/min/node | 300 | 300 | ✅ |
| Headless Ultra Micro TPS/node | 100 | 100 | ✅ |
| Headless Ultra Non-Micro MB/min/node | 150 | 150 | ✅ |
| HA Multiplier | 1.3 | 1.3 | ✅ |
| Min HA Nodes | 2 | 2 | ✅ |
| Bytes per Row (Scheduled) | 2000 | 2000 | ✅ |
| GB to Bytes divisor | 10000000000 | 10000000000 | ✅ |

---

## Test Execution Log

### Test Run 1: [Date]
**Tester:** ___________
**Browser:** ___________
**Version:** ___________

| Test Case | Pass/Fail | Notes |
|-----------|-----------|-------|
| Triggered Default | | |
| Triggered High Load | | |
| Triggered Min Nodes | | |
| Ultra Default | | |
| Ultra High Volume | | |
| Scheduled GB Mode | | |
| Scheduled Rows Mode | | |
| Scheduled High Complexity | | |
| Headless Micro ON | | |
| Headless Micro OFF | | |
| Headless Micro OFF High Volume | | |

**Overall Result:** PASS / FAIL
**Issues Found:** ___________
**Action Items:** ___________

---

## Acceptance Criteria

✅ **MUST PASS:**
- [ ] All 4 calculators produce identical results to original with default values
- [ ] All formulas verified byte-for-byte match with original
- [ ] All constants match original values
- [ ] Password unlock reveals correct fields
- [ ] Toggles switch modes correctly
- [ ] Results save to CalculatorContext for diagram generation
- [ ] No JavaScript console errors
- [ ] Works in Chrome, Firefox, Safari, Edge

⚠️ **BLOCKERS (Any failure = No deployment):**
- Formula mismatch
- Incorrect HA node calculation
- Missing results in context
- JavaScript errors

---

## Sign-Off

**Developer:** ___________
**Date:** ___________
**Status:** ✅ Ready for Testing / ❌ Issues Found

**QA Tester:** ___________
**Date:** ___________
**Status:** ✅ Approved / ❌ Rejected

**Stakeholder:** ___________
**Date:** ___________
**Status:** ✅ Approved for Production / ❌ Needs Revision
