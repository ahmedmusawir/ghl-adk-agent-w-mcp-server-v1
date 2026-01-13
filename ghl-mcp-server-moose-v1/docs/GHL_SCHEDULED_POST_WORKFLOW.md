# 🔄 GHL Scheduled Post Update Workflow

**Date:** October 26, 2025  
**Discovered By:** User testing with agent

---

## 🎯 The Behavior

**When you update a SCHEDULED post in GHL, it automatically changes to DRAFT status!**

This is a **GHL platform behavior**, not a bug in our MCP implementation.

---

## 📋 What Happens

### Step-by-Step:

1. **You have a scheduled post:**
   - Status: "scheduled"
   - scheduleDate: "2025-10-27T14:00:00.000Z"
   - Summary: "Original content"

2. **You update the content:**
   ```
   update_social_post({
     postId: "...",
     accountIds: [...],
     summary: "Updated content"
   })
   ```

3. **GHL automatically changes status:**
   - Status: "scheduled" → **"draft"** ❗
   - scheduleDate: REMOVED
   - Summary: "Updated content" ✅

4. **Post is now a draft:**
   - No longer scheduled
   - Won't publish at the scheduled time
   - Appears in draft list, not scheduled list

---

## ✅ Correct Workflow

### Option 1: Update + Reschedule in One Call

**Best approach - do it all at once:**

```typescript
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Updated content",
  status: "scheduled",              // Re-set to scheduled
  scheduleDate: "2025-10-27T14:00:00.000Z", // Re-set schedule date
  scheduleTimeUpdated: true         // Flag that schedule changed
})
```

**Result:**
- ✅ Content updated
- ✅ Status stays "scheduled"
- ✅ Schedule date preserved
- ✅ Post will publish at scheduled time

### Option 2: Update Then Reschedule (Two Steps)

**If you need to update first, then decide on schedule:**

**Step 1 - Update content:**
```typescript
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Updated content"
})
// Result: Post is now draft
```

**Step 2 - Reschedule:**
```typescript
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Updated content",
  status: "scheduled",
  scheduleDate: "2025-10-27T14:00:00.000Z",
  scheduleTimeUpdated: true
})
// Result: Post is scheduled again
```

---

## 🤖 Agent Intelligence

### Smart agents should:

1. **Understand the workflow:**
   ```
   User: "Fix the typo in my scheduled post"
   
   Agent reasoning:
   - Post is currently scheduled
   - Updating will make it draft
   - Need to reschedule after update
   
   Agent action:
   - Update content + re-set status + re-set scheduleDate in ONE call
   ```

2. **Inform the user:**
   ```
   "I've updated the content and re-scheduled the post for 2pm tomorrow. 
   Note: GHL requires rescheduling when you edit scheduled posts."
   ```

3. **Ask if schedule should change:**
   ```
   "I've updated the content. Should I keep the same schedule (tomorrow at 2pm) 
   or would you like to change it?"
   ```

---

## 📊 Status Transitions

### What GHL Does:

```
SCHEDULED post + update → DRAFT
DRAFT post + set scheduleDate + status: "scheduled" → SCHEDULED
```

### What Our Tool Does Now:

**Before our fix:**
```
update_social_post(content only)
→ Status: scheduled → published ❌ (BUG!)
```

**After our fix:**
```
update_social_post(content only)
→ Preserves status: scheduled → draft ✅ (GHL behavior)
```

**With reschedule:**
```
update_social_post(content + status + scheduleDate)
→ Status: draft → scheduled ✅ (Correct!)
```

---

## 🎓 Why GHL Does This

**Possible reasons:**

1. **Safety:** Prevents accidental publishing of edited content
2. **Review:** Forces user to review before rescheduling
3. **Intentional:** Ensures user confirms the schedule after changes
4. **Platform design:** Separates editing from scheduling

**This is intentional GHL behavior, not a bug.**

---

## 📝 Tool Description Updated

The `update_social_post` tool description now includes:

```
🔄 IMPORTANT GHL BEHAVIOR - SCHEDULED POSTS:
When you update a SCHEDULED post, GHL automatically changes its status to DRAFT!
This means:
1. Update scheduled post → Status changes to "draft"
2. Post is NO LONGER scheduled (loses schedule date)
3. You must RESCHEDULE it by setting scheduleDate + status: "scheduled"

WORKFLOW for editing scheduled posts:
1. Update the post content (it becomes draft automatically)
2. Reschedule it: Set scheduleDate + status: "scheduled" + scheduleTimeUpdated: true
```

---

## 🧪 Testing Scenarios

### Scenario 1: Update Scheduled Post (Smart Way)
```typescript
// Input
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Fixed typo",
  status: "scheduled",
  scheduleDate: "2025-10-27T14:00:00.000Z",
  scheduleTimeUpdated: true
})

// Expected
✅ Content updated
✅ Status: "scheduled"
✅ Will publish at scheduled time
```

### Scenario 2: Update Scheduled Post (Without Reschedule)
```typescript
// Input
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Fixed typo"
})

// Expected
✅ Content updated
⚠️ Status: "draft" (GHL behavior)
⚠️ No longer scheduled
```

### Scenario 3: Reschedule Draft Back to Scheduled
```typescript
// Input (draft post from scenario 2)
update_social_post({
  postId: "...",
  accountIds: [...],
  summary: "Fixed typo",
  status: "scheduled",
  scheduleDate: "2025-10-27T14:00:00.000Z",
  scheduleTimeUpdated: true
})

// Expected
✅ Status: "scheduled"
✅ Will publish at scheduled time
```

---

## 💡 Best Practices

### For Users:
1. **Understand the workflow:** Editing scheduled posts requires rescheduling
2. **Use one-step update:** Include status + scheduleDate in update call
3. **Check status after update:** Verify post is still scheduled

### For Agents:
1. **Always reschedule:** When updating scheduled posts, include status + scheduleDate
2. **Inform users:** Explain that rescheduling is required
3. **Preserve schedule:** Use original scheduleDate unless user wants to change it
4. **Set flag:** Always include `scheduleTimeUpdated: true` when rescheduling

### For Developers:
1. **Document behavior:** Make GHL's behavior clear in tool descriptions
2. **Provide examples:** Show correct workflow in documentation
3. **Test thoroughly:** Verify status transitions work as expected

---

## 🎯 Summary

**GHL Behavior:**
- Updating scheduled post → Changes to draft
- Must explicitly reschedule to restore scheduled status

**Our Solution:**
- Tool description documents this workflow
- Agents can update + reschedule in one call
- Status preservation prevents accidental publishing

**User Experience:**
- Clear expectations about workflow
- Agents handle rescheduling automatically
- No surprises about post status changes

---

**This is now fully documented in the tool description so agents will understand the workflow!** ✅
