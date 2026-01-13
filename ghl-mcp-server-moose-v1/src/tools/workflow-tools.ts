import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

export class WorkflowTools {
  constructor(private apiClient: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      {
        name: 'get_workflows',
        description: `Retrieve all workflows for a location.

Discover automation sequences and workflow configurations.

Use Cases:
- List all available workflows
- Discover automation options
- View workflow statuses
- Audit automation setup

Workflows represent automation sequences triggered by various events.

Returns: Array of workflows with status and configuration.

Related Tools: Contact and opportunity tools for workflow triggers`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      }
    ];
  }

  async executeWorkflowTool(name: string, params: any): Promise<any> {
    try {
      switch (name) {
        case 'get_workflows':
          return await this.getWorkflows(params);
        
        default:
          throw new Error(`Unknown workflow tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing workflow tool ${name}:`, error);
      throw error;
    }
  }

  // ===== WORKFLOW MANAGEMENT TOOLS =====

  /**
   * Get all workflows for a location
   */
  private async getWorkflows(params: any): Promise<any> {
    try {
      const result = await this.apiClient.getWorkflows({
        locationId: params.locationId || ''
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to get workflows: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        workflows: result.data.workflows,
        message: `Successfully retrieved ${result.data.workflows.length} workflows`,
        metadata: {
          totalWorkflows: result.data.workflows.length,
          workflowStatuses: result.data.workflows.reduce((acc: { [key: string]: number }, workflow) => {
            acc[workflow.status] = (acc[workflow.status] || 0) + 1;
            return acc;
          }, {})
        }
      };
    } catch (error) {
      console.error('Error getting workflows:', error);
      throw new Error(`Failed to get workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Helper function to check if a tool name belongs to workflow tools
export function isWorkflowTool(toolName: string): boolean {
  const workflowToolNames = [
    'get_workflows'
  ];
  
  return workflowToolNames.includes(toolName);
} 