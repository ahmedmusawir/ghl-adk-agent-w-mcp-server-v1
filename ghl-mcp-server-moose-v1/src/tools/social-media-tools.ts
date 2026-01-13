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
        description: `Create a social media post for one or more connected accounts.

Supports Facebook, Instagram, LinkedIn, TikTok, Twitter, and Google My Business. Posts can be published immediately, scheduled for later, or saved as drafts.

Use get_social_accounts to retrieve valid account IDs before creating posts.

Required Parameters:
- accountIds: Array of social account IDs (get from get_social_accounts)
- summary: Post content/caption

Optional Parameters:
- media: Array of media attachments with URLs
- status: "draft", "scheduled", or "published" (default: "published")
- scheduleDate: ISO 8601 datetime for scheduled posts
- type: "post", "story", or "reel" (default: "post")
- followUpComment: Auto-comment after posting
- tags: Array of tag IDs for organization
- categoryId: Category ID for organization
- tiktokPostDetails: TikTok-specific settings (privacy, comments, etc.)
- gmbPostDetails: Google My Business-specific settings (events, offers)
- createdBy: User ID who created the post

Examples:
1. Simple text post: {accountIds: ["..."], summary: "Hello World"}
2. Post with media: {accountIds: ["..."], summary: "Check this out!", media: [{url: "https://..."}]}
3. Scheduled post: {accountIds: ["..."], summary: "...", status: "scheduled", scheduleDate: "2025-10-24T14:00:00.000Z"}

Returns: Created post with ID and platform details.

Related Tools: search_social_posts, get_social_post, update_social_post, get_social_accounts`,
        inputSchema: {
          accountIds: z.array(z.string()).describe('Array of social media account IDs to post to (get from get_social_accounts)'),
          summary: z.string().describe('Post content/caption text'),
          type: z.enum(['post', 'story', 'reel']).optional().describe('Type of content (default: "post")'),
          media: z.array(z.object({
            url: z.string().describe('Media URL (must be publicly accessible)'),
            caption: z.string().optional().describe('Media caption'),
            type: z.string().optional().describe('Media MIME type (e.g., "image/png", "video/mp4")')
          })).optional().describe('Media attachments (images/videos)'),
          status: z.enum(['draft', 'scheduled', 'published']).optional().describe('Post status (default: "published")'),
          scheduleDate: z.string().optional().describe('Schedule date in ISO 8601 format (e.g., "2025-10-24T14:00:00.000Z")'),
          followUpComment: z.string().optional().describe('Auto-comment to post after publishing'),
          tags: z.array(z.string()).optional().describe('Array of tag IDs to associate with post'),
          categoryId: z.string().optional().describe('Category ID for organization'),
          createdBy: z.string().optional().describe('User ID who created the post'),
          tiktokPostDetails: z.object({
            privacyLevel: z.string().optional().describe('Privacy level (e.g., "PUBLIC_TO_EVERYONE")'),
            promoteOtherBrand: z.boolean().optional(),
            enableComment: z.boolean().optional(),
            enableDuet: z.boolean().optional(),
            enableStitch: z.boolean().optional(),
            videoDisclosure: z.boolean().optional(),
            promoteYourBrand: z.boolean().optional()
          }).optional().describe('TikTok-specific post settings (only for TikTok accounts)'),
          gmbPostDetails: z.object({
            gmbEventType: z.enum(['STANDARD', 'EVENT', 'OFFER']).optional(),
            title: z.string().optional(),
            actionType: z.enum(['book', 'order', 'shop', 'learn_more', 'sign_up', 'call']).optional()
          }).optional().describe('Google My Business-specific settings (only for GMB accounts)')
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

⚠️ ⚠️ ⚠️ CRITICAL LIMITATIONS - READ THIS FIRST ⚠️ ⚠️ ⚠️

GHL ONLY allows editing posts that are:
1. In DRAFT status (not yet published)
2. SCHEDULED for the future (not yet published)

PUBLISHED POSTS CANNOT BE EDITED - the API will reject the update!

🔄 IMPORTANT GHL BEHAVIOR - SCHEDULED POSTS:
When you update a SCHEDULED post, GHL automatically changes its status to DRAFT!
This means:
1. Update scheduled post → Status changes to "draft"
2. Post is NO LONGER scheduled (loses schedule date)
3. You must RESCHEDULE it by setting scheduleDate + status: "scheduled"

WORKFLOW for editing scheduled posts:
1. Update the post content (it becomes draft automatically)
2. Reschedule it: Set scheduleDate + status: "scheduled" + scheduleTimeUpdated: true

WORKAROUND for editing published posts:
If you need to edit a published post, you must:
1. Delete the published post using delete_social_post
2. Create a new post with the updated content using create_social_post

This is a GHL platform limitation, not an MCP limitation.

---

Use this tool to edit draft or scheduled posts before they go live. Useful for fixing typos, rescheduling, adding media, or changing which accounts a post will be published to.

Required Parameters:
- postId: Post ID to update (from search_social_posts or create_social_post)
- accountIds: Array of social account IDs
- summary: Post content/caption

Optional Parameters:
- media: Array of media attachments
- status: "draft", "scheduled", or "published"
- scheduleDate: ISO 8601 datetime for scheduled posts
- type: "post", "story", or "reel"
- followUpComment: Auto-comment after posting
- tags: Array of tag IDs
- categoryId: Category ID
- scheduleTimeUpdated: Set to true when changing schedule time
- tiktokPostDetails: TikTok-specific settings
- gmbPostDetails: Google My Business settings

Examples:
1. Update draft content: {postId: "...", accountIds: [...], summary: "Updated text"}
2. Reschedule future post: {postId: "...", accountIds: [...], summary: "...", scheduleDate: "2025-10-27T14:00:00.000Z", scheduleTimeUpdated: true}
3. Add media to draft: {postId: "...", accountIds: [...], summary: "...", media: [{url: "https://..."}]}

Related Tools: get_social_post, search_social_posts, create_social_post, delete_social_post`,
        inputSchema: {
          postId: z.string().describe('Social media post ID to update'),
          accountIds: z.array(z.string()).describe('Array of social media account IDs'),
          summary: z.string().describe('Post content/caption text'),
          type: z.enum(['post', 'story', 'reel']).optional().describe('Type of content'),
          media: z.array(z.object({
            url: z.string().describe('Media URL'),
            caption: z.string().optional().describe('Media caption'),
            type: z.string().optional().describe('Media MIME type')
          })).optional().describe('Media attachments'),
          status: z.enum(['draft', 'scheduled', 'published']).optional().describe('Post status'),
          scheduleDate: z.string().optional().describe('Schedule date in ISO 8601 format'),
          followUpComment: z.string().optional().describe('Auto-comment after posting'),
          tags: z.array(z.string()).optional().describe('Array of tag IDs'),
          categoryId: z.string().optional().describe('Category ID'),
          scheduleTimeUpdated: z.boolean().optional().describe('Set to true when changing schedule time'),
          userId: z.string().optional().describe('User ID'),
          tiktokPostDetails: z.object({
            privacyLevel: z.string().optional(),
            promoteOtherBrand: z.boolean().optional(),
            enableComment: z.boolean().optional(),
            enableDuet: z.boolean().optional(),
            enableStitch: z.boolean().optional(),
            videoDisclosure: z.boolean().optional(),
            promoteYourBrand: z.boolean().optional()
          }).optional().describe('TikTok-specific settings'),
          gmbPostDetails: z.object({
            gmbEventType: z.enum(['STANDARD', 'EVENT', 'OFFER']).optional(),
            title: z.string().optional(),
            actionType: z.enum(['book', 'order', 'shop', 'learn_more', 'sign_up', 'call']).optional()
          }).optional().describe('Google My Business settings')
        }
      },
      {
        name: 'delete_social_post',
        description: `Delete a social media post by ID.

⚠️ ⚠️ ⚠️ WARNING: PERMANENT DELETION - CANNOT BE UNDONE! ⚠️ ⚠️ ⚠️

Can delete posts in any status:
- ✅ DRAFT posts (removes from GHL)
- ✅ SCHEDULED posts (prevents publishing and removes from GHL)
- ✅ PUBLISHED posts (removes from GHL, but may not remove from actual social platforms)

IMPORTANT NOTES:
1. Deletion is permanent and irreversible
2. For published posts, this removes the post from GHL's system but may NOT remove it from Facebook, Instagram, LinkedIn, etc.
3. To remove from actual social platforms, you may need to delete directly on those platforms
4. Deleting a scheduled post will prevent it from being published

USE CASES:
- Remove draft posts that are no longer needed
- Cancel scheduled posts before they publish
- Clean up posts from GHL (note: won't remove from social platforms)
- Part of "edit published post" workaround (delete + recreate)

Get post IDs from search_social_posts or create_social_post.

Related Tools: bulk_delete_social_posts (delete multiple), create_social_post, update_social_post`,
        inputSchema: {
          postId: z.string().describe('Social media post ID to delete (24-character MongoDB ObjectId)')
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
    // Provide sensible defaults for date range
    const now = new Date();
    let fromDate: string;
    let toDate: string;
    
    // IMPORTANT: Different post types need different date ranges!
    if (params.type === 'scheduled') {
      // For scheduled posts, search FORWARD in time (future dates)
      fromDate = params.fromDate || now.toISOString();
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      toDate = params.toDate || oneYearFromNow.toISOString();
    } else if (params.type === 'draft') {
      // For draft posts, search WIDE range (could be created anytime)
      // Search from 1 year ago to 1 year in future to catch all drafts
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      fromDate = params.fromDate || oneYearAgo.toISOString();
      toDate = params.toDate || oneYearFromNow.toISOString();
    } else {
      // For other types (published, failed, etc.), search last 30 days (backward in time)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      fromDate = params.fromDate || thirtyDaysAgo.toISOString();
      toDate = params.toDate || now.toISOString();
    }

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
    // Build request body with all provided parameters
    // IMPORTANT: GHL API requires media as array (even if empty), userId AND createdBy as non-empty strings
    const requestBody: any = {
      accountIds: params.accountIds,
      summary: params.summary,
      type: params.type || 'post', // Default to 'post' if not specified
      media: params.media || [], // Must be array, default to empty
      userId: params.userId || params.createdBy || 'mcp-server', // Required by API
      createdBy: params.createdBy || params.userId || 'mcp-server' // Also required!
    };

    // Add optional fields if provided
    if (params.status) requestBody.status = params.status;
    if (params.scheduleDate) requestBody.scheduleDate = params.scheduleDate;
    if (params.followUpComment) requestBody.followUpComment = params.followUpComment;
    if (params.tags) requestBody.tags = params.tags;
    if (params.categoryId) requestBody.categoryId = params.categoryId;
    if (params.tiktokPostDetails) requestBody.tiktokPostDetails = params.tiktokPostDetails;
    if (params.gmbPostDetails) requestBody.gmbPostDetails = params.gmbPostDetails;

    const response = await this.ghlClient.createSocialPost(requestBody);

    // GHL API likely returns data nested under 'results' (following pattern)
    const post = response.data?.results?.post || response.data?.post;

    return {
      success: true,
      post: post,
      postId: post?._id,
      message: `Social media post created successfully${params.status === 'scheduled' ? ' and scheduled' : params.status === 'draft' ? ' as draft' : ''}`
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
    const { postId, ...updateFields } = params;
    
    // CRITICAL: Get existing post first to preserve status if not explicitly changed
    const existingPostResponse = await this.ghlClient.getSocialPost(postId);
    const existingPost = existingPostResponse.data?.post;
    
    // Build request body similar to create_social_post
    // IMPORTANT: GHL API requires media as array (even if empty), userId AND createdBy as non-empty strings
    // CRITICAL: Must preserve existing status if not explicitly provided to prevent accidental publishing!
    const requestBody: any = {
      accountIds: updateFields.accountIds,
      summary: updateFields.summary,
      type: updateFields.type || existingPost?.type || 'post',
      media: updateFields.media || existingPost?.media || [], // Must be array, default to empty
      userId: updateFields.userId || 'mcp-server', // Required by API
      createdBy: updateFields.createdBy || updateFields.userId || 'mcp-server', // Also required!
      status: updateFields.status || existingPost?.status || 'draft' // CRITICAL: Preserve existing status!
    };

    // Add optional fields if provided
    if (updateFields.scheduleDate) requestBody.scheduleDate = updateFields.scheduleDate;
    if (updateFields.followUpComment) requestBody.followUpComment = updateFields.followUpComment;
    if (updateFields.tags) requestBody.tags = updateFields.tags;
    if (updateFields.categoryId) requestBody.categoryId = updateFields.categoryId;
    if (updateFields.scheduleTimeUpdated !== undefined) requestBody.scheduleTimeUpdated = updateFields.scheduleTimeUpdated;
    if (updateFields.tiktokPostDetails) requestBody.tiktokPostDetails = updateFields.tiktokPostDetails;
    if (updateFields.gmbPostDetails) requestBody.gmbPostDetails = updateFields.gmbPostDetails;
    
    // If existing post has scheduleDate and we're not changing it, preserve it
    if (!updateFields.scheduleDate && existingPost?.scheduleDate) {
      requestBody.scheduleDate = existingPost.scheduleDate;
    }

    const response = await this.ghlClient.updateSocialPost(postId, requestBody);
    
    // GHL API likely returns data nested under 'results' (following pattern)
    const post = response.data?.results?.post || response.data?.post;
    
    return {
      success: true,
      post: post,
      postId: post?._id,
      message: `Social media post updated successfully${updateFields.scheduleDate ? ' and rescheduled' : ''}`
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