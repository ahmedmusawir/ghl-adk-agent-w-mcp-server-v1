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
import { LocationTools } from "./tools/location-tools.js";
import { EmailTools } from "./tools/email-tools.js";
import { EmailISVTools } from "./tools/email-isv-tools.js";
import { SocialMediaTools } from "./tools/social-media-tools.js";
import { MediaTools } from "./tools/media-tools.js";
import { ObjectTools } from "./tools/object-tools.js";
import { AssociationTools } from "./tools/association-tools.js";
import { CustomFieldV2Tools } from "./tools/custom-field-v2-tools.js";
import { WorkflowTools } from "./tools/workflow-tools.js";
import { SurveyTools } from "./tools/survey-tools.js";
import { StoreTools } from "./tools/store-tools.js";
import { ProductsTools } from "./tools/products-tools.js";
import { PaymentsTools } from "./tools/payments-tools.js";
import { InvoicesTools } from "./tools/invoices-tools.js";
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
 * Register Location Tools
 */
function registerLocationTools(
  server: McpServer,
  locationTools: LocationTools
): void {
  const toolDefinitions = locationTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await locationTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Email Tools
 */
function registerEmailTools(
  server: McpServer,
  emailTools: EmailTools
): void {
  const toolDefinitions = emailTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await emailTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Email Verification Tools
 */
function registerEmailISVTools(
  server: McpServer,
  emailISVTools: EmailISVTools
): void {
  const toolDefinitions = emailISVTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await emailISVTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Social Media Tools
 */
function registerSocialMediaTools(
  server: McpServer,
  socialMediaTools: SocialMediaTools
): void {
  const toolDefinitions = socialMediaTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await socialMediaTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Media Tools
 */
function registerMediaTools(
  server: McpServer,
  mediaTools: MediaTools
): void {
  const toolDefinitions = mediaTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await mediaTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Object Tools
 */
function registerObjectTools(
  server: McpServer,
  objectTools: ObjectTools
): void {
  const toolDefinitions = objectTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await objectTools.executeTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Association Tools
 */
function registerAssociationTools(
  server: McpServer,
  associationTools: AssociationTools
): void {
  const toolDefinitions = associationTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await associationTools.executeAssociationTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Custom Field V2 Tools
 */
function registerCustomFieldV2Tools(
  server: McpServer,
  customFieldV2Tools: CustomFieldV2Tools
): void {
  const toolDefinitions = customFieldV2Tools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await customFieldV2Tools.executeCustomFieldV2Tool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Workflow Tools
 */
function registerWorkflowTools(
  server: McpServer,
  workflowTools: WorkflowTools
): void {
  const toolDefinitions = workflowTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await workflowTools.executeWorkflowTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Survey Tools
 */
function registerSurveyTools(
  server: McpServer,
  surveyTools: SurveyTools
): void {
  const toolDefinitions = surveyTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await surveyTools.executeSurveyTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Store Tools
 */
function registerStoreTools(
  server: McpServer,
  storeTools: StoreTools
): void {
  const toolDefinitions = storeTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await storeTools.executeStoreTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Products Tools
 */
function registerProductsTools(
  server: McpServer,
  productsTools: ProductsTools
): void {
  const toolDefinitions = productsTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await productsTools.executeProductsTool(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Payments Tools
 */
function registerPaymentsTools(
  server: McpServer,
  paymentsTools: PaymentsTools
): void {
  const toolDefinitions = paymentsTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await paymentsTools.handleToolCall(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
  }
}

/**
 * Register Invoices Tools
 */
function registerInvoicesTools(
  server: McpServer,
  invoicesTools: InvoicesTools
): void {
  const toolDefinitions = invoicesTools.getToolDefinitions();
  for (const tool of toolDefinitions) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (params: any) => {
      try {
        const result = await invoicesTools.handleToolCall(tool.name, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
      }
    });
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
    const locationTools = new LocationTools(ghlClient);
    const emailTools = new EmailTools(ghlClient);
    const emailISVTools = new EmailISVTools(ghlClient);
    const socialMediaTools = new SocialMediaTools(ghlClient);
    const mediaTools = new MediaTools(ghlClient);
    const objectTools = new ObjectTools(ghlClient);
    const associationTools = new AssociationTools(ghlClient);
    const customFieldV2Tools = new CustomFieldV2Tools(ghlClient);
    const workflowTools = new WorkflowTools(ghlClient);
    const surveyTools = new SurveyTools(ghlClient);
    const storeTools = new StoreTools(ghlClient);
    const productsTools = new ProductsTools(ghlClient);
    const paymentsTools = new PaymentsTools(ghlClient);
    const invoicesTools = new InvoicesTools(ghlClient);

    // Register all tools
    registerContactTools(server, contactTools);
    registerConversationTools(server, conversationTools);
    registerBlogTools(server, blogTools);
    registerOpportunityTools(server, opportunityTools);
    registerCalendarTools(server, calendarTools);
    registerLocationTools(server, locationTools);
    registerEmailTools(server, emailTools);
    registerEmailISVTools(server, emailISVTools);
    registerSocialMediaTools(server, socialMediaTools);
    registerMediaTools(server, mediaTools);
    registerObjectTools(server, objectTools);
    registerAssociationTools(server, associationTools);
    registerCustomFieldV2Tools(server, customFieldV2Tools);
    registerWorkflowTools(server, workflowTools);
    registerSurveyTools(server, surveyTools);
    registerStoreTools(server, storeTools);
    registerProductsTools(server, productsTools);
    registerPaymentsTools(server, paymentsTools);
    registerInvoicesTools(server, invoicesTools);
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