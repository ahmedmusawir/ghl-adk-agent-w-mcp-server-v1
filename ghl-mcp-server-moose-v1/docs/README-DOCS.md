# GHL MCP Server Documentation Index

**Last Updated:** October 20, 2025

---

## 📚 Documentation Overview

This directory contains critical documentation for the GoHighLevel MCP Server, including lessons learned, audit reports, and quick reference guides.

---

## 📖 Documents

### 1. [GHL API Lessons Learned](./GHL-API-LESSONS-LEARNED.md) 🎓
**Purpose:** Comprehensive analysis of the Calendar Tools bug and resolution

**Key Topics:**
- The empty locationId bug and fix
- Date format conversion requirements across endpoints
- Response wrapping patterns
- Debugging strategies that worked
- Best practices for implementing GHL tools

**When to Read:**
- Before implementing new GHL tools
- When debugging empty results issues
- When encountering API inconsistencies
- For onboarding new developers

---

### 2. [Tools Audit Report](./TOOLS-AUDIT-REPORT.md) 🔍
**Purpose:** Audit findings of all GHL tools for potential issues

**Key Topics:**
- Tools with empty locationId issues (Custom Field V2, Survey, Workflow)
- Tools that are correctly implemented
- Recommended fixes and priorities
- Testing checklist

**When to Read:**
- Before deploying to production
- When planning tool maintenance
- When prioritizing bug fixes
- For code review preparation

---

### 3. [Quick Reference Guide](./QUICK-REFERENCE-GHL-API.md) ⚡
**Purpose:** Fast lookup for common patterns and solutions

**Key Topics:**
- Critical rules (locationId, response wrapping)
- Date format requirements table
- Standard tool pattern template
- Debugging checklist
- Common error codes
- Quick fixes and commands

**When to Read:**
- While coding (keep it open!)
- When encountering errors
- For quick pattern lookup
- During code reviews

---

## 🎯 Quick Navigation

### I need to...

**Fix a tool returning empty results:**
1. Read: [Quick Reference - Debugging Checklist](./QUICK-REFERENCE-GHL-API.md#-debugging-checklist)
2. Check: [Lessons Learned - Root Causes](./GHL-API-LESSONS-LEARNED.md#-root-causes-discovered)

**Implement a new GHL tool:**
1. Read: [Quick Reference - Standard Tool Pattern](./QUICK-REFERENCE-GHL-API.md#-standard-tool-pattern)
2. Check: [Lessons Learned - Checklist](./GHL-API-LESSONS-LEARNED.md#-checklist-for-implementing-ghl-tools)
3. Reference: `src/tools/contact-tools.ts` (working example)

**Handle dates in API calls:**
1. Check: [Quick Reference - Date Format Table](./QUICK-REFERENCE-GHL-API.md#-date-format-requirements)
2. Copy: Helper functions from [Lessons Learned](./GHL-API-LESSONS-LEARNED.md#2-date-format-conversion-requirements)

**Review code before deployment:**
1. Use: [Audit Report - Code Review Checklist](./TOOLS-AUDIT-REPORT.md#-code-review-checklist)
2. Check: [Audit Report - Findings](./TOOLS-AUDIT-REPORT.md#️-findings-tools-with-potential-locationid-issues)

**Debug an API error:**
1. Check: [Quick Reference - Common Error Codes](./QUICK-REFERENCE-GHL-API.md#-common-error-codes)
2. Follow: [Lessons Learned - Debugging Strategy](./GHL-API-LESSONS-LEARNED.md#-debugging-strategy-that-worked)

---

## 🚨 Critical Information

### Must-Know Rules

1. **Never use empty string for locationId**
   ```typescript
   // ❌ WRONG
   locationId: params.locationId || ''
   
   // ✅ CORRECT
   locationId: params.locationId || this.ghlClient.getConfig().locationId
   ```

2. **Always return unwrapped data**
   ```typescript
   // ❌ WRONG
   return response;
   
   // ✅ CORRECT
   return response.data;
   ```

3. **Check date format requirements**
   - GET endpoints: milliseconds
   - POST/PUT endpoints: ISO 8601
   - See [date format table](./QUICK-REFERENCE-GHL-API.md#-date-format-requirements)

---

## 🔧 Tools Status

| Tool | Status | Notes |
|------|--------|-------|
| Contact Tools | ✅ Correct | Reference implementation |
| Conversation Tools | ✅ Correct | No issues found |
| Blog Tools | ✅ Correct | No locationId used |
| Opportunity Tools | ✅ Correct | No issues found |
| Calendar Tools | ✅ Fixed | Fixed in Oct 2025 |
| Custom Field V2 Tools | ⚠️ Needs Fix | 6 empty locationId instances |
| Survey Tools | ⚠️ Needs Fix | 2 empty locationId instances |
| Workflow Tools | ⚠️ Needs Fix | 1 empty locationId instance |

**See:** [Audit Report](./TOOLS-AUDIT-REPORT.md) for details

---

## 📊 Success Story

### The Calendar Tools Bug Fix (Oct 20, 2025)

**Problem:**
- `get_calendar_events` returned empty results
- API calls succeeded (200 response)
- Appointments visible in GHL portal
- Appointments found via `get_contact_appointments`

**Root Cause:**
- Empty string `''` used for locationId
- GHL API silently returned empty results

**Solution:**
- Changed to: `this.ghlClient.getConfig().locationId`
- Added date format conversion helpers
- Fixed response unwrapping

**Result:**
- ✅ Tool now works correctly
- ✅ All appointments discoverable
- ✅ Consistent behavior across tools
- ✅ Documented for future reference

**Time to Fix:** ~2 hours of debugging, 15 minutes to fix
**Lesson:** Always use proper locationId fallback!

---

## 🎓 Learning Resources

### For New Developers

1. **Start here:** [Quick Reference Guide](./QUICK-REFERENCE-GHL-API.md)
2. **Then read:** [Lessons Learned](./GHL-API-LESSONS-LEARNED.md)
3. **Study code:** `src/tools/contact-tools.ts` (best practices)
4. **Review types:** `src/types/ghl-types.ts` (API contracts)

### For Debugging

1. **Check:** [Debugging Checklist](./QUICK-REFERENCE-GHL-API.md#-debugging-checklist)
2. **Follow:** [Debugging Strategy](./GHL-API-LESSONS-LEARNED.md#-debugging-strategy-that-worked)
3. **Compare:** Working tools vs broken tools
4. **Test:** With raw output to see actual API responses

### For Code Review

1. **Use:** [Code Review Checklist](./TOOLS-AUDIT-REPORT.md#-code-review-checklist)
2. **Verify:** [Critical Rules](./QUICK-REFERENCE-GHL-API.md#-critical-rules)
3. **Check:** [Audit Report](./TOOLS-AUDIT-REPORT.md) for known issues

---

## 🚀 Next Steps

### Immediate Actions Required

1. ⚠️ **Fix Custom Field V2 Tools** - 6 instances of empty locationId
2. ⚠️ **Fix Survey Tools** - 2 instances of empty locationId
3. ⚠️ **Fix Workflow Tools** - 1 instance of empty locationId

### Recommended Improvements

1. 📝 Add JSDoc comments to all tool methods
2. 🧪 Create automated tests for date conversions
3. 📊 Add logging for locationId usage
4. 🔍 Set up linting rules to catch empty string locationId
5. 📚 Create video walkthrough of debugging process

---

## 🤝 Contributing

When adding new documentation:

1. Update this README with links to new docs
2. Follow the existing format and structure
3. Include practical examples and code snippets
4. Add to the Quick Navigation section
5. Update the Last Updated date

---

## 📞 Support

**Issues with tools?**
1. Check [Quick Reference](./QUICK-REFERENCE-GHL-API.md) first
2. Review [Lessons Learned](./GHL-API-LESSONS-LEARNED.md)
3. Check [Audit Report](./TOOLS-AUDIT-REPORT.md) for known issues
4. Ask Claude to help debug with raw output

**Found a new issue?**
1. Document it in a new lessons learned section
2. Update the audit report
3. Add to quick reference if it's a common pattern
4. Create a backup before fixing

---

## 📈 Version History

| Date | Change | Documents Updated |
|------|--------|-------------------|
| 2025-10-20 | Initial documentation after Calendar Tools fix | All 3 docs created |
| 2025-10-20 | Audit completed for all tools | Audit Report created |

---

**Remember:** These docs are living documents. Update them as you learn! 📚✨
