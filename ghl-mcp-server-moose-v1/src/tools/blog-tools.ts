/**
 * GoHighLevel Blog Tools
 * Implements all blog management functionality for the MCP server
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPCreateBlogPostParams,
  MCPUpdateBlogPostParams,
  MCPGetBlogPostsParams,
  MCPGetBlogSitesParams,
  MCPGetBlogAuthorsParams,
  MCPGetBlogCategoriesParams,
  MCPCheckUrlSlugParams,
  GHLBlogPostStatus,
  GHLBlogPost,
  GHLBlogSite,
  GHLBlogAuthor,
  GHLBlogCategory
} from '../types/ghl-types.js';

/**
 * Blog Tools Class
 * Implements MCP tools for blog management
 */
export class BlogTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all blog operations
   */
  getToolDefinitions(): any[] {
    return [
  // 1. Create Blog Post
  {
    name: 'create_blog_post',
    description: `Create a new blog post in GoHighLevel with SEO optimization.

Features:
- Supports HTML content formatting
- Auto-generates URL slug if not provided
- SEO meta description and canonical link support
- Category and tag support
- Author attribution
- Publication scheduling

Requirements:
- Blog ID (use get_blog_sites to find available blogs)
- Author ID (use get_blog_authors to find available authors)
- Category IDs (use get_blog_categories to find available categories)

Best Practice: Use check_url_slug first to ensure slug availability.`,
    inputSchema: {
      title: z.string().describe('Blog post title'),
      blogId: z.string().describe('Blog site ID (use get_blog_sites to find available blogs)'),
      content: z.string().describe('Full HTML content of the blog post'),
      description: z.string().describe('Short description/excerpt of the blog post'),
      imageUrl: z.string().describe('URL of the featured image for the blog post'),
      imageAltText: z.string().describe('Alt text for the featured image (for SEO and accessibility)'),
      urlSlug: z.string().describe('URL slug for the blog post (use check_url_slug to verify availability)'),
      author: z.string().describe('Author ID (use get_blog_authors to find available authors)'),
      categories: z.array(z.string()).describe('Array of category IDs (use get_blog_categories to find available categories)'),
      tags: z.array(z.string()).optional().describe('Optional array of tags for the blog post'),
      status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional().describe('Publication status of the blog post (default: DRAFT)'),
      canonicalLink: z.string().optional().describe('Optional canonical URL for SEO'),
      publishedAt: z.string().optional().describe('Optional ISO timestamp for publication date (defaults to now for PUBLISHED status)')
    }
  },

  // 2. Update Blog Post
  {
    name: 'update_blog_post',
    description: `Update an existing blog post in GoHighLevel. All fields except postId and blogId are optional.

Best Practice: Use check_url_slug before updating the slug to ensure availability.`,
    inputSchema: {
      postId: z.string().describe('Blog post ID to update'),
      blogId: z.string().describe('Blog site ID that contains the post'),
      title: z.string().optional().describe('Updated blog post title'),
      content: z.string().optional().describe('Updated HTML content of the blog post'),
      description: z.string().optional().describe('Updated description/excerpt of the blog post'),
      imageUrl: z.string().optional().describe('Updated featured image URL'),
      imageAltText: z.string().optional().describe('Updated alt text for the featured image'),
      urlSlug: z.string().optional().describe('Updated URL slug (use check_url_slug to verify availability)'),
      author: z.string().optional().describe('Updated author ID'),
      categories: z.array(z.string()).optional().describe('Updated array of category IDs'),
      tags: z.array(z.string()).optional().describe('Updated array of tags'),
      status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional().describe('Updated publication status'),
      canonicalLink: z.string().optional().describe('Updated canonical URL'),
      publishedAt: z.string().optional().describe('Updated ISO timestamp for publication date')
    }
  },

  // 3. Get Blog Posts
  {
    name: 'get_blog_posts',
    description: 'Get blog posts from a specific blog site. Use this to list and search existing blog posts.',
    inputSchema: {
      blogId: z.string().describe('Blog site ID to get posts from (use get_blog_sites to find available blogs)'),
      limit: z.number().min(1).max(100).optional().describe('Number of posts to retrieve (default: 10, max recommended: 50)'),
      offset: z.number().min(0).optional().describe('Number of posts to skip for pagination (default: 0)'),
      searchTerm: z.string().optional().describe('Optional search term to filter posts by title or content'),
      status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional().describe('Optional filter by publication status')
    }
  },

  // 4. Get Blog Sites
  {
    name: 'get_blog_sites',
    description: 'Get all blog sites for the current location. Use this to find available blogs before creating or managing posts.',
    inputSchema: {
      limit: z.number().min(1).max(100).optional().describe('Number of blogs to retrieve (default: 10)'),
      skip: z.number().min(0).optional().describe('Number of blogs to skip for pagination (default: 0)'),
      searchTerm: z.string().optional().describe('Optional search term to filter blogs by name')
    }
  },

  // 5. Get Blog Authors
  {
    name: 'get_blog_authors',
    description: 'Get all available blog authors for the current location. Use this to find author IDs for creating blog posts.',
    inputSchema: {
      limit: z.number().min(1).max(100).optional().describe('Number of authors to retrieve (default: 10)'),
      offset: z.number().min(0).optional().describe('Number of authors to skip for pagination (default: 0)')
    }
  },

  // 6. Get Blog Categories
  {
    name: 'get_blog_categories',
    description: 'Get all available blog categories for the current location. Use this to find category IDs for creating blog posts.',
    inputSchema: {
      limit: z.number().min(1).max(100).optional().describe('Number of categories to retrieve (default: 10)'),
      offset: z.number().min(0).optional().describe('Number of categories to skip for pagination (default: 0)')
    }
  },

  // 7. Check URL Slug
  {
    name: 'check_url_slug',
    description: 'Check if a URL slug is available for use. Use this before creating or updating blog posts to ensure unique URLs.',
    inputSchema: {
      urlSlug: z.string().describe('URL slug to check for availability'),
      postId: z.string().optional().describe('Optional post ID when updating an existing post (to exclude itself from the check)')
    }
  }
    ];
  }

  /**
   * Execute blog tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'create_blog_post':
        return this.createBlogPost(args as MCPCreateBlogPostParams);
      
      case 'update_blog_post':
        return this.updateBlogPost(args as MCPUpdateBlogPostParams);
      
      case 'get_blog_posts':
        return this.getBlogPosts(args as MCPGetBlogPostsParams);
      
      case 'get_blog_sites':
        return this.getBlogSites(args as MCPGetBlogSitesParams);
      
      case 'get_blog_authors':
        return this.getBlogAuthors(args as MCPGetBlogAuthorsParams);
      
      case 'get_blog_categories':
        return this.getBlogCategories(args as MCPGetBlogCategoriesParams);
      
      case 'check_url_slug':
        return this.checkUrlSlug(args as MCPCheckUrlSlugParams);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * CREATE BLOG POST
   */
  private async createBlogPost(params: MCPCreateBlogPostParams): Promise<{ success: boolean; blogPost: GHLBlogPost; message: string }> {
    try {
      // Set default publishedAt if status is PUBLISHED and no date provided
      let publishedAt = params.publishedAt;
      if (!publishedAt && params.status === 'PUBLISHED') {
        publishedAt = new Date().toISOString();
      } else if (!publishedAt) {
        publishedAt = new Date().toISOString(); // Always provide a date
      }

      const blogPostData = {
        title: params.title,
        locationId: this.ghlClient.getConfig().locationId,
        blogId: params.blogId,
        imageUrl: params.imageUrl,
        description: params.description,
        rawHTML: params.content,
        status: (params.status as GHLBlogPostStatus) || 'DRAFT',
        imageAltText: params.imageAltText,
        categories: params.categories,
        tags: params.tags || [],
        author: params.author,
        urlSlug: params.urlSlug,
        canonicalLink: params.canonicalLink,
        publishedAt: publishedAt
      };

      const result = await this.ghlClient.createBlogPost(blogPostData);
      
      if (result.success && result.data) {
        return {
          success: true,
          blogPost: result.data.data,
          message: `Blog post "${params.title}" created successfully with ID: ${result.data.data._id}`
        };
      } else {
        throw new Error('Failed to create blog post - no data returned');
      }
    } catch (error: any) {
      // Check for duplicate slug error (409 Conflict)
      if (error.message?.includes('(409)') || error.message?.includes('slug') || error.message?.includes('already exists')) {
        throw new Error(`Blog post slug already exists: "${params.urlSlug}"

The URL slug you provided is already in use by another blog post.

Solutions:
1. Use check_url_slug tool to find an available slug
2. Choose a different slug manually
3. Let GHL auto-generate a slug by using a unique title

Original error: ${error.message}`);
      }
      
      throw new Error(`Failed to create blog post: ${error}`);
    }
  }

  /**
   * UPDATE BLOG POST
   */
  private async updateBlogPost(params: MCPUpdateBlogPostParams): Promise<{ success: boolean; blogPost: GHLBlogPost; message: string }> {
    try {
      const updateData: any = {
        locationId: this.ghlClient.getConfig().locationId,
        blogId: params.blogId
      };

      // Only include fields that are provided
      if (params.title) updateData.title = params.title;
      if (params.content) updateData.rawHTML = params.content;
      if (params.description) updateData.description = params.description;
      if (params.imageUrl) updateData.imageUrl = params.imageUrl;
      if (params.imageAltText) updateData.imageAltText = params.imageAltText;
      if (params.urlSlug) updateData.urlSlug = params.urlSlug;
      if (params.author) updateData.author = params.author;
      if (params.categories) updateData.categories = params.categories;
      if (params.tags) updateData.tags = params.tags;
      if (params.status) updateData.status = params.status;
      if (params.canonicalLink) updateData.canonicalLink = params.canonicalLink;
      if (params.publishedAt) updateData.publishedAt = params.publishedAt;

      const result = await this.ghlClient.updateBlogPost(params.postId, updateData);
      
      if (result.success && result.data) {
        return {
          success: true,
          blogPost: result.data.updatedBlogPost,
          message: `Blog post updated successfully`
        };
      } else {
        throw new Error('Failed to update blog post - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to update blog post: ${error}`);
    }
  }

  /**
   * GET BLOG POSTS
   */
  private async getBlogPosts(params: MCPGetBlogPostsParams): Promise<{ success: boolean; posts: GHLBlogPost[]; count: number; message: string }> {
    try {
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        blogId: params.blogId,
        limit: params.limit || 10,
        offset: params.offset || 0,
        searchTerm: params.searchTerm,
        status: params.status
      };

      const result = await this.ghlClient.getBlogPosts(searchParams);
      
      if (result.success && result.data) {
        const posts = result.data.blogs || [];
        return {
          success: true,
          posts: posts,
          count: posts.length,
          message: `Retrieved ${posts.length} blog posts from blog ${params.blogId}`
        };
      } else {
        throw new Error('Failed to get blog posts - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to get blog posts: ${error}`);
    }
  }

  /**
   * GET BLOG SITES
   */
  private async getBlogSites(params: MCPGetBlogSitesParams): Promise<{ success: boolean; sites: GHLBlogSite[]; count: number; message: string }> {
    try {
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        skip: params.skip || 0,
        limit: params.limit || 10,
        searchTerm: params.searchTerm
      };

      const result = await this.ghlClient.getBlogSites(searchParams);
      
      if (result.success && result.data) {
        const sites = result.data.data || [];
        return {
          success: true,
          sites: sites,
          count: sites.length,
          message: `Retrieved ${sites.length} blog sites`
        };
      } else {
        throw new Error('Failed to get blog sites - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to get blog sites: ${error}`);
    }
  }

  /**
   * GET BLOG AUTHORS
   */
  private async getBlogAuthors(params: MCPGetBlogAuthorsParams): Promise<{ success: boolean; authors: GHLBlogAuthor[]; count: number; message: string }> {
    try {
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        limit: params.limit || 10,
        offset: params.offset || 0
      };

      const result = await this.ghlClient.getBlogAuthors(searchParams);
      
      if (result.success && result.data) {
        const authors = result.data.authors || [];
        return {
          success: true,
          authors: authors,
          count: authors.length,
          message: `Retrieved ${authors.length} blog authors`
        };
      } else {
        throw new Error('Failed to get blog authors - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to get blog authors: ${error}`);
    }
  }

  /**
   * GET BLOG CATEGORIES
   */
  private async getBlogCategories(params: MCPGetBlogCategoriesParams): Promise<{ success: boolean; categories: GHLBlogCategory[]; count: number; message: string }> {
    try {
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        limit: params.limit || 10,
        offset: params.offset || 0
      };

      const result = await this.ghlClient.getBlogCategories(searchParams);
      
      if (result.success && result.data) {
        const categories = result.data.categories || [];
        return {
          success: true,
          categories: categories,
          count: categories.length,
          message: `Retrieved ${categories.length} blog categories`
        };
      } else {
        throw new Error('Failed to get blog categories - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to get blog categories: ${error}`);
    }
  }

  /**
   * CHECK URL SLUG
   */
  private async checkUrlSlug(params: MCPCheckUrlSlugParams): Promise<{ success: boolean; urlSlug: string; exists: boolean; available: boolean; message: string }> {
    try {
      const checkParams = {
        locationId: this.ghlClient.getConfig().locationId,
        urlSlug: params.urlSlug,
        postId: params.postId
      };

      const result = await this.ghlClient.checkUrlSlugExists(checkParams);
      
      if (result.success && result.data !== undefined) {
        const exists = result.data.exists;
        return {
          success: true,
          urlSlug: params.urlSlug,
          exists: exists,
          available: !exists,
          message: exists 
            ? `URL slug "${params.urlSlug}" is already in use` 
            : `URL slug "${params.urlSlug}" is available`
        };
      } else {
        throw new Error('Failed to check URL slug - no data returned');
      }
    } catch (error) {
      throw new Error(`Failed to check URL slug: ${error}`);
    }
  }
} 