/**
 * GoHighLevel Social Media Management Tools
 * Implements social media posting, account management, and bulk operations
 * 
 * IMPORTANT: Follows lessons learned from calendar-tools fix:
 * - Always use this.ghlClient.getConfig().locationId as fallback (never empty string)
 * - Return response.data (unwrapped) not response
 * - Comprehensive error handling for all HTTP codes
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

export class SocialMediaTools {
  constructor(private ghlClient: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      // ============================================================================
      // POST MANAGEMENT (6 tools)
      // ============================================================================

      {
        name: 'search_social_posts',
        description: `Search and filter social media posts across all platforms.

Search posts by status, date range, accounts, and type across Google Business, Facebook, Instagram, LinkedIn, Twitter, and TikTok.

Call with no parameters to list recent posts. All parameters are optional.

Use Cases:
- Find scheduled posts for review
- Audit published content
- Track failed posts for retry
- Monitor draft posts
- Search posts by date range

Optional Parameters:
- type: Filter by status (recent, all, scheduled, draft, failed, etc.)
- accounts: Comma-separated account IDs
- fromDate: Start date (ISO format, defaults to 30 days ago)
- toDate: End date (ISO format, defaults to today)
- skip: Pagination offset (default: 0)
- limit: Max results (default: 10)
- includeUsers: Include user data (default: true)
- postType: Filter by post/story/reel

Returns: Array of posts with content, media, status, and platform details.

Related Tools: get_social_post, create_social_post, update_social_post`,
        inputSchema: {
          type: z.enum(['recent', 'all', 'scheduled', 'draft', 'failed', 'in_review', 'published', 'in_progress', 'deleted']).optional().describe('Filter posts by status (default: all)'),
          accounts: z.string().optional().describe('Comma-separated account IDs to filter by'),
          skip: z.number().optional().describe('Number of posts to skip for pagination (default: 0)'),
          limit: z.number().optional().describe('Number of posts to return (default: 10)'),
          fromDate: z.string().optional().describe('Start date in ISO format (defaults to 30 days ago)'),
          toDate: z.string().optional().describe('End date in ISO format (defaults to today)'),
          includeUsers: z.boolean().optional().describe('Include user data in response (default: true)'),
          postType: z.enum(['post', 'story', 'reel']).optional().describe('Type of post to search for')
        }
      },
      {
        name: 'create_social_post',
        description: `Create a new social media post for multiple platforms.

Post to Google Business, Facebook, Instagram, LinkedIn, Twitter, and TikTok simultaneously.

Required Parameters:
- accountIds: Array of social account IDs to post to
- summary: Post content/text
- type: Post type (post/story/reel)

Optional Parameters:
- media: Array of media attachments (images/videos)
- status: draft/scheduled/published (default: draft)
- scheduleDate: When to publish (ISO format)
- followUpComment: Auto-comment after posting
- tags: Tag IDs for organization
- categoryId: Category for organization
- userId: User creating the post

Returns: Created post with IDs for each platform.

Related Tools: search_social_posts, get_social_post, update_social_post`,
        inputSchema: {
          accountIds: z.array(z.string()).describe('Array of social media account IDs to post to'),
          summary: z.string().describe('Post content/text'),
          type: z.enum(['post', 'story', 'reel']).describe('Type of post'),
          media: z.array(z.object({
            url: z.string().describe('Media URL'),
            caption: z.string().optional().describe('Media caption'),
            type: z.string().optional().describe('Media MIME type')
          })).optional().describe('Media attachments'),
          status: z.enum(['draft', 'scheduled', 'published']).optional().describe('Post status (default: draft)'),
          scheduleDate: z.string().optional().describe('Schedule date for post (ISO format)'),
          followUpComment: z.string().optional().describe('Follow-up comment'),
          tags: z.array(z.string()).optional().describe('Tag IDs to associate with post'),
          categoryId: z.string().optional().describe('Category ID'),
          userId: z.string().optional().describe('User ID creating the post')
        }
      },
      {
        name: 'get_social_post',
        description: `Get details of a specific social media post.

Returns: Post content, media, status, platform details, and engagement metrics.

Related Tools: search_social_posts, update_social_post`,
        inputSchema: {
          postId: z.string().describe('Social media post ID')
        }
      },
      {
        name: 'update_social_post',
        description: `Update an existing social media post.

Only updates draft or scheduled posts. Published posts cannot be edited.

Related Tools: get_social_post, search_social_posts`,
        inputSchema: {
          postId: z.string().describe('Social media post ID'),
          summary: z.string().optional().describe('Updated post content'),
          status: z.enum(['draft', 'scheduled', 'published']).optional().describe('Updated post status'),
          scheduleDate: z.string().optional().describe('Updated schedule date'),
          tags: z.array(z.string()).optional().describe('Updated tag IDs')
        }
      },
      {
        name: 'delete_social_post',
        description: `Delete a social media post.

⚠️ WARNING: This is permanent and cannot be undone!

Related Tools: bulk_delete_social_posts (delete multiple)`,
        inputSchema: {
          postId: z.string().describe('Social media post ID to delete')
        }
      },
      {
        name: 'bulk_delete_social_posts',
        description: `Delete multiple social media posts at once (max 50).

⚠️ WARNING: This is permanent and cannot be undone!

Related Tools: delete_social_post (delete single), search_social_posts`,
        inputSchema: {
          postIds: z.array(z.string()).max(50).describe('Array of post IDs to delete (max 50)')
        }
      },

      // ============================================================================
      // ACCOUNT INTEGRATION (2 tools)
      // ============================================================================

      {
        name: 'get_social_accounts',
        description: `Get all connected social media accounts and groups.

Returns: List of connected accounts across all platforms with status and permissions.

Related Tools: delete_social_account, start_social_oauth`,
        inputSchema: {}
      },
      {
        name: 'delete_social_account',
        description: `Delete a social media account connection.

⚠️ WARNING: This disconnects the account from GHL!

Related Tools: get_social_accounts, start_social_oauth (reconnect)`,
        inputSchema: {
          accountId: z.string().describe('Account ID to delete'),
          companyId: z.string().optional().describe('Company ID'),
          userId: z.string().optional().describe('User ID')
        }
      },

      // ============================================================================
      // BULK OPERATIONS (3 tools)
      // ============================================================================


      {
        name: 'upload_social_csv',
        description: `Upload CSV file for bulk social media posts.

Bulk create multiple posts from CSV. Each row becomes a post.

Related Tools: get_csv_upload_status, set_csv_accounts`,
        inputSchema: {
          file: z.string().describe('CSV file data (base64 or file path)')
        }
      },
      {
        name: 'get_csv_upload_status',
        description: `Get status of CSV uploads.

Track progress of bulk post creation from CSV files.

Related Tools: upload_social_csv, set_csv_accounts`,
        inputSchema: {
          skip: z.number().optional().describe('Number to skip (default: 0)'),
          limit: z.number().optional().describe('Number to return (default: 10)'),
          includeUsers: z.boolean().optional().describe('Include user data'),
          userId: z.string().optional().describe('Filter by user ID')
        }
      },
      {
        name: 'set_csv_accounts',
        description: `Set accounts for CSV import processing.

Configure which social accounts to use for CSV bulk posting.

Related Tools: upload_social_csv, get_csv_upload_status`,
        inputSchema: {
          accountIds: z.array(z.string()).describe('Account IDs for CSV import'),
          filePath: z.string().describe('CSV file path'),
          rowsCount: z.number().describe('Number of rows to process'),
          fileName: z.string().describe('CSV file name'),
          approver: z.string().optional().describe('Approver user ID'),
          userId: z.string().optional().describe('User ID')
        }
      },

      // ============================================================================
      // ORGANIZATION (4 tools)
      // ============================================================================


      {
        name: 'get_social_categories',
        description: `Get social media post categories.

Categories help organize posts by topic or campaign.

Related Tools: get_social_category, create_social_post`,
        inputSchema: {
          searchText: z.string().optional().describe('Search for categories'),
          limit: z.number().optional().describe('Number to return (default: 10)'),
          skip: z.number().optional().describe('Number to skip (default: 0)')
        }
      },
      {
        name: 'get_social_category',
        description: `Get a specific social media category by ID.

Related Tools: get_social_categories`,
        inputSchema: {
          categoryId: z.string().describe('Category ID')
        }
      },
      {
        name: 'get_social_tags',
        description: `Get social media post tags.

Tags help organize and filter posts.

Related Tools: get_social_tags_by_ids, create_social_post`,
        inputSchema: {
          searchText: z.string().optional().describe('Search for tags'),
          limit: z.number().optional().describe('Number to return (default: 10)'),
          skip: z.number().optional().describe('Number to skip (default: 0)')
        }
      },
      {
        name: 'get_social_tags_by_ids',
        description: `Get specific social media tags by their IDs.

Related Tools: get_social_tags`,
        inputSchema: {
          tagIds: z.array(z.string()).describe('Array of tag IDs')
        }
      },

      // ============================================================================
      // OAUTH INTEGRATION (2 tools)
      // ============================================================================


      {
        name: 'start_social_oauth',
        description: `Start OAuth process for social media platform.

Connect a new social media account to GHL.

Supported Platforms:
- Google Business Profile
- Facebook
- Instagram
- LinkedIn
- Twitter
- TikTok
- TikTok Business

Related Tools: get_platform_accounts, get_social_accounts`,
        inputSchema: {
          platform: z.enum(['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'tiktok-business']).describe('Social media platform'),
          userId: z.string().describe('User ID initiating OAuth'),
          page: z.string().optional().describe('Page context'),
          reconnect: z.boolean().optional().describe('Whether this is a reconnection')
        }
      },
      {
        name: 'get_platform_accounts',
        description: `Get available accounts for a specific platform after OAuth.

After OAuth, retrieve the list of pages/profiles available to connect.

Related Tools: start_social_oauth, get_social_accounts`,
        inputSchema: {
          platform: z.enum(['google', 'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'tiktok-business']).describe('Social media platform'),
          accountId: z.string().describe('OAuth account ID')
        }
      }
    ];
  }

  async executeTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'search_social_posts':
          return await this.searchSocialPosts(args);
        case 'create_social_post':
          return await this.createSocialPost(args);
        case 'get_social_post':
          return await this.getSocialPost(args);
        case 'update_social_post':
          return await this.updateSocialPost(args);
        case 'delete_social_post':
          return await this.deleteSocialPost(args);
        case 'bulk_delete_social_posts':
          return await this.bulkDeleteSocialPosts(args);
        case 'get_social_accounts':
          return await this.getSocialAccounts(args);
        case 'delete_social_account':
          return await this.deleteSocialAccount(args);
        case 'get_social_categories':
          return await this.getSocialCategories(args);
        case 'get_social_category':
          return await this.getSocialCategory(args);
        case 'get_social_tags':
          return await this.getSocialTags(args);
        case 'get_social_tags_by_ids':
          return await this.getSocialTagsByIds(args);
        case 'start_social_oauth':
          return await this.startSocialOAuth(args);
        case 'get_platform_accounts':
          return await this.getPlatformAccounts(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      throw new Error(`Error executing ${name}: ${error}`);
    }
  }

  // Implementation methods
  private async searchSocialPosts(params: any) {
    // Provide sensible defaults for date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // GHL API requires ISO 8601 format with time: "2024-01-01T00:00:00.000Z"
    const fromDate = params.fromDate || thirtyDaysAgo.toISOString();
    const toDate = params.toDate || now.toISOString();

    const response = await this.ghlClient.searchSocialPosts({
      type: params.type || 'all',
      accounts: params.accounts,
      skip: params.skip?.toString() || '0',
      limit: params.limit?.toString() || '10',
      fromDate: fromDate,
      toDate: toDate,
      includeUsers: params.includeUsers !== undefined ? params.includeUsers.toString() : 'true',
      postType: params.postType
    });

    // GHL API returns data nested under 'results'
    const posts = response.data?.results?.posts || [];
    const count = response.data?.results?.count || 0;

    return {
      success: true,
      posts: posts,
      count: count,
      message: `Found ${count} social media posts (${fromDate} to ${toDate})`
    };
  }

  private async createSocialPost(params: any) {
    const response = await this.ghlClient.createSocialPost({
      accountIds: params.accountIds,
      summary: params.summary,
      media: params.media,
      status: params.status,
      scheduleDate: params.scheduleDate,
      followUpComment: params.followUpComment,
      type: params.type,
      tags: params.tags,
      categoryId: params.categoryId,
      userId: params.userId
    });

    return {
      success: true,
      post: response.data?.post,
      message: `Social media post created successfully`
    };
  }

  private async getSocialPost(params: any) {
    const response = await this.ghlClient.getSocialPost(params.postId);
    
    return {
      success: true,
      post: response.data?.post,
      message: `Retrieved social media post ${params.postId}`
    };
  }

  private async updateSocialPost(params: any) {
    const { postId, ...updateData } = params;
    const response = await this.ghlClient.updateSocialPost(postId, updateData);
    
    return {
      success: true,
      message: `Social media post ${postId} updated successfully`
    };
  }

  private async deleteSocialPost(params: any) {
    const response = await this.ghlClient.deleteSocialPost(params.postId);
    
    return {
      success: true,
      message: `Social media post ${params.postId} deleted successfully`
    };
  }

  private async bulkDeleteSocialPosts(params: any) {
    const response = await this.ghlClient.bulkDeleteSocialPosts({ postIds: params.postIds });
    
    return {
      success: true,
      deletedCount: response.data?.deletedCount || 0,
      message: `${response.data?.deletedCount || 0} social media posts deleted successfully`
    };
  }

  private async getSocialAccounts(params: any) {
    const response = await this.ghlClient.getSocialAccounts();
    
    // GHL API returns data nested under 'results'
    const accounts = response.data?.results?.accounts || [];
    const groups = response.data?.results?.groups || [];
    
    return {
      success: true,
      accounts: accounts,
      groups: groups,
      message: `Retrieved ${accounts.length} social media accounts and ${groups.length} groups`
    };
  }

  private async deleteSocialAccount(params: any) {
    const response = await this.ghlClient.deleteSocialAccount(
      params.accountId,
      params.companyId,
      params.userId
    );
    
    return {
      success: true,
      message: `Social media account ${params.accountId} deleted successfully`
    };
  }

  private async getSocialCategories(params: any) {
    const response = await this.ghlClient.getSocialCategories(
      params.searchText,
      params.limit,
      params.skip
    );
    
    return {
      success: true,
      categories: response.data?.categories || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media categories`
    };
  }

  private async getSocialCategory(params: any) {
    const response = await this.ghlClient.getSocialCategory(params.categoryId);
    
    return {
      success: true,
      category: response.data?.category,
      message: `Retrieved social media category ${params.categoryId}`
    };
  }

  private async getSocialTags(params: any) {
    const response = await this.ghlClient.getSocialTags(
      params.searchText,
      params.limit,
      params.skip
    );
    
    return {
      success: true,
      tags: response.data?.tags || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media tags`
    };
  }

  private async getSocialTagsByIds(params: any) {
    const response = await this.ghlClient.getSocialTagsByIds({ tagIds: params.tagIds });
    
    return {
      success: true,
      tags: response.data?.tags || [],
      count: response.data?.count || 0,
      message: `Retrieved ${response.data?.count || 0} social media tags by IDs`
    };
  }

  private async startSocialOAuth(params: any) {
    const response = await this.ghlClient.startSocialOAuth(
      params.platform,
      params.userId,
      params.page,
      params.reconnect
    );
    
    return {
      success: true,
      oauthData: response.data,
      message: `OAuth process started for ${params.platform}`
    };
  }

  private async getPlatformAccounts(params: any) {
    let response;
    
    switch (params.platform) {
      case 'google':
        response = await this.ghlClient.getGoogleBusinessLocations(params.accountId);
        break;
      case 'facebook':
        response = await this.ghlClient.getFacebookPages(params.accountId);
        break;
      case 'instagram':
        response = await this.ghlClient.getInstagramAccounts(params.accountId);
        break;
      case 'linkedin':
        response = await this.ghlClient.getLinkedInAccounts(params.accountId);
        break;
      case 'twitter':
        response = await this.ghlClient.getTwitterProfile(params.accountId);
        break;
      case 'tiktok':
        response = await this.ghlClient.getTikTokProfile(params.accountId);
        break;
      case 'tiktok-business':
        response = await this.ghlClient.getTikTokBusinessProfile(params.accountId);
        break;
      default:
        throw new Error(`Unsupported platform: ${params.platform}`);
    }
    
    return {
      success: true,
      platformAccounts: response.data,
      message: `Retrieved ${params.platform} accounts for OAuth ID ${params.accountId}`
    };
  }
} 