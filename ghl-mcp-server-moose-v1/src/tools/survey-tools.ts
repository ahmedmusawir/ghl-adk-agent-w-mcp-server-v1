import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

export class SurveyTools {
  constructor(private apiClient: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      {
        name: 'get_surveys',
        description: `Retrieve all surveys for a location.

List surveys used to collect information from contacts.

Use Cases:
- List all available surveys
- Discover survey forms
- View survey configurations
- Prepare for submission analysis

Surveys collect information through forms and questionnaires.

Returns: Array of surveys with pagination.

Related Tools: get_survey_submissions`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          skip: z.number().min(0).optional().describe('Number of records to skip for pagination (default: 0)'),
          limit: z.number().min(1).max(50).optional().describe('Maximum surveys to return (max: 50, default: 10)'),
          type: z.string().optional().describe('Filter surveys by type (e.g., "folder")')
        }
      },
      {
        name: 'get_survey_submissions',
        description: `Retrieve survey submissions with filtering.

Analyze responses from contacts who completed surveys.

Use Cases:
- View survey responses
- Analyze submission data
- Track survey completion
- Search submissions by contact
- Filter by date range

Advanced filtering by survey ID, contact info, and date range.

Returns: Array of submissions with contact and response data.

Related Tools: get_surveys`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          page: z.number().min(1).optional().describe('Page number for pagination (default: 1)'),
          limit: z.number().min(1).max(100).optional().describe('Submissions per page (max: 100, default: 20)'),
          surveyId: z.string().optional().describe('Filter by specific survey ID'),
          q: z.string().optional().describe('Search by contact ID, name, email, or phone'),
          startAt: z.string().optional().describe('Start date (YYYY-MM-DD format)'),
          endAt: z.string().optional().describe('End date (YYYY-MM-DD format)')
        }
      }
    ];
  }

  async executeSurveyTool(name: string, params: any): Promise<any> {
    try {
      switch (name) {
        case 'get_surveys':
          return await this.getSurveys(params);
        
        case 'get_survey_submissions':
          return await this.getSurveySubmissions(params);
        
        default:
          throw new Error(`Unknown survey tool: ${name}`);
      }
    } catch (error) {
      console.error(`Error executing survey tool ${name}:`, error);
      throw error;
    }
  }

  // ===== SURVEY MANAGEMENT TOOLS =====

  /**
   * Get all surveys for a location
   */
  private async getSurveys(params: any): Promise<any> {
    try {
      const result = await this.apiClient.getSurveys({
        locationId: params.locationId || '',
        skip: params.skip,
        limit: params.limit,
        type: params.type
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to get surveys: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        surveys: result.data.surveys,
        total: result.data.total,
        message: `Successfully retrieved ${result.data.surveys.length} surveys`,
        metadata: {
          totalSurveys: result.data.total,
          returnedCount: result.data.surveys.length,
          pagination: {
            skip: params.skip || 0,
            limit: params.limit || 10
          },
          ...(params.type && { filterType: params.type })
        }
      };
    } catch (error) {
      console.error('Error getting surveys:', error);
      throw new Error(`Failed to get surveys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get survey submissions with filtering
   */
  private async getSurveySubmissions(params: any): Promise<any> {
    try {
      const result = await this.apiClient.getSurveySubmissions({
        locationId: params.locationId || '',
        page: params.page,
        limit: params.limit,
        surveyId: params.surveyId,
        q: params.q,
        startAt: params.startAt,
        endAt: params.endAt
      });

      if (!result.success || !result.data) {
        throw new Error(`Failed to get survey submissions: ${result.error?.message || 'Unknown error'}`);
      }

      return {
        success: true,
        submissions: result.data.submissions,
        meta: result.data.meta,
        message: `Successfully retrieved ${result.data.submissions.length} survey submissions`,
        metadata: {
          totalSubmissions: result.data.meta.total,
          returnedCount: result.data.submissions.length,
          pagination: {
            currentPage: result.data.meta.currentPage,
            nextPage: result.data.meta.nextPage,
            prevPage: result.data.meta.prevPage,
            limit: params.limit || 20
          },
          filters: {
            ...(params.surveyId && { surveyId: params.surveyId }),
            ...(params.q && { search: params.q }),
            ...(params.startAt && { startDate: params.startAt }),
            ...(params.endAt && { endDate: params.endAt })
          }
        }
      };
    } catch (error) {
      console.error('Error getting survey submissions:', error);
      throw new Error(`Failed to get survey submissions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Helper function to check if a tool name belongs to survey tools
export function isSurveyTool(toolName: string): boolean {
  const surveyToolNames = [
    'get_surveys',
    'get_survey_submissions'
  ];
  
  return surveyToolNames.includes(toolName);
} 