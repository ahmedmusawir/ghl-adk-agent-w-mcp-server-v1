# GoHighLevel API - Lessons Learned & Best Practices

**Date:** October 20, 2025  
**Issue:** Calendar Events Tool Returning Empty Results  
**Resolution:** Fixed by properly handling locationId and date format conversions

---

## 🐛 The Problem

The `get_calendar_events` tool was successfully calling the GHL API (200 response) but returning empty results, even though appointments existed in the calendar. The appointment was visible in:
- ✅ GHL Portal UI
- ✅ `get_contact_appointments` tool (via contact endpoint)
- ❌ `get_calendar_events` tool (via calendar endpoint)

---

## 🔍 Root Causes Discovered

### 1. **LocationId Parameter Issue** (PRIMARY FIX)
**Problem:**
```typescript
// WRONG ❌
const response = await this.ghlClient.getCalendarEvents({
  calendarId: params.calendarId,
  startTime: startTime,
  endTime: endTime,
  locationId: '' // Empty string causes API to return empty results!
});
```

**Solution:**
```typescript
// CORRECT ✅
const response = await this.ghlClient.getCalendarEvents({
  locationId: this.ghlClient.getConfig().locationId, // Use actual locationId
  calendarId: params.calendarId,
  startTime: startTime,
  endTime: endTime
});
```

**Lesson:** GHL API requires a valid `locationId` even when filtering by `calendarId`. An empty string is treated as invalid and returns empty results without error.

---

### 2. **Date Format Conversion Requirements**

**Problem:** GHL API has INCONSISTENT date format requirements across endpoints:

| Endpoint | Parameter | Required Format | Example |
|----------|-----------|----------------|---------|
| `GET /calendars/events` | `startTime`, `endTime` | **Milliseconds (string)** | `"1761300000000"` |
| `GET /calendars/free-slots` | `startDate`, `endDate` | **Milliseconds (number)** | `1761300000000` |
| `POST /calendars/events` | `startTime`, `endTime` | **ISO 8601** | `"2025-10-24T10:00:00Z"` |
| `PUT /calendars/events/{id}` | `startTime`, `endTime` | **ISO 8601** | `"2025-10-24T10:00:00Z"` |

**Solution:** Created two helper functions:

```typescript
/**
 * Convert ISO date to milliseconds string
 * Used for: getCalendarEvents (startTime/endTime)
 */
private convertToMilliseconds(dateString: string): string {
  if (/^\d+$/.test(dateString)) return dateString;
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) return date.getTime().toString();
  return dateString;
}

/**
 * Convert ISO date to milliseconds number
 * Used for: getFreeSlots (startDate/endDate)
 */
private convertDateToMilliseconds(dateString: string): number {
  if (/^\d+$/.test(dateString)) return parseInt(dateString, 10);
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) return date.getTime();
  return Date.now();
}
```

**Lesson:** Always check the GHL API type definitions for the exact format required. Don't assume consistency across endpoints.

---

### 3. **Response Wrapping Pattern**

**Problem:** Tools were returning the wrapped response instead of the actual data:

```typescript
// WRONG ❌
return response; // Returns { success: true, data: {...} }
```

**Solution:**
```typescript
// CORRECT ✅
return response.data; // Returns the actual data
```

**Lesson:** The `GHLApiClient` wraps all responses in `{ success: boolean, data: T, error?: Error }`. Always return `response.data` to match the pattern used by other tools (contact-tools, conversation-tools, etc.).

---

## 🎯 Debugging Strategy That Worked

### Step 1: Verify API Call Success
- ✅ Check MCP logs for 200 response
- ✅ Confirm no error messages
- ✅ Verify tool execution completes

### Step 2: Check Alternative Endpoints
- ✅ Use `get_contact_appointments` to verify appointment exists
- ✅ Compare data structure between endpoints
- ✅ Identify what's different

### Step 3: Inspect Raw Output
- ✅ Request raw JSON output from tools
- ✅ Compare expected vs actual parameters
- ✅ Check for empty strings, null values, or format issues

### Step 4: Review Original Implementation
- ✅ Check backup files for working patterns
- ✅ Compare parameter passing
- ✅ Identify missing or changed parameters

---

## 📋 Checklist for Implementing GHL Tools

When creating or fixing GHL API tools, verify:

- [ ] **LocationId is always provided** (never empty string)
- [ ] **Date formats match API requirements** (check type definitions)
- [ ] **Return `response.data` not `response`** (unwrap the response)
- [ ] **Error handling covers all HTTP codes** (400, 401, 403, 404, 409, 500)
- [ ] **Optional parameters use conditional spreading** (`...(param && { param })`)
- [ ] **Test with raw output** to verify data structure
- [ ] **Compare with working tools** (contact-tools.ts, conversation-tools.ts)

---

## 🔧 Tools to Audit

Based on these lessons, the following tools should be reviewed:

### High Priority (Use Date Parameters)
- [ ] **Blog Tools** - Check if date filters need conversion
- [ ] **Opportunity Tools** - Check date range queries
- [ ] **Conversation Tools** - Check message timestamps

### Medium Priority (Use LocationId)
- [ ] **Contact Tools** - Verify locationId handling
- [ ] **Workflow Tools** (if any) - Check locationId requirements
- [ ] **Campaign Tools** (if any) - Check locationId requirements

### Audit Commands
```bash
# Find all tools that might need locationId
grep -r "locationId.*''" src/tools/

# Find all tools that handle dates
grep -r "startTime\|endTime\|startDate\|endDate" src/tools/

# Find all tools that return response directly
grep -r "return response;" src/tools/
```

---

## 🚀 Best Practices Going Forward

### 1. Always Use Type Definitions
```typescript
// Check src/types/ghl-types.ts for exact requirements
interface GHLGetCalendarEventsRequest {
  locationId: string;
  startTime: string; // milliseconds ← IMPORTANT!
  endTime: string; // milliseconds
  calendarId?: string;
}
```

### 2. Follow Existing Patterns
```typescript
// Pattern from contact-tools.ts (PROVEN WORKING)
private async searchContacts(params: any): Promise<any> {
  const response = await this.ghlClient.searchContacts({
    locationId: this.ghlClient.getConfig().locationId, // ✅ Always get from config
    query: params.query,
    limit: params.limit
  });
  
  if (!response.success) {
    throw new Error(response.error?.message || "Failed to search");
  }
  
  return response.data!; // ✅ Return unwrapped data
}
```

### 3. Test with Multiple Scenarios
- ✅ Empty results (no data matches)
- ✅ Single result
- ✅ Multiple results
- ✅ Error cases (404, 401, etc.)
- ✅ Edge cases (date boundaries, timezones)

### 4. Document API Quirks
When you discover an API quirk, document it immediately:
```typescript
/**
 * Get calendar events within a date range
 * 
 * IMPORTANT: GHL API requires:
 * - locationId must be valid (empty string returns empty results)
 * - startTime/endTime must be in milliseconds format (string)
 * - Times are interpreted in the location's timezone
 */
```

---

## 📊 Success Metrics

**Before Fix:**
- ❌ `get_calendar_events` returned empty array
- ❌ Appointments not discoverable via calendar search
- ❌ Users had to use contact-based workaround

**After Fix:**
- ✅ `get_calendar_events` returns all appointments
- ✅ Calendar search works as expected
- ✅ Consistent behavior across all calendar tools
- ✅ Proper error messages for edge cases

---

## 🎓 Key Takeaways

1. **GHL API is inconsistent** - Different endpoints have different requirements
2. **Empty string ≠ undefined** - GHL treats empty strings as invalid values
3. **Type definitions are gospel** - Always check the interface comments
4. **Test alternative endpoints** - If one doesn't work, try another to verify data exists
5. **Raw output is invaluable** - Always inspect actual API responses when debugging
6. **Follow working patterns** - Don't reinvent the wheel, copy from working tools

---

## 📝 Related Files

- **Fixed File:** `src/tools/calendar-tools.ts`
- **Backup:** `src/tools/calendar-tools-old-backup.ts`
- **Reference:** `src/tools/contact-tools.ts` (working patterns)
- **Types:** `src/types/ghl-types.ts` (API requirements)
- **Client:** `src/clients/ghl-api-client.ts` (API wrapper)

---

**Last Updated:** October 20, 2025  
**Status:** ✅ Resolved and Documented
