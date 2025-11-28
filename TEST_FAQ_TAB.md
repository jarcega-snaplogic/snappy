# FAQ Tab Testing Guide

## Quick Start

```bash
cd /home/user/snappy
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

---

## Visual Test Checklist

### Tab Navigation
- [ ] All 6 tabs visible at top
- [ ] FAQ tab (6th tab) clickable
- [ ] Clicking FAQ tab shows FAQ content

### FAQ Display
- [ ] "Frequently Asked Questions" heading visible
- [ ] 7 FAQ questions listed:
  1. What are the nodes?
  2. What are feedmaster nodes?
  3. Are there different sizes for nodes?
  4. Will the node sizing calculator recommend different node sizes?
  5. What are memory optimized nodes?
  6. Can SnapLogic be deployed with auto-scaling?
  7. What are the recommended EC2 instance types?

### Accordion Behavior
- [ ] Click FAQ 1 → opens
- [ ] Click FAQ 2 → FAQ 1 closes, FAQ 2 opens
- [ ] Click FAQ 2 again → FAQ 2 closes
- [ ] Only ONE FAQ open at a time

### Content Verification
- [ ] FAQ 2 has bullet list (5 items)
- [ ] FAQ 3 has bullet list (4 node sizes)
- [ ] FAQ 6 has numbered list (4 steps)
- [ ] FAQ 7 has AWS/Azure/GCP sections

---

## Browser Console Test

**Open Developer Tools (F12) → Console**

Expected output:
```
✓ React 18 App initialized
✓ AppContext, CalculatorContext, DiagramContext ready
✓ Phase 0 complete - Foundation ready for migration
```

**No errors or warnings should appear.**

---

## Interactive Test

1. Open the app
2. Click "FAQ" tab
3. Click each FAQ question one by one
4. Verify:
   - Previous FAQ closes
   - New FAQ opens
   - Content displays correctly
   - Lists render properly
   - Line breaks work

---

## Expected CSS Classes

**When FAQ is closed:**
```html
<div class="faq-item">
  <div class="faq-question">Question text</div>
</div>
```

**When FAQ is open:**
```html
<div class="faq-item active">
  <div class="faq-question">Question text</div>
  <div class="faq-answer">Answer content</div>
</div>
```

---

## Common Issues & Solutions

### Issue: Tab doesn't switch
**Check:** Is `activeTab` state updating in AppContext?

### Issue: Multiple FAQs open at once
**Check:** Is `openFaqId` state being set correctly?

### Issue: FAQ answer doesn't show
**Check:** Is `isOpen` prop being passed correctly?

### Issue: Click doesn't work
**Check:** Is `onToggle` handler being called?

---

## Performance Check

- FAQ toggle should be instant
- No lag when switching tabs
- No console warnings about re-renders
- Memory usage stable

---

**Status:** Ready for testing
**Phase:** 2 - FAQ Tab Implementation
**Date:** 2025-11-08
