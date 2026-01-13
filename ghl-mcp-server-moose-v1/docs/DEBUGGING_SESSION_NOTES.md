# Social Media Tools Debugging Session
**Date:** October 23-26, 2025  
**Status:** ✅ FIXED - Both Validation Error and Response Parsing Issues Resolved

## 🔍 Problem Identified

### Issue
- **Tool:** `search_social_posts`
- **Error:** MCP error -32602: Invalid arguments
- **Root Cause:** Required parameters `fromDate` and `toDate` were not being provided by AI agents

### Error Details (from ADK Log)
```json
{
  "code": "invalid_type",
  "expected": "string",
  "received": "undefined",
  "path": ["fromDate"],
  "message": "Required"
}
```

### Symptoms
1. ✅ GHL UI showed Facebook account "Htmlfivedev" connected
2. ❌ `get_social_accounts` returned 0 accounts (separate issue - see below)
3. ❌ `search_social_posts` failed with validation error
4. ❌ Agents couldn't search for posts without providing dates

## ✅ Solution Implemented

### Changes Made to `social-media-tools.ts`

**1. Made Date Parameters Optional**
```typescript
// BEFORE (Line 56-57)
fromDate: z.string().describe('Start date in ISO format (required)'),
toDate: z.string().describe('End date in ISO format (required)'),

// AFTER
fromDate: z.string().optional().describe('Start date in ISO format (defaults to 30 days ago)'),
toDate: z.string().optional().describe('End date in ISO format (defaults to today)'),
```

**2. Added Sensible Defaults in Implementation**
```typescript
private async searchSocialPosts(params: any) {
  // Provide sensible defaults for date range (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const fromDate = params.fromDate || thirtyDaysAgo.toISOString().split('T')[0];
  const toDate = params.toDate || now.toISOString().split('T')[0];
  
  // ... rest of implementation
}
```

**3. Updated Description**
- Changed from "Required Parameters" to "Optional Parameters"
- Added: "Call with no parameters to list recent posts. All parameters are optional."
- Follows the same pattern as `search_contacts` tool

### Files Modified
- ✅ `src/tools/social-media-tools.ts` - Fixed validation and added defaults
- ✅ `src/tools/social-media-tools-1.ts` - Backup created before changes

### Build Status
- ✅ TypeScript compilation successful
- ✅ No errors or warnings

## 🧪 Testing Required

### Next Steps
1. **Test with Claude Desktop (STDIO)**
   - Restart Claude Desktop
   - Try: "search for social posts"
   - Try: "get social accounts"

2. **Test with ADK Agent (HTTP)**
   - Restart ADK agent
   - Try: "can you look for any social posts please"
   - Try: "get my social media accounts"

3. **Verify Date Defaults**
   - Confirm posts from last 30 days are returned
   - Test with custom date ranges

## ⚠️ Remaining Issue: `get_social_accounts` Returns 0

### Observation
The GHL UI clearly shows the "Htmlfivedev" Facebook account is connected, but the API returns 0 accounts.

### Possible Causes
1. **API Scope Issue** - Location-level API key might not have permission to see social accounts
2. **API Endpoint Issue** - Endpoint might be incorrect or require different authentication
3. **Data Structure Issue** - Accounts might be in a different data structure or require different API endpoints
4. **Account Status** - Account might be in a state the API doesn't recognize

### Investigation Needed
- Check GHL API documentation for social media accounts endpoint
- Verify API scopes in Private Integration settings
- Test with direct API call (curl/Postman) to isolate MCP vs API issue
- Check if there's a different endpoint for listing connected accounts

## 📝 Lessons Learned

1. **Always make search parameters optional** - Agents should be able to call search tools without parameters
2. **Provide sensible defaults** - 30-day lookback is reasonable for social media posts
3. **Follow established patterns** - The `search_contacts` tool was a good reference
4. **Check ADK logs for validation errors** - MCP logs may not show Zod validation errors clearly
5. **UI ≠ API** - Just because the UI shows data doesn't mean the API will return it

## ✅ SECOND FIX - Response Parsing Issue (Oct 26, 2025)

### Problem Identified via Postman Testing
After fixing the validation error, tools still returned empty arrays even though:
- ✅ API calls were successful (200/201 responses)
- ✅ Postman showed data was being returned
- ✅ All permissions were correctly configured

### Root Cause
**GHL API returns data nested under `results` object**, but our code was looking at the root level:

**Actual GHL Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Fetched Accounts",
  "results": {
    "accounts": [...],
    "groups": [...]
  }
}
```

**Our code was looking for:**
```json
{
  "accounts": [...],
  "groups": [...]
}
```

### Files Fixed

**1. Type Definitions (`src/types/ghl-types.ts`)**
```typescript
// BEFORE
export interface GHLGetAccountsResponse {
  accounts: GHLSocialAccount[];
  groups: GHLSocialGroup[];
}

export interface GHLSearchPostsResponse {
  posts: GHLSocialPost[];
  count: number;
}

// AFTER
export interface GHLGetAccountsResponse {
  results: {
    accounts: GHLSocialAccount[];
    groups: GHLSocialGroup[];
  };
}

export interface GHLSearchPostsResponse {
  results: {
    posts: GHLSocialPost[];
    count: number;
  };
}
```

**2. Tool Implementation (`src/tools/social-media-tools.ts`)**
```typescript
// BEFORE
const accounts = response.data?.accounts || [];
const groups = response.data?.groups || [];

// AFTER
const accounts = response.data?.results?.accounts || [];
const groups = response.data?.results?.groups || [];
```

**3. API Endpoints (`src/clients/ghl-api-client.ts`)**
- Confirmed correct endpoint: `GET /social-media-posting/{locationId}/accounts`
- Confirmed correct endpoint: `GET /social-media-posting/{locationId}/posts` with query params

### Testing Results
✅ `get_social_accounts` now returns actual connected accounts  
✅ `search_social_posts` now returns actual posts  
✅ Both tools work in Claude Desktop (STDIO) and ADK agents (HTTP)

## 🔄 Rollback Instructions

Backups created:
- `src/clients/ghl-api-client-backup.ts`
- `src/types/ghl-types-backup.ts`

If needed, restore:
```bash
cp src/clients/ghl-api-client-backup.ts src/clients/ghl-api-client.ts
cp src/types/ghl-types-backup.ts src/types/ghl-types.ts
npm run build
```

## 📊 Progress Update

### Social Media Tools Conversion Status
- ✅ 1/17 tools converted to Zod: `search_social_posts`
- ⏳ 16/17 tools remaining
- 🐛 1 bug fixed: Required date parameters
- ⚠️ 1 issue identified: `get_social_accounts` returning 0

### Next Actions
1. Test the fixed `search_social_posts` tool
2. Investigate `get_social_accounts` API issue
3. Continue converting remaining 16 tools to Zod
