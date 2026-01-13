#!/usr/bin/env node

/**
 * STDIO MCP Server for Claude Desktop
 *
 * This server provides the same GHL Contact Management tools as http-server.ts,
 * but uses STDIO transport for direct Claude Desktop integration.
 *
 * Usage: Configure in Claude Desktop's MCP settings
 *
 * IMPORTANT: No console logging allowed - STDIO uses stdin/stdout for JSON-RPC
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as dotenv from "dotenv";

import { GHLApiClient } from "./clients/ghl-api-client.js";
import { ContactTools } from "./tools/contact-tools.js";
import { ConversationTools } from "./tools/conversation-tools.js";
import { BlogTools } from "./tools/blog-tools.js";
import { OpportunityTools } from "./tools/opportunity-tools.js";
import { CalendarTools } from "./tools/calendar-tools.js";
import { registerUtilityTools } from "./tools/utility-tools.js";
import { GHLConfig } from "./types/ghl-types.js";

// Load environment variables
dotenv.config();

// Default credentials (fallback if env vars not provided)
const GHL_API_KEY =
  process.env.GHL_API_KEY || "pit-378c1da7-4453-45eb-a3be-ad48369536f4";
const GHL_LOCATION_ID =
  process.env.GHL_LOCATION_ID || "4rKuULHASyQ99nwdL1XH";
const GHL_BASE_URL =
  process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com";

/**
 * Initialize GHL API client
 */
function initializeGHLClient(): GHLApiClient {
  const config: GHLConfig = {
    accessToken: GHL_API_KEY,
    baseUrl: GHL_BASE_URL,
    version: "2021-07-28",
    locationId: GHL_LOCATION_ID,
  };

  return new GHLApiClient(config);
}

/**
 * Register Contact Tools
 */
function registerContactTools(
  server: McpServer,
  contactTools: ContactTools
): void {
  const toolDefinitions = contactTools.getToolDefinitions();

  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (params: any) => {
        const startTime = Date.now();

        try {
          // Add 30-second timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Tool execution timeout after 30s")),
              30000
            );
          });

          const executionPromise = contactTools.executeTool(tool.name, params);

          const result = await Promise.race([executionPromise, timeoutPromise]);

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
}

/**
 * Register Conversation Tools
 */
function registerConversationTools(
  server: McpServer,
  conversationTools: ConversationTools
): void {
  const toolDefinitions = conversationTools.getToolDefinitions();

  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (params: any) => {
        const startTime = Date.now();

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Tool execution timeout after 30s")),
              30000
            );
          });

          const executionPromise = conversationTools.executeTool(tool.name, params);

          const result = await Promise.race([executionPromise, timeoutPromise]);

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
}

/**
 * Register Blog Tools
 */
function registerBlogTools(
  server: McpServer,
  blogTools: BlogTools
): void {
  const toolDefinitions = blogTools.getToolDefinitions();

  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (params: any) => {
        const startTime = Date.now();

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Tool execution timeout after 30s")),
              30000
            );
          });

          const executionPromise = blogTools.executeTool(tool.name, params);

          const result = await Promise.race([executionPromise, timeoutPromise]);

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
}

/**
 * Register Opportunity Tools
 */
function registerOpportunityTools(
  server: McpServer,
  opportunityTools: OpportunityTools
): void {
  const toolDefinitions = opportunityTools.getToolDefinitions();

  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (params: any) => {
        const startTime = Date.now();

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Tool execution timeout after 30s")),
              30000
            );
          });

          const executionPromise = opportunityTools.executeTool(tool.name, params);

          const result = await Promise.race([executionPromise, timeoutPromise]);

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
}

/**
 * Register Calendar Tools
 */
function registerCalendarTools(
  server: McpServer,
  calendarTools: CalendarTools
): void {
  const toolDefinitions = calendarTools.getToolDefinitions();

  for (const tool of toolDefinitions) {
    server.tool(
      tool.name,
      tool.description,
      tool.inputSchema,
      async (params: any) => {
        const startTime = Date.now();

        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(
              () => reject(new Error("Tool execution timeout after 30s")),
              30000
            );
          });

          const executionPromise = calendarTools.executeTool(tool.name, params);

          const result = await Promise.race([executionPromise, timeoutPromise]);

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
}

/**
 * Main entry point
 */
async function main() {
  try {
    // Initialize GHL API client
    const ghlClient = initializeGHLClient();

    // Initialize MCP Server
    const server = new McpServer({
      name: "ghl-mcp-server",
      version: "1.0.0",
    });

    // Initialize all tools
    const contactTools = new ContactTools(ghlClient);
    const conversationTools = new ConversationTools(ghlClient);
    const blogTools = new BlogTools(ghlClient);
    const opportunityTools = new OpportunityTools(ghlClient);
    const calendarTools = new CalendarTools(ghlClient);

    // Register all tools
    registerContactTools(server, contactTools);
    registerConversationTools(server, conversationTools);
    registerBlogTools(server, blogTools);
    registerOpportunityTools(server, opportunityTools);
    registerCalendarTools(server, calendarTools);
    registerUtilityTools(server);

    // Start STDIO transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    // Server is now running silently
  } catch (error) {
    process.exit(1);
  }
}

// Start the server
main().catch(() => {
  process.exit(1);
});
