/**
 * GoHighLevel Email Marketing Tools
 * Implements email campaign and template management functionality for the MCP server
 * 
 * IMPORTANT: Follows lessons learned from calendar-tools fix:
 * - Always use this.ghlClient.getConfig().locationId as fallback (never empty string)
 * - Return response.data (unwrapped) not response
 * - Comprehensive error handling for all HTTP codes
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

/**
 * Email Tools Class
 * Implements MCP tools for email campaigns and templates
 */
export class EmailTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all email operations
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'get_email_campaigns',
        description: `Get a list of email campaigns from GoHighLevel.

Email campaigns are bulk email sends to contact lists. Track campaign status, performance, and delivery.

Use Cases:
- Monitor active email campaigns
- Review campaign performance
- Track campaign status and delivery
- Audit email marketing activities

Parameters:
- status: Filter by campaign status (optional)
- limit: Max results to return (default: 10)
- offset: Pagination offset (default: 0)

Campaign Statuses:
- active: Currently sending
- pause: Temporarily stopped
- complete: Finished sending
- cancelled: Stopped permanently
- retry: Retrying failed sends
- draft: Not yet sent
- resend-scheduled: Scheduled for resend

Returns: Array of campaigns with status, recipients, send times, and performance metrics.

Best Practices:
- Use status filter to find specific campaigns
- Paginate for accounts with many campaigns
- Monitor active campaigns for issues

Related Tools: get_email_templates (templates used in campaigns)`,
        inputSchema: {
          status: z.enum(['active', 'pause', 'complete', 'cancelled', 'retry', 'draft', 'resend-scheduled']).optional().describe('Filter campaigns by status (default: active)'),
          limit: z.number().optional().describe('Maximum number of campaigns to return (default: 10)'),
          offset: z.number().optional().describe('Number of campaigns to skip for pagination (default: 0)')
        }
      },
      {
        name: 'create_email_template',
        description: `Create a new email template in GoHighLevel.

Email templates are reusable email designs used in campaigns, workflows, and manual sends.

Use Cases:
- Create branded email templates
- Build reusable campaign templates
- Design workflow email templates
- Set up transactional email templates

Required Parameters:
- title: Template name/title
- html: HTML content of the email

Optional Parameters:
- isPlainText: Use plain text instead of HTML (default: false)

Returns: Created template with generated ID.

HTML Template Guidelines:
- Use inline CSS for styling
- Include merge fields for personalization ({{contact.firstName}}, etc.)
- Test across email clients
- Keep under 102KB for best deliverability
- Include unsubscribe link

Best Practices:
- Use descriptive titles for easy identification
- Test templates before using in campaigns
- Include alt text for images
- Make templates mobile-responsive
- Use merge fields for personalization

Related Tools: get_email_templates (list all), update_email_template, delete_email_template`,
        inputSchema: {
          title: z.string().describe('Title/name of the email template'),
          html: z.string().describe('HTML content of the template (use inline CSS)'),
          isPlainText: z.boolean().optional().describe('Whether the template is plain text instead of HTML (default: false)')
        }
      },
      {
        name: 'get_email_templates',
        description: `Get a list of email templates from GoHighLevel.

Retrieves all email templates available in the location.

Use Cases:
- List all available email templates
- Find template IDs for campaigns
- Audit template library
- Export template content

Parameters:
- limit: Max results to return (default: 10)
- offset: Pagination offset (default: 0)

Returns: Array of templates with IDs, titles, HTML content, and metadata.

Best Practices:
- Use pagination for locations with many templates
- Note template IDs for campaign use
- Regularly audit and clean up unused templates

Related Tools: create_email_template, update_email_template, delete_email_template`,
        inputSchema: {
          limit: z.number().optional().describe('Maximum number of templates to return (default: 10)'),
          offset: z.number().optional().describe('Number of templates to skip for pagination (default: 0)')
        }
      },
      {
        name: 'update_email_template',
        description: `Update an existing email template in GoHighLevel.

Modify template content and settings. Active campaigns using this template will use the updated version.

Use Cases:
- Fix typos or errors in templates
- Update branding or design
- Improve template content
- Add new merge fields

Required Parameters:
- templateId: The template to update
- html: Updated HTML content

Optional Parameters:
- previewText: Updated preview/snippet text

Returns: Success confirmation.

⚠️ Impact:
- Active campaigns may use updated template
- Scheduled emails will use new version
- Past emails remain unchanged

Best Practices:
- Test updated template before saving
- Use get_email_templates to find templateId
- Consider creating new template for major changes
- Update preview text to match content

Related Tools: get_email_templates (find templateId), create_email_template, delete_email_template`,
        inputSchema: {
          templateId: z.string().describe('The ID of the template to update'),
          html: z.string().describe('The updated HTML content of the template'),
          previewText: z.string().optional().describe('The updated preview/snippet text for the template')
        }
      },
      {
        name: 'delete_email_template',
        description: `Delete an email template from GoHighLevel.

⚠️ WARNING: This may break campaigns and workflows using this template!

Permanently deletes an email template. Active campaigns and workflows using this template may fail.

Use Cases:
- Remove obsolete templates
- Clean up test templates
- Delete duplicate templates
- Remove unused templates

Parameters:
- templateId: The template to delete

⚠️ Impact:
- Template cannot be recovered
- Campaigns using this template may break
- Workflows using this template may fail
- Scheduled emails using this template may fail

Best Practices:
- Check template usage before deletion
- Export template content before deletion
- Update campaigns/workflows to use different template first
- Consider archiving instead of deleting

Related Tools: get_email_templates (find templateId), update_email_template`,
        inputSchema: {
          templateId: z.string().describe('The ID of the template to delete')
        }
      }
    ];
  }

  /**
   * Execute email tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_email_campaigns':
        return await this.getEmailCampaigns(args);
      case 'create_email_template':
        return await this.createEmailTemplate(args);
      case 'get_email_templates':
        return await this.getEmailTemplates(args);
      case 'update_email_template':
        return await this.updateEmailTemplate(args);
      case 'delete_email_template':
        return await this.deleteEmailTemplate(args);
      default:
        throw new Error(`Unknown email tool: ${name}`);
    }
  }

  private async getEmailCampaigns(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.getEmailCampaigns(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get email campaigns.');
      }
      return {
        success: true,
        campaigns: response.data.schedules,
        total: response.data.total,
        message: `Successfully retrieved ${response.data.schedules.length} email campaigns.`
      };
    } catch (error) {
      throw new Error(`Failed to get email campaigns: ${error}`);
    }
  }

  private async createEmailTemplate(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.createEmailTemplate(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create email template.');
      }
      return {
        success: true,
        template: response.data,
        message: `Successfully created email template.`
      };
    } catch (error) {
      throw new Error(`Failed to create email template: ${error}`);
    }
  }

  private async getEmailTemplates(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.getEmailTemplates(params);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get email templates.');
      }
      return {
        success: true,
        templates: response.data,
        message: `Successfully retrieved ${response.data.length} email templates.`
      };
    } catch (error) {
      throw new Error(`Failed to get email templates: ${error}`);
    }
  }

  private async updateEmailTemplate(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.updateEmailTemplate(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to update email template.');
      }
      return {
        success: true,
        message: 'Successfully updated email template.'
      };
    } catch (error) {
      throw new Error(`Failed to update email template: ${error}`);
    }
  }

  private async deleteEmailTemplate(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.deleteEmailTemplate(params);
      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to delete email template.');
      }
      return {
        success: true,
        message: 'Successfully deleted email template.'
      };
    } catch (error) {
      throw new Error(`Failed to delete email template: ${error}`);
    }
  }
} 