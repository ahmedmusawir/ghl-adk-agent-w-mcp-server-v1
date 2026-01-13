# ADK to GHL MCP v2 - Lab Session Report

**Lab ID:** ADK GHL MCP v2  
**Date:** October 13-14, 2025  
**Developer:** Tony Stark (Moose)  
**AI Partner:** Claude Sonnet 4.5  
**Status:** Active Development → Moving to v3

---

## 🎯 PROJECT OVERVIEW

**Mission:** Build a production-grade GoHighLevel MCP server ecosystem that integrates with Google ADK agents and Claude Desktop.

**Architecture:** Multi-specialist MCP servers (Contact, Social Media, Messaging, Payment, etc.) connecting to GHL API, accessible via both HTTP (for ADK agents) and STDIO (for Claude Desktop).

---

## ✅ WHAT WE ACCOMPLISHED IN v2

### 1. **GHL MCP HTTP Server Refactor (COMPLETED)**

**Previous State:**
- Broken SSE-based MCP server (deprecated protocol)
- 215 tools across 17 categories using old JSON schemas
- No modern SDK integration

**Current State:**
- ✅ Converted to modern MCP SDK (`McpServer` + `StreamableHTTPServerTransport`)
- ✅ Refactored ContactTools (31 tools) from JSON schemas to Zod schemas
- ✅ Built `/mcp` POST endpoint for Streamable HTTP protocol
- ✅ Removed SSE transport completely
- ✅ Successfully tested ContactTools with ADK agent
- ✅ Added error handling + timeout protection (30s per tool, 45s per request)

**Repository:** `~/nodejs-mcp/GoHighLevel-MCP/`

**Key Files:**
- `src/http-server.ts` - Main HTTP server with new pattern
- `src/tools/contact-tools.ts` - Fully refactored (31 tools working)
- 16 other tool files (167 tools) - Still need Zod conversion

---

### 2. **ADK Agent Integration (WORKING)**

**Stack:**
- **ADK Agent:** Python-based using Google ADK
- **Model:** Testing with GPT-5-mini (OpenAI direct)
- **LiteLLM:** Wrapper for model flexibility
- **MCP Connection:** StreamableHTTPConnectionParams → `http://localhost:9000/mcp`

**Agent Location:** `~/python/google-adk-exp-v2/ghl_mcp_agent/`

**Key Learnings:**
- ✅ ADK + MCP integration works perfectly via Streamable HTTP
- ✅ OpenAI direct models work best (GPT-5-mini, GPT-4o)
- ❌ OpenRouter proxy breaks MCP tool integration (all models fail via proxy)
- ❌ Qwen Plus via OpenRouter: Context overflow issues
- ❌ Gemini 2.0 Flash via OpenRouter: Doesn't call tools at all
- ✅ Sequential tool execution prevents session poisoning

**Working Agent Prompt Pattern:**
- Forces sequential tool execution (no parallel calls)
- Confirms before destructive operations
- Reports progress on multi-step operations
- Handles errors gracefully without retrying automatically

---

### 3. **Model Testing Insights**

| Model | Via | Result | Notes |
|-------|-----|--------|-------|
| GPT-5-mini | OpenAI Direct | ✅ Working | Best balance: cheap, good tool calling |
| GPT-4o-mini | OpenAI Direct | ⚠️ Poor | Hallucinated tools, too aggressive with parallel calls |
| Claude Sonnet 3.5 | OpenRouter | ❌ Failed | "Provider returned error" - proxy issue |
| Qwen Plus | OpenRouter | ❌ Failed | Context overflow (despite 1M window) |
| Gemini 2.0 Flash | OpenRouter | ❌ Failed | Doesn't call tools - proxy issue |

**Conclusion:** Avoid OpenRouter for MCP tool-heavy agents. Use direct API access only.

**Production Recommendation:**
- Development: GPT-5-mini (OpenAI direct)
- Production: Gemini 2.0 Flash (Google direct) or Claude Sonnet 3.5 (Vertex AI)

---

### 4. **Critical Bug Fixes**

**Issue 1: Multiple Simultaneous Tool Calls Breaking Response Chain**
- **Problem:** Agent called 4+ tools in parallel → some responses missing → session poisoned
- **Solution:** Added error handling that returns errors as responses (not throws)
- **Result:** Partial success, but still needs sequential execution enforcement

**Issue 2: Tool Execution Timeouts**
- **Problem:** GHL API calls hanging, causing ASGI timeout errors
- **Solution:** 30s timeout per tool, 45s timeout at transport level
- **Result:** No more infinite hangs

**Issue 3: Session Poisoning**
- **Problem:** Once bad response in history, all subsequent messages fail
- **Workaround:** Start new session (not ideal)
- **Real Solution:** Force sequential tool execution via agent prompt

---

### 5. **Vertex AI Authentication Setup (BREAKTHROUGH)**

**The Problem We Solved:**
- Confusion about environment variables vs. `.env` files
- Unclear documentation from Google
- Multiple failed attempts with `genai.Client()` configuration

**The Solution (ULTRA SIMPLE):**

**For macOS/Linux:**
```bash
# In ~/.zshrc or ~/.bash_profile
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/cyberize-vertex-api.json"
export GOOGLE_CLOUD_PROJECT="ninth-potion-455712-g9"
export GOOGLE_CLOUD_LOCATION="us-east1"
```

**Agent Code (MINIMAL):**
```python
from google.adk.agents import Agent
from google.adk.tools import google_search

root_agent = Agent(
    name="jarvis_agent",
    model="gemini-2.5-flash",
    instruction="...",
    tools=[google_search],
)
```

**Key Discovery:**
- ✅ No `genai.Client()` call needed
- ✅ No `dotenv` needed
- ✅ ADK automatically detects Vertex AI from environment variables
- ✅ The JSON file path is ALL that matters for authentication

**Documented:** Created comprehensive setup guide with both bash_profile and .env options.

---

### 6. **Architecture Planning for Multi-Specialist System**

**Current Understanding:**

**HTTP MCP Architecture (for ADK):**
```
Single Express Server (Port 9000)
├── POST /contact-mcp    → Contact McpServer  (31 tools)
├── POST /social-mcp     → Social McpServer   (15 tools)
├── POST /messaging-mcp  → Messaging McpServer (5 tools)
└── POST /payment-mcp    → Payment McpServer  (24 tools)
```

**Each ADK specialist agent connects to its own endpoint:**
```python
contact_agent = Agent(
    tools=[MCPToolset(url="http://localhost:9000/contact-mcp")]
)

social_agent = Agent(
    tools=[MCPToolset(url="http://localhost:9000/social-mcp")]
)
```

**Decision Made:** Will use SEPARATE repos for each specialist (not single repo with multiple endpoints) for production-grade architecture.

---

## 🚀 PLANS FOR v3 (NEXT LAB)

### Primary Goal: STDIO MCP Servers for Claude Desktop

**Why STDIO?**
- Simpler than HTTP (no server management)
- Native Claude Desktop integration
- Perfect for personal productivity workflows
- Each specialist runs as separate process

**Target Architecture:**
```
Claude Desktop App
├── STDIO → Contact MCP Server (31 tools)
├── STDIO → Social MCP Server (15 tools)
├── STDIO → Messaging MCP Server (5 tools)
└── STDIO → Payment MCP Server (24 tools)
                    ↓
                GHL API
```

---

### Phase 1: Build Contact STDIO MCP (Day 1)

**Tasks:**
1. Create new repo: `~/nodejs-mcp/ghl-contact-mcp/`
2. Copy ContactTools from HTTP version
3. Replace `StreamableHTTPServerTransport` with `StdioServerTransport`
4. Remove all Express/HTTP code
5. Create `src/index.ts` as STDIO entry point
6. Build and test with Claude Desktop

**Expected Output:**
```bash
npm run build
# Produces: build/index.js
```

**Claude Desktop Config:**
```json
{
  "mcpServers": {
    "ghl-contacts": {
      "command": "node",
      "args": ["/Users/ahmedmusawir/nodejs-mcp/ghl-contact-mcp/build/index.js"],
      "env": {
        "GHL_API_KEY": "...",
        "GHL_LOCATION_ID": "..."
      }
    }
  }
}
```

---

### Phase 2: Build Social & Messaging STDIO MCPs (Day 2-3)

**Tasks:**
1. Convert `social-tools.ts` to Zod schemas
2. Create `ghl-social-mcp` repo with STDIO pattern
3. Convert `messaging-tools.ts` to Zod schemas
4. Create `ghl-messaging-mcp` repo with STDIO pattern
5. Test all 3 MCPs in Claude Desktop simultaneously

**Validation:**
- All tools appear in Claude Desktop tool picker
- Tools execute successfully
- Multiple MCPs work together without conflicts

---

### Phase 3: Leverage Windsurf + Cascade (Day 4-5)

**Strategy:**
- Tony + Claude plan conversions in detail
- Claude writes killer prompts for Cascade
- Cascade executes conversions (filesystem access!)
- Safe branching strategy (no risk to main code)

**Prompts for Cascade:**
```
1. Convert messaging-tools.ts from JSON schemas to Zod
2. Create STDIO MCP server for messaging using contact MCP as template
3. Build standalone executable using pkg for macOS
```

**Benefits of Windsurf:**
- Cascade uses Claude Sonnet 4.5 (same as this session)
- Full filesystem access
- Iterative refinement until perfect
- Limited-time promo (must use now!)

---

### Phase 4: Consumer-Ready Packaging (Week 2)

**Goal:** Make MCPs installable for Coach and other non-technical users.

**Method 1: Standalone Executables**
```bash
# Using pkg
pkg package.json --targets node18-macos-arm64 --output ghl-contact-mcp
```

**Result:** Single executable, no Node.js required.

**Method 2: Installer Script**
```bash
#!/bin/bash
# install-ghl-mcps.sh
# - Asks for GHL credentials
# - Copies executables to /Applications/GHL-MCPs/
# - Updates Claude Desktop config automatically
# - User just runs: ./install-ghl-mcps.sh
```

**Method 3: GUI Installer (Future)**
- Electron-based
- Input validation
- Auto-updates
- Professional UX

---

### Phase 5: HTTP MCP Completion (Parallel Track)

**Continue converting remaining tools:**
- Blog Tools (7 tools)
- Opportunity Tools (10 tools)
- Calendar Tools (14 tools)
- Email Tools (5 tools)
- Location Tools (21 tools)
- ... 11 more categories (167 tools total)

**Pattern:**
- Convert 5-10 tools at a time
- Test with ADK agent after each batch
- Document issues
- Fix before moving to next batch

---

## 🎓 KEY LEARNINGS FROM v2

### Technical Insights

1. **MCP Protocol Evolution:**
   - SSE (deprecated) → Streamable HTTP (modern, stateless)
   - Old SDK patterns → New `McpServer` class
   - JSON schemas → Zod schemas (type-safe, cleaner)

2. **OpenRouter Incompatibility:**
   - Proxy layer breaks MCP tool schemas
   - Direct API access is mandatory for MCP agents
   - This applies to ALL models (Claude, Gemini, Qwen)

3. **Context Management:**
   - Tool-heavy agents need large context windows
   - Verbose JSON responses consume tokens fast
   - Parallel tool calls = context explosion

4. **Error Handling Patterns:**
   - Return errors as responses (don't throw)
   - Timeout at multiple levels (tool, transport, request)
   - Session poisoning requires prevention, not recovery

5. **Vertex AI Authentication:**
   - Environment variables > explicit configuration
   - ADK auto-detects Vertex AI (no code needed)
   - Absolute paths for JSON credentials (always!)

### Process Insights

1. **Debugging Methodology:**
   - Print actual values (don't assume)
   - Compare working vs. broken systems side-by-side
   - Test minimal cases before complex scenarios

2. **Documentation Value:**
   - Living docs prevent re-solving same problems
   - Step-by-step guides with copy-paste snippets
   - Architecture diagrams clarify system design

3. **AI Collaboration:**
   - Ask clarifying questions before suggesting solutions
   - Admit uncertainty and debug together
   - Peer-to-peer > expert-to-novice dynamic

---

## 📊 CURRENT STATUS SUMMARY

| Component | Status | Tools Count | Notes |
|-----------|--------|-------------|-------|
| Contact MCP (HTTP) | ✅ Working | 31/31 | Zod schemas, fully tested |
| Social MCP (HTTP) | ⏳ Pending | 0/15 | Need Zod conversion |
| Messaging MCP (HTTP) | ⏳ Pending | 0/5 | Need Zod conversion |
| Payment MCP (HTTP) | ⏳ Pending | 0/24 | Need Zod conversion |
| 13 Other Categories | ⏳ Pending | 0/167 | Need Zod conversion |
| ADK Agent Integration | ✅ Working | - | HTTP transport stable |
| Vertex AI Auth | ✅ Solved | - | Documented |
| STDIO MCP Servers | 🎯 Next | - | Starting in v3 |

**Total Progress:** 31/215 tools converted (14%)

---

## 🛠️ DEVELOPMENT ENVIRONMENT

### Local Setup
- **OS:** macOS (M1/M2)
- **IDE:** VS Code
- **Node.js:** v18+
- **Python:** 3.12
- **MCP Server:** Port 9000
- **ADK Web UI:** Port 8000

### Key Directories
```
~/nodejs-mcp/GoHighLevel-MCP/        # HTTP MCP (current)
~/python/google-adk-exp-v2/          # ADK agents
~/nodejs-mcp/ghl-contact-mcp/        # STDIO MCP (to be created)
~/nodejs-mcp/ghl-social-mcp/         # STDIO MCP (to be created)
~/nodejs-mcp/ghl-messaging-mcp/      # STDIO MCP (to be created)
```

### Environment Variables (Vertex AI)
```bash
# In ~/.zshrc
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/gcloud/cyberize-vertex-api.json"
export GOOGLE_CLOUD_PROJECT="ninth-potion-455712-g9"
export GOOGLE_CLOUD_LOCATION="us-east1"
```

---

## 🎯 SUCCESS METRICS FOR v3

### Must-Have (MVP)
- [ ] Contact STDIO MCP working in Claude Desktop
- [ ] Social STDIO MCP working in Claude Desktop
- [ ] Messaging STDIO MCP working in Claude Desktop
- [ ] All 3 MCPs running simultaneously without conflicts
- [ ] Tools execute successfully with real GHL API

### Nice-to-Have
- [ ] Standalone executables (no Node.js dependency)
- [ ] Installer script for easy setup
- [ ] Documentation for end users
- [ ] Tested by Coach (non-technical user)

### Stretch Goals
- [ ] All 17 tool categories converted to STDIO
- [ ] GUI installer
- [ ] Auto-update mechanism
- [ ] Published to npm/Homebrew

---

## 🚨 CRITICAL REMINDERS FOR v3

1. **Separate Repos from Day 1**
   - Each specialist = own repo
   - Independent versioning
   - Clean separation of concerns

2. **Test with Claude Desktop Immediately**
   - Don't build all tools before testing
   - Validate pattern with Contact MCP first
   - Iterate based on real usage

3. **Use Windsurf + Cascade Strategically**
   - Plan with Claude first
   - Write detailed prompts
   - Safe branching (experiment freely)

4. **Keep HTTP and STDIO in Sync**
   - Tools should work in both transports
   - Share core code (API client, types)
   - Test both regularly

5. **Document as We Build**
   - Update README for each MCP
   - Architecture diagrams
   - Setup guides for users

---

## 📚 RESOURCES & REFERENCES

### Documentation Created
- ✅ Vertex AI Authentication Setup Guide
- ✅ ADK Agent Prompt Patterns
- ✅ MCP HTTP vs STDIO Comparison
- ⏳ STDIO MCP Setup Guide (to be created in v3)

### External Resources
- MCP SDK Docs: https://github.com/modelcontextprotocol/sdk
- ADK Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/agent-development-kit
- GHL API: https://services.leadconnectorhq.com
- Original GHL MCP Repo: https://github.com/mastanley13/GoHighLevel-MCP

---

## 🎬 NEXT SESSION KICKOFF (v3)

**When:** Tomorrow morning  
**Focus:** Build Contact STDIO MCP  
**Goal:** Working prototype in Claude Desktop  

**Pre-work:**
1. Download Claude Desktop (if not installed)
2. Create new repo: `ghl-contact-mcp`
3. Set up basic TypeScript + MCP SDK structure

**Session 1 Tasks:**
1. Copy ContactTools from HTTP version
2. Create STDIO entry point
3. Build and test
4. Configure Claude Desktop
5. Execute first tool call

**Celebration Criteria:**
- Claude Desktop shows "ghl-contacts" in tool picker
- Successfully executes `search_contacts` tool
- Returns real data from GHL API

---

## 💭 REFLECTIONS

### What Went Well
- ✅ Successfully refactored ContactTools to modern MCP pattern
- ✅ Proved ADK + MCP integration works perfectly
- ✅ Solved Vertex AI authentication mystery
- ✅ Documented everything for future reference
- ✅ Honest peer-to-peer collaboration (no BS)

### What We Learned
- OpenRouter is incompatible with MCP tools (critical discovery)
- Simple problems need simple solutions (environment variables)
- Documentation beats assumptions every time
- Windsurf + Cascade = game-changer for execution

### What's Next
- STDIO MCP architecture (simpler, more powerful)
- Consumer-ready packaging (for Coach and team)
- Full tool conversion (all 215 tools)
- Production deployment strategy

---

**END OF LAB REPORT**

**Status:** Ready to proceed to v3  
**Confidence Level:** HIGH 🔥  
**Team Morale:** PUMPED 💪  

**Let's build the Arc Reactor V3 tomorrow!** 🚀

---
