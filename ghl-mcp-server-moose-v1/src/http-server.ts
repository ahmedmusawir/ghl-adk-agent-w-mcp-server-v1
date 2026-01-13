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
import { LocationTools } from "./tools/location-tools";
import { EmailTools } from "./tools/email-tools";
import { EmailISVTools } from "./tools/email-isv-tools";
import { SocialMediaTools } from "./tools/social-media-tools";
import { MediaTools } from "./tools/media-tools";
import { ObjectTools } from "./tools/object-tools";
import { AssociationTools } from "./tools/association-tools";
import { CustomFieldV2Tools } from "./tools/custom-field-v2-tools";
import { WorkflowTools } from "./tools/workflow-tools";
import { SurveyTools } from "./tools/survey-tools";
import { StoreTools } from "./tools/store-tools";
import { ProductsTools } from "./tools/products-tools";
import { PaymentsTools } from "./tools/payments-tools";
import { InvoicesTools } from "./tools/invoices-tools";
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
  private locationTools: LocationTools;
  private emailTools: EmailTools;
  private emailISVTools: EmailISVTools;
  private socialMediaTools: SocialMediaTools;
  private mediaTools: MediaTools;
  private objectTools: ObjectTools;
  private associationTools: AssociationTools;
  private customFieldV2Tools: CustomFieldV2Tools;
  private workflowTools: WorkflowTools;
  private surveyTools: SurveyTools;
  private storeTools: StoreTools;
  private productsTools: ProductsTools;
  private paymentsTools: PaymentsTools;
  private invoicesTools: InvoicesTools;
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
    this.locationTools = new LocationTools(this.ghlClient);
    this.emailTools = new EmailTools(this.ghlClient);
    this.emailISVTools = new EmailISVTools(this.ghlClient);
    this.socialMediaTools = new SocialMediaTools(this.ghlClient);
    this.mediaTools = new MediaTools(this.ghlClient);
    this.objectTools = new ObjectTools(this.ghlClient);
    this.associationTools = new AssociationTools(this.ghlClient);
    this.customFieldV2Tools = new CustomFieldV2Tools(this.ghlClient);
    this.workflowTools = new WorkflowTools(this.ghlClient);
    this.surveyTools = new SurveyTools(this.ghlClient);
    this.storeTools = new StoreTools(this.ghlClient);
    this.productsTools = new ProductsTools(this.ghlClient);
    this.paymentsTools = new PaymentsTools(this.ghlClient);
    this.invoicesTools = new InvoicesTools(this.ghlClient);

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

    // Register location tools
    const locationToolDefinitions = this.locationTools.getToolDefinitions();
    for (const tool of locationToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.locationTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register email tools
    const emailToolDefinitions = this.emailTools.getToolDefinitions();
    for (const tool of emailToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.emailTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register email verification tools
    const emailISVToolDefinitions = this.emailISVTools.getToolDefinitions();
    for (const tool of emailISVToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.emailISVTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register social media tools
    const socialMediaToolDefinitions = this.socialMediaTools.getToolDefinitions();
    for (const tool of socialMediaToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.socialMediaTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register media tools
    const mediaToolDefinitions = this.mediaTools.getToolDefinitions();
    for (const tool of mediaToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.mediaTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register object tools
    const objectToolDefinitions = this.objectTools.getToolDefinitions();
    for (const tool of objectToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.objectTools.executeTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register association tools
    const associationToolDefinitions = this.associationTools.getToolDefinitions();
    for (const tool of associationToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.associationTools.executeAssociationTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register custom field V2 tools
    const customFieldV2ToolDefinitions = this.customFieldV2Tools.getToolDefinitions();
    for (const tool of customFieldV2ToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.customFieldV2Tools.executeCustomFieldV2Tool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register workflow tools
    const workflowToolDefinitions = this.workflowTools.getToolDefinitions();
    for (const tool of workflowToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.workflowTools.executeWorkflowTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register survey tools
    const surveyToolDefinitions = this.surveyTools.getToolDefinitions();
    for (const tool of surveyToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.surveyTools.executeSurveyTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register store tools
    const storeToolDefinitions = this.storeTools.getToolDefinitions();
    for (const tool of storeToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.storeTools.executeStoreTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register products tools
    const productsToolDefinitions = this.productsTools.getToolDefinitions();
    for (const tool of productsToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.productsTools.executeProductsTool(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register payments tools
    const paymentsToolDefinitions = this.paymentsTools.getToolDefinitions();
    for (const tool of paymentsToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.paymentsTools.handleToolCall(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    // Register invoices tools
    const invoicesToolDefinitions = this.invoicesTools.getToolDefinitions();
    for (const tool of invoicesToolDefinitions) {
      this.mcpServer.registerTool(
        tool.name,
        { description: tool.description, inputSchema: tool.inputSchema },
        async (params: any) => {
          try {
            const result = await this.invoicesTools.handleToolCall(tool.name, params);
            return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return { content: [{ type: "text" as const, text: `Error: ${errorMessage}` }], isError: true };
          }
        }
      );
    }

    console.log(
      `[GHL MCP HTTP] Registered ${contactToolDefinitions.length} contact + ${conversationToolDefinitions.length} conversation + ${blogToolDefinitions.length} blog + ${opportunityToolDefinitions.length} opportunity + ${calendarToolDefinitions.length} calendar + ${locationToolDefinitions.length} location + ${emailToolDefinitions.length} email + ${emailISVToolDefinitions.length} email verification + ${socialMediaToolDefinitions.length} social media + ${mediaToolDefinitions.length} media + ${objectToolDefinitions.length} object + ${associationToolDefinitions.length} association + ${customFieldV2ToolDefinitions.length} custom fields + ${workflowToolDefinitions.length} workflow + ${surveyToolDefinitions.length} survey + ${storeToolDefinitions.length} store + ${productsToolDefinitions.length} products + ${paymentsToolDefinitions.length} payments + ${invoicesToolDefinitions.length} invoices + 2 utility tools`
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
          location: this.locationTools.getToolDefinitions().length,
          email: this.emailTools.getToolDefinitions().length,
          emailVerification: this.emailISVTools.getToolDefinitions().length,
          socialMedia: this.socialMediaTools.getToolDefinitions().length,
          media: this.mediaTools.getToolDefinitions().length,
          object: this.objectTools.getToolDefinitions().length,
          association: this.associationTools.getToolDefinitions().length,
          customFieldsV2: this.customFieldV2Tools.getToolDefinitions().length,
          workflow: this.workflowTools.getToolDefinitions().length,
          survey: this.surveyTools.getToolDefinitions().length,
          utility: 2,
          total: 
            this.contactTools.getToolDefinitions().length + 
            this.conversationTools.getToolDefinitions().length + 
            this.blogTools.getToolDefinitions().length +
            this.opportunityTools.getToolDefinitions().length +
            this.calendarTools.getToolDefinitions().length +
            this.locationTools.getToolDefinitions().length +
            this.emailTools.getToolDefinitions().length +
            this.emailISVTools.getToolDefinitions().length +
            this.socialMediaTools.getToolDefinitions().length +
            this.mediaTools.getToolDefinitions().length +
            this.objectTools.getToolDefinitions().length +
            this.associationTools.getToolDefinitions().length +
            this.customFieldV2Tools.getToolDefinitions().length +
            this.workflowTools.getToolDefinitions().length +
            this.surveyTools.getToolDefinitions().length +
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
            this.locationTools.getToolDefinitions().length +
            this.emailTools.getToolDefinitions().length +
            this.emailISVTools.getToolDefinitions().length +
            this.socialMediaTools.getToolDefinitions().length +
            this.mediaTools.getToolDefinitions().length +
            this.objectTools.getToolDefinitions().length +
            this.associationTools.getToolDefinitions().length +
            this.customFieldV2Tools.getToolDefinitions().length +
            this.workflowTools.getToolDefinitions().length +
            this.surveyTools.getToolDefinitions().length +
            this.storeTools.getToolDefinitions().length +
            this.productsTools.getToolDefinitions().length +
            this.paymentsTools.getToolDefinitions().length +
            this.invoicesTools.getToolDefinitions().length +
            2
          } total tools`
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
        console.log("🏢 LOCATION MANAGEMENT (24 tools):");
        console.log("   SUB-ACCOUNTS: search, get, create, update, delete locations");
        console.log("   TAGS: get, create, update, delete location tags");
        console.log("   CUSTOM FIELDS: get, create, update, delete custom fields");
        console.log("   CUSTOM VALUES: get, create, update, delete custom values");
        console.log("   TEMPLATES: get, delete location templates");
        console.log("   SETTINGS: get timezones");
        console.log("");
        console.log("📧 EMAIL MARKETING (5 tools):");
        console.log("   CAMPAIGNS: get email campaigns");
        console.log("   TEMPLATES: create, get, update, delete email templates");
        console.log("");
        console.log("✅ EMAIL VERIFICATION (1 tool):");
        console.log("   VERIFY: email deliverability and risk assessment");
        console.log("");
        console.log("📱 SOCIAL MEDIA MANAGEMENT (17 tools):");
        console.log("   POST MANAGEMENT: search, create, get, update, delete posts");
        console.log("   BULK OPERATIONS: bulk delete, CSV upload/status");
        console.log("   ACCOUNT INTEGRATION: get/delete social accounts");
        console.log("   ORGANIZATION: categories and tags");
        console.log("   OAUTH: connect platforms (Google, Facebook, Instagram, LinkedIn, Twitter, TikTok)");
        console.log("");
        console.log("📁 MEDIA LIBRARY (3 tools):");
        console.log("   FILES: get, upload, delete media files");
        console.log("   STORAGE: organize in folders, hosted URLs");
        console.log("");
        console.log("🏗️  CUSTOM OBJECTS (9 tools):");
        console.log("   SCHEMA MANAGEMENT: get all objects, create/get/update object schemas");
        console.log("   RECORD OPERATIONS: create, get, update, delete object records");
        console.log("   ADVANCED SEARCH: query custom data with searchable properties");
        console.log("   USE CASES: pet records, support tickets, inventory, custom business data");
        console.log("");
        console.log("🔗 ASSOCIATION MANAGEMENT (10 tools):");
        console.log("   ASSOCIATIONS: get all, create, get by ID/key/object, update, delete");
        console.log("   RELATIONS: create, get by record, delete relations");
        console.log("   ADVANCED: relationship mapping between objects (contacts, custom objects, opportunities)");
        console.log("   USE CASES: student-teacher links, pet-owner connections, ticket-product associations");
        console.log("");
        console.log("🔧 CUSTOM FIELDS V2 (8 tools):");
        console.log("   FIELDS: get by ID, create, update, delete custom fields");
        console.log("   DISCOVERY: get fields by object key");
        console.log("   FOLDERS: create, update, delete field folders");
        console.log("   FIELD TYPES: text, number, date, options, file upload, etc.");
        console.log("");
        console.log("⚡ WORKFLOW MANAGEMENT (1 tool):");
        console.log("   DISCOVERY: get workflows for automation");
        console.log("");
        console.log("📊 SURVEY MANAGEMENT (2 tools):");
        console.log("   SURVEYS: get surveys");
        console.log("   SUBMISSIONS: get survey submissions with filtering");
        console.log("");
        console.log("🏪 STORE MANAGEMENT (18 tools):");
        console.log("   SHIPPING ZONES: create, list, get, update, delete zones");
        console.log("   SHIPPING RATES: get available rates, create, list, get, update, delete rates");
        console.log("   SHIPPING CARRIERS: create, list, get, update, delete carriers");
        console.log("   STORE SETTINGS: create/update settings, get store configuration");
        console.log("   E-COMMERCE: geographic shipping, rate calculation, carrier integration");
        console.log("");
        console.log("🛒 PRODUCTS MANAGEMENT (10 tools):");
        console.log("   PRODUCTS: create, list, get, update, delete products");
        console.log("   PRICING: create prices, list prices (one-time & recurring)");
        console.log("   INVENTORY: list inventory with stock levels");
        console.log("   COLLECTIONS: create, list product collections");
        console.log("   PRODUCT TYPES: digital, physical, service, hybrid");
        console.log("");
        console.log("💳 PAYMENTS MANAGEMENT (20 tools):");
        console.log("   INTEGRATION PROVIDERS: create, list white-label payment gateways");
        console.log("   ORDERS: list, get orders with filtering");
        console.log("   FULFILLMENT: create, list order fulfillments with tracking");
        console.log("   TRANSACTIONS: list, get payment transactions");
        console.log("   SUBSCRIPTIONS: list, get recurring subscriptions");
        console.log("   COUPONS: create, update, delete, list, get discount coupons");
        console.log("   CUSTOM GATEWAYS: integrate custom payment providers");
        console.log("");
        console.log("🧾 INVOICES & BILLING (39 tools):");
        console.log("   INVOICE TEMPLATES: create, list, get, update, delete, configure (7 tools)");
        console.log("   RECURRING INVOICES: create, list, get, update, delete, schedule, auto-payment, cancel (8 tools)");
        console.log("   INVOICE MANAGEMENT: create, list, get, update, delete, void, send, record payment, text2pay, generate number (10 tools)");
        console.log("   ESTIMATES: create, list, get, update, delete, send, convert to invoice, generate number (7 tools)");
        console.log("   ESTIMATE TEMPLATES: list, get, create, update, delete, preview (5 tools)");
        console.log("");
        console.log("   ⚠️  UNIMPLEMENTED TOOLS (6 tools - will throw 'not implemented' errors):");
        console.log("      • get_estimate - needs API method in ghl-api-client.ts");
        console.log("      • update_estimate - needs API method in ghl-api-client.ts");
        console.log("      • delete_estimate - needs API method in ghl-api-client.ts");
        console.log("      • get_estimate_template - needs API method in ghl-api-client.ts");
        console.log("      • update_estimate_template - needs API method in ghl-api-client.ts");
        console.log("      • delete_estimate_template - needs API method in ghl-api-client.ts");
        console.log("");
        console.log("🛠️  UTILITY TOOLS (2 tools):");
        console.log("   DATE/TIME: calculate future datetime for GHL API");
        console.log("   CALCULATOR: safe math calculations with functions");
        console.log("=========================================");
        
        // Calculate and display total tool count dynamically
        const totalTools = 
          this.contactTools.getToolDefinitions().length +
          this.conversationTools.getToolDefinitions().length +
          this.blogTools.getToolDefinitions().length +
          this.opportunityTools.getToolDefinitions().length +
          this.calendarTools.getToolDefinitions().length +
          this.locationTools.getToolDefinitions().length +
          this.emailTools.getToolDefinitions().length +
          this.emailISVTools.getToolDefinitions().length +
          this.socialMediaTools.getToolDefinitions().length +
          this.mediaTools.getToolDefinitions().length +
          this.objectTools.getToolDefinitions().length +
          this.associationTools.getToolDefinitions().length +
          this.customFieldV2Tools.getToolDefinitions().length +
          this.workflowTools.getToolDefinitions().length +
          this.surveyTools.getToolDefinitions().length +
          this.storeTools.getToolDefinitions().length +
          this.productsTools.getToolDefinitions().length +
          this.paymentsTools.getToolDefinitions().length +
          this.invoicesTools.getToolDefinitions().length +
          2; // utility tools
        
        console.log(`\n🎯 TOTAL TOOLS AVAILABLE: ${totalTools}`);
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
