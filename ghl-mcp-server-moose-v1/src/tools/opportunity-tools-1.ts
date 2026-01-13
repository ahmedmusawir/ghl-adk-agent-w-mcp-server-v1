/**
 * GoHighLevel Opportunity Management Tools
 * Implements all opportunity/pipeline management functionality for the MCP server
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPSearchOpportunitiesParams,
  MCPCreateOpportunityParams,
  MCPUpdateOpportunityParams,
  MCPUpsertOpportunityParams,
  MCPAddOpportunityFollowersParams,
  MCPRemoveOpportunityFollowersParams,
  GHLOpportunity,
  GHLSearchOpportunitiesResponse,
  GHLGetPipelinesResponse,
  GHLUpsertOpportunityResponse
} from '../types/ghl-types.js';

/**
 * Opportunity Tools Class
 * Implements MCP tools for opportunity management
 */
export class OpportunityTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all opportunity operations
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'search_opportunities',
        description: `Search and filter opportunities in GoHighLevel with advanced filtering.

Filter Options:
- By pipeline: Filter opportunities in specific sales pipeline
- By stage: Filter by pipeline stage (e.g., "Qualified", "Proposal Sent")
- By contact: Get all opportunities for a specific contact
- By assigned user: Get opportunities assigned to specific team member
- By status: Filter by open, won, lost, or abandoned

Pagination:
- Use limit parameter for result size (default: 20, max: 100)

Use Cases:
- Find all open opportunities in Q4 pipeline
- Get opportunities assigned to specific sales rep
- List all won deals for a contact
- Review abandoned opportunities for follow-up`,
        inputSchema: {
          query: z.string().optional().describe('General search query (searches name, contact info)'),
          pipelineId: z.string().optional().describe('Filter by specific pipeline ID'),
          pipelineStageId: z.string().optional().describe('Filter by specific pipeline stage ID'),
          contactId: z.string().optional().describe('Filter by specific contact ID'),
          status: z.enum(['open', 'won', 'lost', 'abandoned', 'all']).optional().describe('Filter by opportunity status'),
          assignedTo: z.string().optional().describe('Filter by assigned user ID'),
          limit: z.number().min(1).max(100).optional().describe('Maximum number of opportunities to return (default: 20, max: 100)')
        }
      },
      {
        name: 'get_pipelines',
        description: `Get all sales pipelines configured in GoHighLevel.

Returns pipeline structure including:
- Pipeline ID and name
- All stages within each pipeline
- Stage IDs for creating/updating opportunities

Use this tool first to discover available pipelines and stages before creating opportunities.`,
        inputSchema: {}
      },
      {
        name: 'get_opportunity',
        description: 'Get detailed information about a specific opportunity by ID',
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity to retrieve')
        }
      },
      {
        name: 'create_opportunity',
        description: `Create a new opportunity in GoHighLevel CRM.

IMPORTANT - Monetary Value:
- GHL stores monetary values in CENTS (not dollars)
- Example: $100.00 = 10000 cents
- Always multiply dollar amounts by 100

Required Fields:
- name: Opportunity title
- pipelineId: Use get_pipelines to find available pipelines
- contactId: Must be existing contact ID

Optional Fields:
- pipelineStageId: Initial stage (defaults to first stage in pipeline)
- monetaryValue: Deal value in cents
- assignedTo: User ID to assign
- status: Initial status (default: open)`,
        inputSchema: {
          name: z.string().describe('Name/title of the opportunity'),
          pipelineId: z.string().describe('ID of the pipeline this opportunity belongs to (use get_pipelines)'),
          contactId: z.string().describe('ID of the contact associated with this opportunity'),
          pipelineStageId: z.string().optional().describe('Initial pipeline stage ID (defaults to first stage)'),
          status: z.enum(['open', 'won', 'lost', 'abandoned']).optional().describe('Initial status of the opportunity (default: open)'),
          monetaryValue: z.number().optional().describe('Monetary value in CENTS (e.g., 10000 = $100.00)'),
          assignedTo: z.string().optional().describe('User ID to assign this opportunity to')
        }
      },
      {
        name: 'update_opportunity_status',
        description: `Update the status of an opportunity (won, lost, etc.).

Status Options:
- open: Active opportunity in pipeline
- won: Deal closed successfully
- lost: Deal lost to competitor or declined
- abandoned: Opportunity no longer pursued

Best Practices:
- Provide wonReason when marking as won
- Provide lostReason when marking as lost
- Update pipelineStageId to move to appropriate stage`,
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity'),
          status: z.enum(['open', 'won', 'lost', 'abandoned']).describe('New status for the opportunity'),
          pipelineStageId: z.string().optional().describe('Move to this pipeline stage (if changing stage)'),
          wonReason: z.string().optional().describe('Reason for won status (recommended when status=won)'),
          lostReason: z.string().optional().describe('Reason for lost status (recommended when status=lost)')
        }
      },
      {
        name: 'delete_opportunity',
        description: `Delete an opportunity from GoHighLevel CRM.

WARNING: This action is permanent and cannot be undone.

Consider using update_opportunity_status with 'abandoned' status instead of deleting.`,
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity to delete')
        }
      },
      {
        name: 'update_opportunity',
        description: `Update an existing opportunity with new details (full update).

All fields except opportunityId are optional - only provide fields you want to update.

IMPORTANT - Monetary Value:
- Values must be in CENTS (not dollars)
- Example: $250.50 = 25050 cents

Use Cases:
- Move opportunity to different pipeline stage
- Update deal value
- Reassign to different team member
- Change opportunity name`,
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity to update'),
          name: z.string().optional().describe('Updated name/title of the opportunity'),
          pipelineId: z.string().optional().describe('Updated pipeline ID'),
          pipelineStageId: z.string().optional().describe('Updated pipeline stage ID'),
          status: z.enum(['open', 'won', 'lost', 'abandoned']).optional().describe('Updated status of the opportunity'),
          monetaryValue: z.number().optional().describe('Updated monetary value in CENTS (e.g., 25050 = $250.50)'),
          assignedTo: z.string().optional().describe('Updated assigned user ID')
        }
      },
      {
        name: 'upsert_opportunity',
        description: `Smart create or update: Creates new opportunity or updates existing one based on contact+pipeline.

Upsert Logic:
1. Checks if opportunity exists for given contact + pipeline combination
2. If exists: Updates the existing opportunity
3. If not exists: Creates new opportunity
4. Returns result indicating whether created or updated

IMPORTANT - Monetary Value:
- Values must be in CENTS (not dollars)
- Example: $500.00 = 50000 cents

Use Cases:
- Safely create opportunity without duplicate checking
- Update deal value if opportunity exists
- Idempotent opportunity management`,
        inputSchema: {
          pipelineId: z.string().describe('ID of the pipeline this opportunity belongs to'),
          contactId: z.string().describe('ID of the contact associated with this opportunity'),
          name: z.string().optional().describe('Name/title of the opportunity'),
          status: z.enum(['open', 'won', 'lost', 'abandoned']).optional().describe('Status of the opportunity (default: open)'),
          pipelineStageId: z.string().optional().describe('Pipeline stage ID'),
          monetaryValue: z.number().optional().describe('Monetary value in CENTS (e.g., 50000 = $500.00)'),
          assignedTo: z.string().optional().describe('User ID to assign this opportunity to')
        }
      },
      {
        name: 'add_opportunity_followers',
        description: `Add team members as followers to an opportunity for notifications and tracking.

Followers receive:
- Notifications when opportunity is updated
- Stage change alerts
- Status change notifications
- Activity updates

IMPORTANT:
- Follower IDs are GHL user IDs (not contact IDs)
- Multiple followers can be added in single operation
- Duplicate followers are ignored (no error)

Use Cases:
- Add sales manager to high-value deals
- Include team members for collaboration
- Add account manager for customer success tracking`,
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity'),
          followers: z.array(z.string()).describe('Array of user IDs to add as followers')
        }
      },
      {
        name: 'remove_opportunity_followers',
        description: `Remove team members from following an opportunity.

IMPORTANT:
- Follower IDs are GHL user IDs (not contact IDs)
- Multiple followers can be removed in single operation
- Removing non-existent followers is ignored (no error)

Use Cases:
- Remove team members when reassigning opportunity
- Clean up follower list after team changes
- Reduce notification noise for completed deals`,
        inputSchema: {
          opportunityId: z.string().describe('The unique ID of the opportunity'),
          followers: z.array(z.string()).describe('Array of user IDs to remove as followers')
        }
      }
    ];
  }

  /**
   * Execute opportunity tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'search_opportunities':
        return this.searchOpportunities(args as MCPSearchOpportunitiesParams);
      
      case 'get_pipelines':
        return this.getPipelines();
      
      case 'get_opportunity':
        return this.getOpportunity(args.opportunityId);
      
      case 'create_opportunity':
        return this.createOpportunity(args as MCPCreateOpportunityParams);
      
      case 'update_opportunity_status':
        return this.updateOpportunityStatus(args.opportunityId, args.status);
      
      case 'delete_opportunity':
        return this.deleteOpportunity(args.opportunityId);
      
      case 'update_opportunity':
        return this.updateOpportunity(args as MCPUpdateOpportunityParams);
      
      case 'upsert_opportunity':
        return this.upsertOpportunity(args as MCPUpsertOpportunityParams);
      
      case 'add_opportunity_followers':
        return this.addOpportunityFollowers(args as MCPAddOpportunityFollowersParams);
      
      case 'remove_opportunity_followers':
        return this.removeOpportunityFollowers(args as MCPRemoveOpportunityFollowersParams);
      
      default:
        throw new Error(`Unknown opportunity tool: ${name}`);
    }
  }

  /**
   * SEARCH OPPORTUNITIES
   */
  private async searchOpportunities(params: MCPSearchOpportunitiesParams): Promise<{ success: boolean; opportunities: GHLOpportunity[]; meta: any; message: string }> {
    try {
      // Build search parameters with correct API naming (underscores)
      const searchParams: any = {
        location_id: this.ghlClient.getConfig().locationId,
        limit: params.limit || 20
      };

      // Only add parameters if they have values
      if (params.query && params.query.trim()) {
        searchParams.q = params.query.trim();
      }

      if (params.pipelineId) {
        searchParams.pipeline_id = params.pipelineId;
      }

      if (params.pipelineStageId) {
        searchParams.pipeline_stage_id = params.pipelineStageId;
      }

      if (params.contactId) {
        searchParams.contact_id = params.contactId;
      }

      if (params.status) {
        searchParams.status = params.status;
      }

      if (params.assignedTo) {
        searchParams.assigned_to = params.assignedTo;
      }

      process.stderr.write(`[GHL MCP] Calling searchOpportunities with params: ${JSON.stringify(searchParams, null, 2)}\n`);

      const response = await this.ghlClient.searchOpportunities(searchParams);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }

      const data = response.data as GHLSearchOpportunitiesResponse;
      const opportunities = Array.isArray(data.opportunities) ? data.opportunities : [];
      
      return {
        success: true,
        opportunities,
        meta: data.meta,
        message: `Found ${opportunities.length} opportunities (${data.meta?.total || opportunities.length} total)`
      };
    } catch (error) {
      process.stderr.write(`[GHL MCP] Search opportunities error: ${JSON.stringify(error, null, 2)}\n`);
      throw new Error(`Failed to search opportunities: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * GET PIPELINES
   */
  private async getPipelines(): Promise<{ success: boolean; pipelines: any[]; message: string }> {
    try {
      const response = await this.ghlClient.getPipelines();
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }

      const data = response.data as GHLGetPipelinesResponse;
      const pipelines = Array.isArray(data.pipelines) ? data.pipelines : [];
      
      return {
        success: true,
        pipelines,
        message: `Retrieved ${pipelines.length} pipelines`
      };
    } catch (error) {
      throw new Error(`Failed to get pipelines: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * GET OPPORTUNITY BY ID
   */
  private async getOpportunity(opportunityId: string): Promise<{ success: boolean; opportunity: GHLOpportunity; message: string }> {
    try {
      const response = await this.ghlClient.getOpportunity(opportunityId);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        opportunity: response.data,
        message: 'Opportunity retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * CREATE OPPORTUNITY
   */
  private async createOpportunity(params: MCPCreateOpportunityParams): Promise<{ success: boolean; opportunity: GHLOpportunity; message: string }> {
    try {
      const opportunityData = {
        locationId: this.ghlClient.getConfig().locationId,
        name: params.name,
        pipelineId: params.pipelineId,
        contactId: params.contactId,
        status: params.status || 'open' as const,
        pipelineStageId: params.pipelineStageId,
        monetaryValue: params.monetaryValue,
        assignedTo: params.assignedTo,
        customFields: params.customFields
      };

      const response = await this.ghlClient.createOpportunity(opportunityData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        opportunity: response.data,
        message: `Opportunity created successfully with ID: ${response.data.id}`
      };
    } catch (error: any) {
      // Handle invalid pipeline or stage
      if (error.message?.includes('pipeline') || error.message?.includes('stage') || error.message?.includes('(400)')) {
        throw new Error(`Invalid pipeline or stage configuration.

Possible issues:
1. Pipeline ID doesn't exist for this location
2. Stage ID doesn't belong to the specified pipeline
3. Pipeline is archived or deleted

Use get_pipelines tool to see available pipelines and stages.

Original error: ${error.message || error}`);
      }
      
      // Handle missing contact
      if (error.message?.includes('contact') || error.message?.includes('(404)')) {
        throw new Error(`Contact not found: ${params.contactId}

Opportunities must be associated with an existing contact.
Use search_contacts or create_contact first.

Original error: ${error.message || error}`);
      }
      
      // Handle permission errors
      if (error.message?.includes('(403)') || error.message?.includes('permission') || error.message?.includes('unauthorized')) {
        throw new Error(`Permission denied: Cannot create opportunities.

Please check:
- API key has opportunity management permissions
- User has access to this pipeline
- Location settings allow opportunity creation

Original error: ${error.message || error}`);
      }
      
      throw new Error(`Failed to create opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPDATE OPPORTUNITY STATUS
   */
  private async updateOpportunityStatus(opportunityId: string, status: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.updateOpportunityStatus(opportunityId, status as any);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        message: `Opportunity status updated to ${status}`
      };
    } catch (error: any) {
      // Handle status update conflicts
      if (error.message?.includes('(409)') || error.message?.includes('status') || error.message?.includes('conflict')) {
        throw new Error(`Cannot update opportunity status.

Possible reasons:
1. Opportunity is already in final state (won/lost)
2. Status change not allowed from current stage
3. Required fields missing for status change (e.g., won/lost reason)
4. Pipeline workflow rules prevent this status change

Current status: ${status}
Check pipeline workflow rules in GHL settings.

Original error: ${error.message || error}`);
      }
      
      // Handle opportunity not found
      if (error.message?.includes('(404)') || error.message?.includes('not found')) {
        throw new Error(`Opportunity not found: ${opportunityId}

The opportunity may have been deleted or the ID is incorrect.
Use search_opportunities to find the correct opportunity ID.

Original error: ${error.message || error}`);
      }
      
      throw new Error(`Failed to update opportunity status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * DELETE OPPORTUNITY
   */
  private async deleteOpportunity(opportunityId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.deleteOpportunity(opportunityId);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        message: 'Opportunity deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPDATE OPPORTUNITY (FULL UPDATE)
   */
  private async updateOpportunity(params: MCPUpdateOpportunityParams): Promise<{ success: boolean; opportunity: GHLOpportunity; message: string }> {
    try {
      const updateData: any = {};
      
      // Only include fields that are provided
      if (params.name) updateData.name = params.name;
      if (params.pipelineId) updateData.pipelineId = params.pipelineId;
      if (params.pipelineStageId) updateData.pipelineStageId = params.pipelineStageId;
      if (params.status) updateData.status = params.status;
      if (params.monetaryValue !== undefined) updateData.monetaryValue = params.monetaryValue;
      if (params.assignedTo) updateData.assignedTo = params.assignedTo;

      const response = await this.ghlClient.updateOpportunity(params.opportunityId, updateData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        opportunity: response.data,
        message: `Opportunity updated successfully`
      };
    } catch (error) {
      throw new Error(`Failed to update opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPSERT OPPORTUNITY
   */
  private async upsertOpportunity(params: MCPUpsertOpportunityParams): Promise<{ success: boolean; opportunity: GHLOpportunity; isNew: boolean; message: string }> {
    try {
      const upsertData = {
        locationId: this.ghlClient.getConfig().locationId,
        pipelineId: params.pipelineId,
        contactId: params.contactId,
        name: params.name,
        status: params.status || 'open' as const,
        pipelineStageId: params.pipelineStageId,
        monetaryValue: params.monetaryValue,
        assignedTo: params.assignedTo
      };

      const response = await this.ghlClient.upsertOpportunity(upsertData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }

      const data = response.data as GHLUpsertOpportunityResponse;
      
      return {
        success: true,
        opportunity: data.opportunity,
        isNew: data.new,
        message: `Opportunity ${data.new ? 'created' : 'updated'} successfully`
      };
    } catch (error) {
      throw new Error(`Failed to upsert opportunity: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * ADD OPPORTUNITY FOLLOWERS
   */
  private async addOpportunityFollowers(params: MCPAddOpportunityFollowersParams): Promise<{ success: boolean; followers: string[]; followersAdded: string[]; message: string }> {
    try {
      const response = await this.ghlClient.addOpportunityFollowers(params.opportunityId, params.followers);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        followers: response.data.followers || [],
        followersAdded: response.data.followersAdded || [],
        message: `Added ${response.data.followersAdded?.length || 0} followers to opportunity`
      };
    } catch (error) {
      throw new Error(`Failed to add opportunity followers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * REMOVE OPPORTUNITY FOLLOWERS
   */
  private async removeOpportunityFollowers(params: MCPRemoveOpportunityFollowersParams): Promise<{ success: boolean; followers: string[]; followersRemoved: string[]; message: string }> {
    try {
      const response = await this.ghlClient.removeOpportunityFollowers(params.opportunityId, params.followers);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        followers: response.data.followers || [],
        followersRemoved: response.data.followersRemoved || [],
        message: `Removed ${response.data.followersRemoved?.length || 0} followers from opportunity`
      };
    } catch (error) {
      throw new Error(`Failed to remove opportunity followers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 