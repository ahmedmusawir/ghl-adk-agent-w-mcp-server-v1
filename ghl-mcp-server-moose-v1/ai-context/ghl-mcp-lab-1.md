## 📋 COMPREHENSIVE CONTEXT FOR NEXT LAB SESSION

---

# **GHL MCP Server Refactor - Lab Continuation Context**

## 🎯 PROJECT OVERVIEW

**Project:** GoHighLevel MCP Server Migration  
**Developer:** Tony Stark (Moose)  
**Objective:** Convert a broken SSE-based MCP server to modern Streamable HTTP protocol for integration with Google ADK agents

---

## ✅ WHAT WE'VE ACCOMPLISHED

### **Phase 1: Proof of Concept (COMPLETED ✅)**

1. **Built working echo MCP server** using new SDK pattern (McpServer + StreamableHTTPServerTransport)
2. **Successfully connected Python ADK agent to Node.js MCP server** via Streamable HTTP
3. **Proved the integration pattern works** - ADK ↔ MCP ↔ GHL API

### **Phase 2: ContactTools Refactor (COMPLETED ✅)**

1. **Converted `contact-tools.ts`** from JSON schemas to Zod schemas (31 tools)
2. **Refactored `http-server.ts`** to use:
   - `McpServer` instead of old `Server` class
   - `StreamableHTTPServerTransport` instead of SSE
   - `/mcp` POST endpoint for Streamable HTTP protocol
   - Proper tool registration with `registerTool()` method
3. **Removed SSE transport completely**
4. **Commented out all other tool categories** (16 remaining) to focus on ContactTools first
5. **Successfully tested ContactTools** with ADK agent - tools execute and return data

---

## 🔧 CURRENT TECHNICAL STACK

### **MCP Server (Node.js/TypeScript)**
- **Location:** `~/nodejs-mcp/GoHighLevel-MCP/`
- **Main File:** `src/http-server.ts` (refactored with new pattern)
- **Port:** 9000
- **Endpoint:** `http://localhost:9000/mcp`
- **Transport:** Streamable HTTP (stateless mode)
- **Tools Status:**
  - ✅ ContactTools (31 tools) - Fully refactored and working
  - ⏳ 16 other tool categories - Still using old JSON schemas, commented out

### **ADK Agent (Python)**
- **Location:** `~/python/google-adk-exp-v2/ghl_mcp_agent/`
- **Main File:** `agent.py`
- **Model:** Currently testing with `gpt-5-mini` (OpenAI direct)
- **LiteLLM Integration:** Using LiteLlm wrapper for model flexibility
- **MCP Connection:** StreamableHTTPConnectionParams pointing to `http://localhost:9000/mcp`

---

## 🐛 KNOWN ISSUES & SOLUTIONS

### **Issue 1: Multiple Simultaneous Tool Calls Breaking Response Chain**
**Problem:** When agent calls multiple tools (especially 10+ in parallel), some responses don't make it back to the LLM, causing "tool_call_id missing" errors

**Root Cause:** 
- One tool failure in a batch breaks the entire response chain
- LLM expects responses for ALL tool calls, but MCP server throws error on first failure
- Session gets poisoned with incomplete tool responses

**Solution Applied:**
```typescript
// Error handling in registerTools() - returns errors as responses instead of throwing
catch (error) {
  return {
    content: [{ type: 'text', text: `Error: ${errorMessage}` }],
    structuredContent: { error: errorMessage, tool: tool.name },
    isError: true
  };
}
```

### **Issue 2: Tool Execution Timeouts**
**Problem:** Some GHL API calls hang, causing ASGI timeout errors

**Solution Applied:**
```typescript
// 30-second timeout wrapper
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Tool execution timeout after 30s')), 30000);
});
const result = await Promise.race([executionPromise, timeoutPromise]);
```

### **Issue 3: Session Poisoning**
**Problem:** Once a bad response gets in conversation history, all subsequent messages fail

**Workaround:** Start new session (click "+ New Session" in ADK UI)

---

## 📁 KEY FILES & THEIR STATUS

### **Refactored Files (New Pattern ✅)**
1. **`src/http-server.ts`**
   - Uses McpServer + StreamableHTTPServerTransport
   - POST `/mcp` endpoint for Streamable HTTP
   - Only registers ContactTools currently
   - Includes error handling + timeout protection
   - All other tools commented out

2. **`src/tools/contact-tools.ts`**
   - Converted to Zod schemas
   - All 31 contact tools working
   - Pattern: `getToolDefinitions()` returns tools with Zod `inputSchema`

### **Files Needing Conversion (Old Pattern ⏳)**
16 tool files still using old JSON schema pattern:
- `conversation-tools.ts` (20 tools)
- `blog-tools.ts` (7 tools)
- `opportunity-tools.ts` (10 tools)
- `calendar-tools.ts` (14 tools)
- `email-tools.ts` (5 tools)
- `location-tools.ts` (21 tools)
- `email-isv-tools.ts` (1 tool)
- `social-media-tools.ts` (15 tools)
- `media-tools.ts` (3 tools)
- `object-tools.ts` (9 tools)
- `association-tools.ts` (10 tools)
- `custom-field-v2-tools.ts` (8 tools)
- `workflow-tools.ts` (1 tool)
- `survey-tools.ts` (2 tools)
- `store-tools.ts` (17 tools)
- `products-tools.ts` (24 tools)

**Total:** 167 tools remaining to convert

### **Files NOT Touched (Don't Need Changes)**
- `src/clients/ghl-api-client.ts` - GHL API integration (works fine)
- `src/types/ghl-types.ts` - Type definitions (works fine)
- All tool execution logic (private methods in tool classes) - works fine

---

## 🎓 KEY LEARNINGS

### **MCP Protocol Differences**
- **OLD (SSE):** Required `/sse` endpoint, permanent connections, separate message endpoint
- **NEW (Streamable HTTP):** Single `/mcp` endpoint, stateless, better for production

### **Tool Registration Pattern**
**OLD:**
```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Manual routing and response wrapping
});
```

**NEW:**
```typescript
mcpServer.registerTool(toolName, { description, inputSchema }, async (params) => {
  // Direct execution, automatic routing
});
```

### **Schema Conversion Pattern**
**OLD (JSON):**
```typescript
inputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string', description: '...' }
  },
  required: ['email']
}
```

**NEW (Zod):**
```typescript
inputSchema: {
  email: z.string().describe('...'),
  phone: z.string().optional().describe('...')
}
```

### **Response Format**
```typescript
return {
  content: [{ type: 'text', text: JSON.stringify(result) }],
  structuredContent: result  // Required when outputSchema is defined
};
```

---

## 🔬 MODEL TESTING INSIGHTS

### **Models Tested:**
1. **OpenRouter + Claude Sonnet 3.5** ❌
   - Failed with "Provider returned error" (vague)
   - OpenRouter proxy layer incompatible with MCP tools

2. **OpenAI GPT-4o-mini** ❌
   - Hallucinated non-existent tool names
   - Made poor decisions (called same tool 16x in parallel)
   - Too aggressive with parallel tool calls

3. **OpenAI GPT-5-mini** ✅ (Current)
   - Much better tool calling than 4o-mini
   - Affordable ($0.25/$2 per 1M tokens)
   - Good balance of speed/quality

### **Recommended Models:**
- **Development:** GPT-5-mini (current)
- **Production:** Claude Sonnet 3.5 via Vertex AI (company discounts)

---

## 🏗️ ARCHITECTURE DECISIONS

### **Why Single MCP Server Instead of Multiple?**
- Keeping all 215 GHL tools in ONE MCP server initially
- Later: Split into specialized agents (Contact Agent, Marketing Agent, Sales Agent, etc.)
- Each specialized agent would connect to relevant tool subset

### **Why Streamable HTTP Over SSE?**
- SSE = deprecated, complex, requires permanent connections
- Streamable HTTP = modern, stateless, production-ready, better error handling

### **Why Commenting Out Other Tools?**
- Test pattern with ContactTools first
- Prove end-to-end integration works
- Then convert remaining tools incrementally (3-5 at a time)

---

## 📊 CURRENT STATUS SUMMARY

| Component | Status | Notes |
|-----------|--------|-------|
| Echo MCP Server | ✅ Working | POC complete |
| http-server.ts refactor | ✅ Complete | Using new SDK pattern |
| ContactTools (31 tools) | ✅ Working | Zod schemas, fully tested |
| ADK Agent Connection | ✅ Working | Streamable HTTP successful |
| Error Handling | ✅ Added | Prevents chain breakage |
| Timeout Protection | ✅ Added | 30s limit per tool |
| Other 16 Tool Files | ⏳ Pending | Need Zod conversion |
| Model Selection | ✅ Decided | GPT-5-mini for now, Vertex later |

---

## 🎯 NEXT STEPS (PRIORITY ORDER)

### **Immediate (Next Session):**
1. **Test current error handling + timeout code** with GPT-5-mini
2. **Verify ContactTools stability** under various scenarios
3. **Convert next batch of simple tools:**
   - email-tools.ts (5 tools)
   - email-isv-tools.ts (1 tool)
   - media-tools.ts (3 tools)

### **Short Term:**
4. **Convert medium complexity tools:**
   - blog-tools.ts (7 tools)
   - opportunity-tools.ts (10 tools)
5. **Test multi-tool workflows** to ensure stability

### **Medium Term:**
6. **Convert remaining 167 tools** in batches of 10-20
7. **Uncomment tool registrations** in http-server.ts as they're converted
8. **Switch to Claude Sonnet 3.5 via Vertex** for production

### **Long Term:**
9. **Create specialized agents** (Contact Agent, Marketing Agent, etc.)
10. **Deploy to production**
11. **Create GitHub repo** with full documentation
12. **Build course content** around this architecture

---

## 🔑 ENVIRONMENT SETUP

### **Required Environment Variables:**
```bash
# GHL API (in MCP server)
GHL_API_KEY=your_ghl_api_key
GHL_LOCATION_ID=your_location_id
GHL_BASE_URL=https://services.leadconnectorhq.com

# OpenAI (in ADK agent)
OPENAI_API_KEY=your_openai_key

# Future: Vertex AI
GCP_PROJECT_ID=your_project_id
GCP_REGION=us-central1
```

### **Ports in Use:**
- **MCP Server:** 9000 (`http://localhost:9000/mcp`)
- **ADK Web UI:** 8000 (default)

---

## 💡 IMPORTANT PATTERNS TO REMEMBER

### **Tool Conversion Template:**
```typescript
{
  name: 'tool_name',
  description: 'What the tool does',
  inputSchema: {
    requiredField: z.string().describe('Description'),
    optionalField: z.string().optional().describe('Description'),
    arrayField: z.array(z.string()).optional().describe('Description')
  }
}
```

### **Testing Workflow:**
1. Convert tool file to Zod
2. Update `http-server.ts` imports
3. Uncomment tool initialization
4. Uncomment tool registration
5. Rebuild: `npm run build`
6. Restart MCP server
7. Start new ADK session
8. Test tools one by one

---

## 🚨 CRITICAL REMINDERS

1. **Always start NEW session** after errors to avoid poisoned history
2. **Don't test with multiple simultaneous tool calls** until error handling is proven
3. **Watch MCP server logs** for actual tool execution vs ADK errors
4. **Test with simple queries first** before complex multi-step workflows
5. **GPT-4o-mini is NOT production ready** - use GPT-5-mini minimum

---

## 📞 QUICK REFERENCE COMMANDS

```bash
# Build MCP Server
cd ~/nodejs-mcp/GoHighLevel-MCP
npm run build

# Start MCP Server
npm start
# OR
./start_my_server.sh

# Start ADK Agent
cd ~/python/google-adk-exp-v2
adk web

# Check MCP Server is running
curl http://localhost:9000/health
```

---

## 🎓 ARCHITECTURE DIAGRAMS REFERENCE

Tony has created visual architecture diagrams showing:
- ADK Hybrid V1: Local DB connection via proxy
- ADK Hybrid V2: Multi-agent with Cloud SQL
- Multi-Agentic Workflows: N8N integration with GHL MCP
- Current focus: Single agent → MCP server → GHL API

---

**END OF CONTEXT**

---