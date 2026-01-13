/**
 * GoHighLevel MCP HTTP Server
 * HTTP version with Streamable HTTP transport
 */

import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import * as dotenv from "dotenv";

import { GHLApiClient } from "./clients/ghl-api-client";
import { ContactTools } from "./tools/contact-tools";
import { ConversationTools } from "./tools/conversation-tools";
import { BlogTools } from "./tools/blog-tools";
import { OpportunityTools } from "./tools/opportunity-tools";
import { CalendarTools } from "./tools/calendar-tools";
import { registerUtilityTools } from "./tools/utility-tools";
import { GHLConfig } from "./types/ghl-types";

// Load environment variables
dotenv.config();

/**
 * HTTP MCP Server class for web deployment
 */
class GHLMCPHttpServer {
  private app: express.Application;
  private mcpServer: McpServer;
  private ghlClient: GHLApiClient;
  private contactTools: ContactTools;
  private conversationTools: ConversationTools;
  private blogTools: BlogTools;
  private opportunityTools: OpportunityTools;
  private calendarTools: CalendarTools;
  private port: number;

  constructor() {
    this.port = parseInt(
      process.env.PORT || process.env.MCP_SERVER_PORT || "9000"
    );

    // Initialize Express app
    this.app = express();
    this.setupExpress();

    // Initialize MCP server with new McpServer class
    this.mcpServer = new McpServer({
      name: "ghl-mcp-server",
      version: "1.0.0",
    });

    // Initialize GHL API client
    this.ghlClient = this.initializeGHLClient();

    // Initialize tools
    this.contactTools = new ContactTools(this.ghlClient);
    this.conversationTools = new ConversationTools(this.ghlClient);
    this.blogTools = new BlogTools(this.ghlClient);
    this.opportunityTools = new OpportunityTools(this.ghlClient);
    this.calendarTools = new CalendarTools(this.ghlClient);

    // Setup MCP handlers
    this.registerTools();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware and configuration
   */
  private setupExpress(): void {
    // Enable CORS for web integration
    this.app.use(
      cors({
        origin: [
          "https://chatgpt.com",
          "https://chat.openai.com",
          "http://localhost:*",
        ],
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Accept"],
        credentials: true,
      })
    );

    // Parse JSON requests
    this.app.use(express.json());

    // Request logging
    this.app.use((req, res, next) => {
      console.log(
        `[HTTP] ${req.method} ${req.path} - ${new Date().toISOString()}`
      );
      next();
    });
  }

  /**
   * Initialize GoHighLevel API client with configuration
   */
  private initializeGHLClient(): GHLApiClient {
    // Load configuration from environment
    const config: GHLConfig = {
      accessToken: process.env.GHL_API_KEY || "",
      baseUrl:
        process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com",
      version: "2021-07-28",
      locationId: process.env.GHL_LOCATION_ID || "",
    };

    // Validate required configuration
    if (!config.accessToken) {
      throw new Error("GHL_API_KEY environment variable is required");
    }

    if (!config.locationId) {
      throw new Error("GHL_LOCATION_ID environment variable is required");
    }

    console.log("[GHL MCP HTTP] Initializing GHL API client...");
    console.log(`[GHL MCP HTTP] Base URL: ${config.baseUrl}`);
    console.log(`[GHL MCP HTTP] Version: ${config.version}`);
    console.log(`[GHL MCP HTTP] Location ID: ${config.locationId}`);

    return new GHLApiClient(config);
  }

  /**
   * Register MCP tools with the new McpServer
   */

  private registerTools(): void {
    console.log("[GHL MCP HTTP] Registering tools...");

    // Register utility tools first (domain-agnostic)
    registerUtilityTools(this.mcpServer);

    // Register contact tools
    const contactToolDefinitions = this.contactTools.getToolDefinitions();

    for (const tool of contactToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          console.log(
            `[GHL MCP HTTP] Executing tool: ${tool.name} with params:`,
            params
          );
          const startTime = Date.now();

          try {
            // Add 30-second timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Tool execution timeout after 30s")),
                30000
              );
            });

            const executionPromise = this.contactTools.executeTool(
              tool.name,
              params
            );

            const result = await Promise.race([
              executionPromise,
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            console.log(
              `[GHL MCP HTTP] Tool ${tool.name} succeeded in ${duration}ms`
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result),
                },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `[GHL MCP HTTP] Tool ${tool.name} failed after ${duration}ms:`,
              error
            );

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Return error response instead of throwing
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              structuredContent: {
                error: errorMessage,
                tool: tool.name,
                params: params,
                duration: duration,
              },
              isError: true,
            };
          }
        }
      );
    }

    // Register conversation tools
    const conversationToolDefinitions = this.conversationTools.getToolDefinitions();

    for (const tool of conversationToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          console.log(
            `[GHL MCP HTTP] Executing tool: ${tool.name} with params:`,
            params
          );
          const startTime = Date.now();

          try {
            // Add 30-second timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Tool execution timeout after 30s")),
                30000
              );
            });

            const executionPromise = this.conversationTools.executeTool(
              tool.name,
              params
            );

            const result = await Promise.race([
              executionPromise,
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            console.log(
              `[GHL MCP HTTP] Tool ${tool.name} succeeded in ${duration}ms`
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result),
                },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `[GHL MCP HTTP] Tool ${tool.name} failed after ${duration}ms:`,
              error
            );

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            // Return error response instead of throwing
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              structuredContent: {
                error: errorMessage,
                tool: tool.name,
                params: params,
                duration: duration,
              },
              isError: true,
            };
          }
        }
      );
    }

    // Register blog tools
    const blogToolDefinitions = this.blogTools.getToolDefinitions();

    for (const tool of blogToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          console.log(
            `[GHL MCP HTTP] Executing tool: ${tool.name} with params:`,
            params
          );
          const startTime = Date.now();

          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Tool execution timeout after 30s")),
                30000
              );
            });

            const executionPromise = this.blogTools.executeTool(
              tool.name,
              params
            );

            const result = await Promise.race([
              executionPromise,
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            console.log(
              `[GHL MCP HTTP] Tool ${tool.name} succeeded in ${duration}ms`
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result),
                },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `[GHL MCP HTTP] Tool ${tool.name} failed after ${duration}ms:`,
              error
            );

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              structuredContent: {
                error: errorMessage,
                tool: tool.name,
                params: params,
                duration: duration,
              },
              isError: true,
            };
          }
        }
      );
    }

    // Register opportunity tools
    const opportunityToolDefinitions = this.opportunityTools.getToolDefinitions();

    for (const tool of opportunityToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          console.log(
            `[GHL MCP HTTP] Executing tool: ${tool.name} with params:`,
            params
          );
          const startTime = Date.now();

          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Tool execution timeout after 30s")),
                30000
              );
            });

            const executionPromise = this.opportunityTools.executeTool(
              tool.name,
              params
            );

            const result = await Promise.race([
              executionPromise,
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            console.log(
              `[GHL MCP HTTP] Tool ${tool.name} succeeded in ${duration}ms`
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result),
                },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `[GHL MCP HTTP] Tool ${tool.name} failed after ${duration}ms:`,
              error
            );

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              structuredContent: {
                error: errorMessage,
                tool: tool.name,
                params: params,
                duration: duration,
              },
              isError: true,
            };
          }
        }
      );
    }

    // Register calendar tools
    const calendarToolDefinitions = this.calendarTools.getToolDefinitions();

    for (const tool of calendarToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        {
          description: tool.description,
          inputSchema: tool.inputSchema,
        },
        async (params: any) => {
          console.log(
            `[GHL MCP HTTP] Executing tool: ${tool.name} with params:`,
            params
          );
          const startTime = Date.now();

          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Tool execution timeout after 30s")),
                30000
              );
            });

            const executionPromise = this.calendarTools.executeTool(
              tool.name,
              params
            );

            const result = await Promise.race([
              executionPromise,
              timeoutPromise,
            ]);

            const duration = Date.now() - startTime;
            console.log(
              `[GHL MCP HTTP] Tool ${tool.name} succeeded in ${duration}ms`
            );

            return {
              content: [
                {
                  type: "text" as const,
                  text: JSON.stringify(result),
                },
              ],
              structuredContent: result,
            };
          } catch (error) {
            const duration = Date.now() - startTime;
            console.error(
              `[GHL MCP HTTP] Tool ${tool.name} failed after ${duration}ms:`,
              error
            );

            const errorMessage =
              error instanceof Error ? error.message : String(error);

            return {
              content: [
                {
                  type: "text" as const,
                  text: `Error: ${errorMessage}`,
                },
              ],
              structuredContent: {
                error: errorMessage,
                tool: tool.name,
                params: params,
                duration: duration,
              },
              isError: true,
            };
          }
        }
      );
    }

    console.log(
      `[GHL MCP HTTP] Registered ${contactToolDefinitions.length} contact tools + ${conversationToolDefinitions.length} conversation tools + ${blogToolDefinitions.length} blog tools + ${opportunityToolDefinitions.length} opportunity tools + ${calendarToolDefinitions.length} calendar tools + 2 utility tools`
    );
  }

  /**
   * Setup HTTP routes
   */
  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "healthy",
        server: "ghl-mcp-server",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        tools: {
          contact: this.contactTools.getToolDefinitions().length,
          conversation: this.conversationTools.getToolDefinitions().length,
          blog: this.blogTools.getToolDefinitions().length,
          opportunity: this.opportunityTools.getToolDefinitions().length,
          calendar: this.calendarTools.getToolDefinitions().length,
          utility: 2,
          total: 
            this.contactTools.getToolDefinitions().length + 
            this.conversationTools.getToolDefinitions().length + 
            this.blogTools.getToolDefinitions().length +
            this.opportunityTools.getToolDefinitions().length +
            this.calendarTools.getToolDefinitions().length +
            2,
        },
      });
    });

    // MCP capabilities endpoint
    this.app.get("/capabilities", (req, res) => {
      res.json({
        capabilities: {
          tools: {},
        },
        server: {
          name: "ghl-mcp-server",
          version: "1.0.0",
        },
      });
    });

    // Tools listing endpoint
    this.app.get("/tools", async (req, res) => {
      try {
        const contactTools = this.contactTools.getToolDefinitions();
        const conversationTools = this.conversationTools.getToolDefinitions();
        const allTools = [...contactTools, ...conversationTools];

        res.json({
          tools: allTools,
          count: allTools.length,
          categories: {
            contact: contactTools.length,
            conversation: conversationTools.length,
          },
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to list tools" });
      }
    });

    // STREAMABLE HTTP ENDPOINT
    this.app.post("/mcp", async (req, res) => {
      console.log(`[GHL MCP HTTP] New MCP request from: ${req.ip}`);
      console.log(
        `[GHL MCP HTTP] Request body:`,
        JSON.stringify(req.body, null, 2)
      );

      // Set timeout at Express level - 45 seconds
      req.setTimeout(45000);
      res.setTimeout(45000);

      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        res.on("close", () => {
          transport.close();
        });

        // Add timeout to the entire MCP operation
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("MCP request timeout after 45s")),
            45000
          );
        });

        const mcpPromise = (async () => {
          await this.mcpServer.connect(transport);
          await transport.handleRequest(req, res, req.body);
        })();

        await Promise.race([mcpPromise, timeoutPromise]);
      } catch (error) {
        console.error(`[GHL MCP HTTP] MCP request error:`, error);

        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message:
                error instanceof Error
                  ? error.message
                  : "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    // Root endpoint with server info
    this.app.get("/", (req, res) => {
      res.json({
        name: "GoHighLevel MCP Server",
        version: "1.0.0",
        status: "running",
        endpoints: {
          health: "/health",
          capabilities: "/capabilities",
          tools: "/tools",
          mcp: "/mcp",
        },
        tools: {
          contact: this.contactTools.getToolDefinitions().length,
          conversation: this.conversationTools.getToolDefinitions().length,
          utility: 2,
          total: this.contactTools.getToolDefinitions().length + this.conversationTools.getToolDefinitions().length + 2,
        },
        documentation: "https://github.com/your-repo/ghl-mcp-server",
      });
    });
  }

  /**
   * Test GHL API connection
   */
  private async testGHLConnection(): Promise<void> {
    try {
      console.log("[GHL MCP HTTP] Testing GHL API connection...");

      const result = await this.ghlClient.testConnection();

      console.log("[GHL MCP HTTP] ✅ GHL API connection successful");
      console.log(
        `[GHL MCP HTTP] Connected to location: ${result.data?.locationId}`
      );
    } catch (error) {
      console.error("[GHL MCP HTTP] ❌ GHL API connection failed:", error);
      throw new Error(`Failed to connect to GHL API: ${error}`);
    }
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    console.log("🚀 Starting GoHighLevel MCP HTTP Server...");
    console.log("=========================================");

    try {
      // Test GHL API connection
      await this.testGHLConnection();

      // Start HTTP server with error handling
      const server = this.app.listen(this.port, "0.0.0.0", () => {
        console.log("✅ GoHighLevel MCP HTTP Server started successfully!");
        console.log(`🌐 Server running on: http://0.0.0.0:${this.port}`);
        console.log(`🔗 MCP Endpoint: http://0.0.0.0:${this.port}/mcp`);
        console.log(
          `📋 Tools Available: ${
            this.contactTools.getToolDefinitions().length + 
            this.conversationTools.getToolDefinitions().length + 
            this.blogTools.getToolDefinitions().length +
            this.opportunityTools.getToolDefinitions().length +
            this.calendarTools.getToolDefinitions().length +
            2
          } (32 Contact + 21 Conversation + 7 Blog + 10 Opportunity + 14 Calendar + 2 Utility)`
        );
        console.log("🎯 Ready for ADK integration!");
        console.log("=========================================");
        console.log("");
        console.log("🎯 CONTACT MANAGEMENT (32 tools):");
        console.log("   BASIC: create, search, get, update, delete contacts");
        console.log("   TAGS: add/remove contact tags, bulk tag operations");
        console.log("   TASKS: get, create, update, delete contact tasks");
        console.log("   NOTES: get, create, update, delete contact notes");
        console.log(
          "   ADVANCED: upsert, duplicate check, business association"
        );
        console.log("   BULK: mass tag updates, business assignments");
        console.log("   FOLLOWERS: add/remove contact followers");
        console.log("   CAMPAIGNS: add/remove contacts to/from campaigns");
        console.log("   WORKFLOWS: add/remove contacts to/from workflows");
        console.log("   APPOINTMENTS: get contact appointments");
        console.log("");
        console.log("💬 CONVERSATION MANAGEMENT (21 tools):");
        console.log("   MESSAGING: send SMS, send email");
        console.log("   CONVERSATIONS: search, get, create, update, delete");
        console.log("   MESSAGES: get email/message details, upload attachments");
        console.log("   MANUAL: add inbound messages, add outbound calls");
        console.log("   RECORDING: get recordings, transcriptions, download");
        console.log("   SCHEDULING: cancel scheduled messages/emails");
        console.log("   LIVE CHAT: typing indicators");
        console.log("");
        console.log("📝 BLOG MANAGEMENT (7 tools):");
        console.log("   POSTS: create, update, get blog posts");
        console.log("   DISCOVERY: get blog sites, authors, categories");
        console.log("   VALIDATION: check URL slug availability");
        console.log("");
        console.log("💼 OPPORTUNITY MANAGEMENT (10 tools):");
        console.log("   SEARCH: advanced filtering by pipeline, stage, contact");
        console.log("   CRUD: create, update, delete opportunities");
        console.log("   STATUS: update opportunity status (won/lost)");
        console.log("   SMART: upsert (intelligent create/update)");
        console.log("   TEAM: add/remove followers");
        console.log("   DISCOVERY: get pipelines and stages");
        console.log("");
        console.log("📅 CALENDAR & APPOINTMENTS (14 tools):");
        console.log("   CALENDARS: get groups, get/create/update/delete calendars");
        console.log("   APPOINTMENTS: get events, check availability, book/update/cancel");
        console.log("   SCHEDULING: get free slots, create/update block slots");
        console.log("");
        console.log("🛠️  UTILITY TOOLS (2 tools):");
        console.log("   DATE/TIME: calculate future datetime for GHL API");
        console.log("   CALCULATOR: safe math calculations with functions");
        console.log("=========================================\n");
      });

      // Handle port already in use error
      server.on("error", (error: any) => {
        if (error.code === "EADDRINUSE") {
          console.error(`\n❌ ERROR: Port ${this.port} is already in use!`);
          console.error(`\n💡 Solutions:`);
          console.error(`   1. Kill the process using port ${this.port}:`);
          console.error(`      lsof -ti :${this.port} | xargs kill -9`);
          console.error(`   2. Or change the port in .env file (MCP_SERVER_PORT)`);
          console.error(`\n🔍 Check what's using the port:`);
          console.error(`   lsof -i :${this.port}\n`);
        } else {
          console.error("\n❌ Server error:", error);
        }
        process.exit(1);
      });

    } catch (error) {
      console.error("❌ Failed to start GHL MCP HTTP Server:", error);
      process.exit(1);
    }
  }
}

/**
 * Handle graceful shutdown
 */
function setupGracefulShutdown(): void {
  const shutdown = (signal: string) => {
    console.log(
      `\n[GHL MCP HTTP] Received ${signal}, shutting down gracefully...`
    );
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Setup graceful shutdown
    setupGracefulShutdown();

    // Create and start HTTP server
    const server = new GHLMCPHttpServer();
    await server.start();
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
