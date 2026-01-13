# GHL API Quick Reference Guide

**Last Updated:** October 20, 2025

---

## 🚨 Critical Rules

### 1. Never Use Empty String for LocationId
```typescript
// ❌ WRONG - Returns empty results
locationId: params.locationId || ''

// ✅ CORRECT - Uses configured location
locationId: params.locationId || this.ghlClient.getConfig().locationId
```

### 2. Always Return Unwrapped Data
```typescript
// ❌ WRONG - Returns { success: true, data: {...} }
return response;

// ✅ CORRECT - Returns actual data
return response.data;
```

### 3. Check Response Success
```typescript
// ✅ ALWAYS CHECK
if (!response.success) {
  throw new Error(response.error?.message || "API call failed");
}
return response.data;
```

---

## 📅 Date Format Requirements

| Endpoint | Parameter | Format | Example |
|----------|-----------|--------|---------|
| **GET** `/calendars/events` | `startTime`, `endTime` | Milliseconds (string) | `"1761300000000"` |
| **GET** `/calendars/free-slots` | `startDate`, `endDate` | Milliseconds (number) | `1761300000000` |
| **POST** `/calendars/events` | `startTime`, `endTime` | ISO 8601 | `"2025-10-24T10:00:00Z"` |
| **PUT** `/calendars/events/{id}` | `startTime`, `endTime` | ISO 8601 | `"2025-10-24T10:00:00Z"` |

### Helper Functions
```typescript
// For GET endpoints (returns string)
private convertToMilliseconds(dateString: string): string {
  if (/^\d+$/.test(dateString)) return dateString;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.getTime().toString() : dateString;
}

// For free slots (returns number)
private convertDateToMilliseconds(dateString: string): number {
  if (/^\d+$/.test(dateString)) return parseInt(dateString, 10);
  const date = new Date(dateString);
  return !isNaN(date.getTime()) ? date.getTime() : Date.now();
}
```

---

## 🎯 Standard Tool Pattern

```typescript
class SomeTool {
  private ghlClient: GHLApiClient;

  constructor(ghlClient: GHLApiClient) {
    this.ghlClient = ghlClient;
  }

  // Tool method
  private async someMethod(params: any): Promise<any> {
    try {
      // 1. Prepare parameters with proper defaults
      const apiParams = {
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        // Convert dates if needed
        startTime: this.convertToMilliseconds(params.startTime),
        // Other params
        ...params
      };

      // 2. Call API
      const response = await this.ghlClient.someApiCall(apiParams);

      // 3. Check success
      if (!response.success) {
        throw new Error(response.error?.message || "API call failed");
      }

      // 4. Return unwrapped data
      return response.data;

    } catch (error: any) {
      // 5. Handle specific errors
      if (error.message?.includes('(404)')) {
        throw new Error(`Resource not found: ${error.message}`);
      }
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: ${error.message}`);
      }
      
      // 6. Generic error
      throw new Error(`Failed to execute: ${error.message || error}`);
    }
  }
}
```

---

## 🔍 Debugging Checklist

When a tool returns empty results:

1. ✅ **Check locationId** - Is it empty string?
2. ✅ **Check date format** - Does it match API requirements?
3. ✅ **Check response wrapping** - Returning `response` or `response.data`?
4. ✅ **Check alternative endpoints** - Does data exist via different API?
5. ✅ **Check raw output** - What is the actual API response?
6. ✅ **Check type definitions** - What does the interface say?

---

## 📊 Common Error Codes

| Code | Meaning | Common Cause | Fix |
|------|---------|--------------|-----|
| 400 | Bad Request | Invalid parameters, wrong date format | Check parameter types and formats |
| 401 | Unauthorized | Invalid API key | Verify API key in .env |
| 403 | Forbidden | Insufficient permissions | Check API key permissions in GHL |
| 404 | Not Found | Resource doesn't exist | Verify IDs are correct |
| 409 | Conflict | Duplicate or constraint violation | Check for existing data |
| 500 | Server Error | GHL internal error | Retry or contact GHL support |

---

## 🛠️ Testing Commands

### Test Tool with Raw Output
```typescript
// In Claude Desktop or via HTTP endpoint
"Use [tool_name] with [params] and show me the raw output"
```

### Test Date Conversion
```bash
node -e "console.log(new Date('2025-10-24T10:00:00Z').getTime())"
# Output: 1761300000000
```

### Check Tool Registration
```bash
# HTTP Server
curl http://localhost:9000/health | jq '.tools'

# STDIO Server (Claude Desktop)
# Ask: "List all available tools"
```

---

## 📚 Reference Files

| File | Purpose |
|------|---------|
| `src/types/ghl-types.ts` | API interface definitions |
| `src/clients/ghl-api-client.ts` | API client wrapper |
| `src/tools/contact-tools.ts` | Reference implementation (correct patterns) |
| `src/tools/calendar-tools.ts` | Recently fixed (good example) |
| `docs/GHL-API-LESSONS-LEARNED.md` | Detailed lessons and debugging |
| `docs/TOOLS-AUDIT-REPORT.md` | Tool audit findings |

---

## 🎓 Best Practices

1. **Always use type definitions** - Check `ghl-types.ts` first
2. **Follow working patterns** - Copy from `contact-tools.ts`
3. **Test with edge cases** - Empty results, errors, boundaries
4. **Document quirks** - Add comments for non-obvious behavior
5. **Create backups** - Before major changes: `file-1.ts`, `file-2.ts`, etc.
6. **Check logs** - MCP logs show actual API calls
7. **Use raw output** - When debugging, always check raw JSON

---

## 🚀 Quick Fixes

### Fix Empty LocationId
```bash
# Find all instances
grep -r "locationId.*''" src/tools/

# Replace pattern
# FROM: locationId: params.locationId || ''
# TO:   locationId: params.locationId || this.ghlClient.getConfig().locationId
```

### Fix Response Wrapping
```bash
# Find all instances
grep -r "return response;" src/tools/

# Replace pattern
# FROM: return response;
# TO:   return response.data;
```

---

## 💡 Pro Tips

1. **Use Claude to test** - Ask for raw output to see actual API responses
2. **Check alternative endpoints** - If one fails, try related endpoints
3. **Compare with working tools** - When in doubt, copy proven patterns
4. **Read error messages carefully** - GHL errors are usually descriptive
5. **Test incrementally** - Fix one issue at a time, test, then move on

---

**Remember:** When in doubt, check `contact-tools.ts` - it's the gold standard! ✨
