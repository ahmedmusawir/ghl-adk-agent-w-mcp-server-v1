# GHL MCP Tools - Audit Report

**Date:** October 20, 2025  
**Auditor:** Cascade AI  
**Trigger:** Calendar Tools Bug Fix (Empty LocationId Issue)

---

## 🎯 Audit Objective

After discovering that empty `locationId` strings cause GHL API to return empty results, we audited all tools to identify similar potential issues.

---

## ⚠️ Findings: Tools with Potential LocationId Issues

### 🔴 HIGH PRIORITY - Needs Immediate Review

#### 1. **Custom Field V2 Tools** (`src/tools/custom-field-v2-tools.ts`)
**Lines:** 296, 320, 350, 364, 377, 390

**Issue:**
```typescript
locationId: params.locationId || '', // ❌ Empty string fallback
```

**Recommended Fix:**
```typescript
locationId: params.locationId || this.ghlClient.getConfig().locationId, // ✅
```

**Impact:** May return empty results when locationId is not provided by user.

---

#### 2. **Survey Tools** (`src/tools/survey-tools.ts`)
**Lines:** 106, 143

**Issue:**
```typescript
locationId: params.locationId || '', // ❌ Empty string fallback
```

**Recommended Fix:**
```typescript
locationId: params.locationId || this.ghlClient.getConfig().locationId, // ✅
```

**Impact:** May fail to retrieve or create surveys without explicit locationId.

---

#### 3. **Workflow Tools** (`src/tools/workflow-tools.ts`)
**Line:** 52

**Issue:**
```typescript
locationId: params.locationId || '' // ❌ Empty string fallback
```

**Recommended Fix:**
```typescript
locationId: params.locationId || this.ghlClient.getConfig().locationId // ✅
```

**Impact:** May fail to retrieve workflows without explicit locationId.

---

## ✅ Tools That Are Correct

### Contact Tools (`src/tools/contact-tools.ts`)
```typescript
// ✅ CORRECT PATTERN
locationId: this.ghlClient.getConfig().locationId
```
**Status:** No issues found. Uses config locationId consistently.

---

### Conversation Tools (`src/tools/conversation-tools.ts`)
```typescript
// ✅ CORRECT PATTERN
locationId: this.ghlClient.getConfig().locationId
```
**Status:** No issues found. Uses config locationId consistently.

---

### Blog Tools (`src/tools/blog-tools.ts`)
**Status:** No locationId parameters used. No issues found.

---

### Opportunity Tools (`src/tools/opportunity-tools.ts`)
```typescript
// ✅ CORRECT PATTERN
locationId: this.ghlClient.getConfig().locationId
```
**Status:** No issues found. Uses config locationId consistently.

---

### Calendar Tools (`src/tools/calendar-tools.ts`)
```typescript
// ✅ FIXED
locationId: this.ghlClient.getConfig().locationId
```
**Status:** ✅ Fixed in this session. Now uses config locationId.

---

## 📊 Summary Statistics

| Status | Count | Tools |
|--------|-------|-------|
| ✅ Correct | 5 | Contact, Conversation, Blog, Opportunity, Calendar |
| ⚠️ Needs Fix | 3 | Custom Field V2, Survey, Workflow |
| 🔍 Total Audited | 8 | All current tools |

---

## 🔧 Recommended Actions

### Immediate (Before Next Deployment)
1. ✅ **Calendar Tools** - FIXED
2. ⚠️ **Custom Field V2 Tools** - Fix 6 instances of empty locationId
3. ⚠️ **Survey Tools** - Fix 2 instances of empty locationId
4. ⚠️ **Workflow Tools** - Fix 1 instance of empty locationId

### Testing Required
After fixes, test each tool with:
- ✅ No locationId parameter provided (should use config default)
- ✅ Valid locationId parameter provided (should use provided value)
- ✅ Invalid locationId parameter (should return proper error)

### Documentation
- ✅ Created `GHL-API-LESSONS-LEARNED.md`
- ⚠️ Update tool descriptions to clarify locationId is optional
- ⚠️ Add JSDoc comments explaining locationId fallback behavior

---

## 🎓 Pattern to Follow

### ✅ CORRECT Pattern (Use This)
```typescript
private async someMethod(params: any): Promise<any> {
  try {
    const response = await this.ghlClient.someApiCall({
      locationId: params.locationId || this.ghlClient.getConfig().locationId,
      // ... other params
    });
    
    if (!response.success) {
      throw new Error(response.error?.message || "API call failed");
    }
    
    return response.data; // ✅ Return unwrapped data
  } catch (error: any) {
    // ... error handling
  }
}
```

### ❌ INCORRECT Pattern (Avoid This)
```typescript
private async someMethod(params: any): Promise<any> {
  try {
    const response = await this.ghlClient.someApiCall({
      locationId: params.locationId || '', // ❌ Empty string causes issues
      // ... other params
    });
    
    return response; // ❌ Returns wrapped response
  } catch (error: any) {
    // ... error handling
  }
}
```

---

## 📝 Code Review Checklist

When reviewing or creating GHL tools:

- [ ] LocationId uses `this.ghlClient.getConfig().locationId` as fallback
- [ ] Never use empty string `''` as locationId fallback
- [ ] Return `response.data` not `response`
- [ ] Check `response.success` before returning data
- [ ] Handle all error codes (400, 401, 403, 404, 409, 500)
- [ ] Convert dates to correct format (check type definitions)
- [ ] Add descriptive error messages
- [ ] Test with and without optional parameters

---

## 🚀 Next Steps

1. **Create backup files** for tools that need fixing:
   ```bash
   cp src/tools/custom-field-v2-tools.ts src/tools/custom-field-v2-tools-1.ts
   cp src/tools/survey-tools.ts src/tools/survey-tools-1.ts
   cp src/tools/workflow-tools.ts src/tools/workflow-tools-1.ts
   ```

2. **Apply fixes** to each tool following the correct pattern

3. **Build and test** each fixed tool:
   ```bash
   npm run build
   # Test each tool with Claude Desktop or HTTP server
   ```

4. **Update documentation** with any new findings

5. **Create regression tests** to prevent future issues

---

## 📚 Related Documentation

- [GHL API Lessons Learned](./GHL-API-LESSONS-LEARNED.md)
- [Calendar Tools Fix](../src/tools/calendar-tools.ts)
- [Contact Tools Reference](../src/tools/contact-tools.ts) (Correct Pattern)

---

**Audit Status:** ✅ Complete  
**Action Required:** ⚠️ Fix 3 tools before next deployment  
**Last Updated:** October 20, 2025
