/**
 * GoHighLevel Media Library Tools
 * Implements media file management functionality
 * 
 * IMPORTANT: Follows lessons learned from calendar-tools fix:
 * - Always use this.ghlClient.getConfig().locationId as fallback (never empty string)
 * - Return response.data (unwrapped) not response
 * - Comprehensive error handling for all HTTP codes
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

/**
 * MediaTools class for GoHighLevel Media Library API endpoints
 * Handles file management operations including listing, uploading, and deleting files/folders
 */
export class MediaTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get all available Media Library tool definitions
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'get_media_files',
        description: `Search and retrieve files from the media library.

**Optimized for Search & Retrieval** - Find specific files quickly to get their URLs.

Use Cases:
- Search for files by name (e.g., "Find the logo image")
- Get file URLs for use in posts, emails, etc.
- List files in a specific folder
- Browse media library (files + folders)

Smart Behavior:
- No type specified → Returns BOTH files AND folders (limit 10 each) - "Hybrid View"
- With query → Searches files only (type='file')
- type='file' → Returns only files
- type='folder' → Returns only folders

Returns: 
- If type specified: { files: [...] } or { folders: [...] }
- If no type (Hybrid View): { files: [...], folders: [...] }

Example: "Find image named 'logo'" → Use query='logo'

Related Tools: upload_media_file, delete_media_file`,
        inputSchema: {
          query: z.string().optional().describe('Search term to find files by name (e.g., "logo", "banner"). When provided, searches for files only.'),
          parentId: z.string().optional().describe('Folder ID to list contents within.'),
          type: z.enum(['file', 'folder']).optional().describe('Filter by type. If omitted, returns BOTH files and folders (Hybrid View).'),
          limit: z.number().min(1).max(100).optional().describe('Number of results per type (default: 10, max: 100)'),
          offset: z.number().min(0).optional().describe('Number of results to skip for pagination (default: 0)'),
          sortBy: z.string().optional().describe('Field to sort by: createdAt, name, size (default: createdAt)'),
          sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort direction (default: desc)')
        }
      },
      {
        name: 'upload_media_file',
        description: `Upload a file to the media library or add a hosted file URL.

⚠️ Max file size: 25MB for direct uploads

Two upload modes:
1. Direct upload: Provide file data
2. Hosted URL: Provide fileUrl (set hosted=true)

💡 For hosted URLs: ALWAYS provide contentType (e.g., 'image/png') to avoid "Unable to determine content type" errors.

Use Cases:
- Upload images for social posts
- Store documents
- Add hosted files by URL
- Organize files in folders

Returns: Uploaded file with URL and metadata.

Related Tools: get_media_files, delete_media_file`,
        inputSchema: {
          fileUrl: z.string().optional().describe('URL of hosted file (required if hosted=true)'),
          hosted: z.boolean().optional().describe('Set to true if providing a fileUrl (default: false)'),
          contentType: z.string().optional().describe('MIME type of the file (e.g., "image/png", "image/jpeg", "application/pdf"). REQUIRED for hosted URLs to avoid content type errors.'),
          name: z.string().optional().describe('Custom name for the file (e.g., "logo.png")'),
          file: z.string().optional().describe('File data (binary) for direct upload'),
          parentId: z.string().optional().describe('Parent folder ID to upload into'),
          altType: z.enum(['location', 'agency']).optional().describe('Context type (default: location)'),
          altId: z.string().optional().describe('Location or Agency ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_media_file',
        description: `Delete a specific file or folder from the media library.

⚠️ WARNING: This is permanent and cannot be undone!
⚠️ Deleting a folder deletes all files inside it!

Related Tools: get_media_files, upload_media_file`,
        inputSchema: {
          id: z.string().describe('ID of the file or folder to delete'),
          altType: z.enum(['location', 'agency']).optional().describe('Context type (default: location)'),
          altId: z.string().optional().describe('Location or Agency ID (uses default if not provided)')
        }
      }
    ];
  }

  /**
   * Execute a media tool by name with given arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_media_files':
        return await this.getMediaFiles(args);
      
      case 'upload_media_file':
        return await this.uploadMediaFile(args);
      
      case 'delete_media_file':
        return await this.deleteMediaFile(args);
      
      default:
        throw new Error(`Unknown media tool: ${name}`);
    }
  }

  /**
   * GET MEDIA FILES - Hybrid View Support
   */
  private async getMediaFiles(params: any = {}): Promise<{ success: boolean; files?: any[]; folders?: any[]; total?: number; message: string }> {
    try {
      const baseParams: any = {
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
        limit: params.limit || 10,
        offset: params.offset || 0,
        altType: params.altType || 'location',
        altId: params.altId || this.ghlClient.getConfig().locationId,
        ...(params.parentId && { parentId: params.parentId })
      };

      // If query is provided, always search for files only
      if (params.query) {
        const response = await this.ghlClient.getMediaFiles({
          ...baseParams,
          type: 'file',
          query: params.query
        });
        
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Unknown API error');
        }

        const files = Array.isArray(response.data.files) ? response.data.files : [];
        return {
          success: true,
          files,
          total: response.data.total,
          message: `Found ${files.length} files matching "${params.query}"`
        };
      }

      // If type is specified, return only that type
      if (params.type) {
        const response = await this.ghlClient.getMediaFiles({
          ...baseParams,
          type: params.type
        });
        
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Unknown API error');
        }

        const items = Array.isArray(response.data.files) ? response.data.files : [];
        
        if (params.type === 'folder') {
          return {
            success: true,
            folders: items,
            total: response.data.total,
            message: `Retrieved ${items.length} folders`
          };
        } else {
          return {
            success: true,
            files: items,
            total: response.data.total,
            message: `Retrieved ${items.length} files`
          };
        }
      }

      // HYBRID VIEW: No type specified - fetch BOTH files and folders in parallel
      const [filesResponse, foldersResponse] = await Promise.all([
        this.ghlClient.getMediaFiles({ ...baseParams, type: 'file' }),
        this.ghlClient.getMediaFiles({ ...baseParams, type: 'folder' })
      ]);

      const files = filesResponse.success && filesResponse.data?.files 
        ? filesResponse.data.files : [];
      const folders = foldersResponse.success && foldersResponse.data?.files 
        ? foldersResponse.data.files : [];

      return {
        success: true,
        files,
        folders,
        message: `Retrieved ${files.length} files and ${folders.length} folders`
      };
    } catch (error) {
      throw new Error(`Failed to get media files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPLOAD MEDIA FILE
   */
  private async uploadMediaFile(params: any): Promise<{ success: boolean; fileId: string; url?: string; message: string }> {
    try {
      // Validate upload parameters
      if (params.hosted && !params.fileUrl) {
        throw new Error('fileUrl is required when hosted=true');
      }
      if (!params.hosted && !params.file) {
        throw new Error('file is required when hosted=false or not specified');
      }

      const uploadData: any = {
        altType: params.altType || 'location',
        altId: params.altId || this.ghlClient.getConfig().locationId,
        ...(params.hosted !== undefined && { hosted: params.hosted }),
        ...(params.fileUrl && { fileUrl: params.fileUrl }),
        ...(params.file && { file: params.file }),
        ...(params.name && { name: params.name }),
        ...(params.parentId && { parentId: params.parentId }),
        ...(params.contentType && { contentType: params.contentType })
      };

      const response = await this.ghlClient.uploadMediaFile(uploadData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        fileId: response.data.fileId,
        url: response.data.url,
        message: `File uploaded successfully with ID: ${response.data.fileId}`
      };
    } catch (error) {
      throw new Error(`Failed to upload media file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * DELETE MEDIA FILE
   */
  private async deleteMediaFile(params: any): Promise<{ success: boolean; message: string }> {
    try {
      const deleteParams: any = {
        id: params.id,
        altType: params.altType || 'location',
        altId: params.altId || this.ghlClient.getConfig().locationId
      };

      const response = await this.ghlClient.deleteMediaFile(deleteParams);
      
      if (!response.success) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        message: `Media file/folder deleted successfully`
      };
    } catch (error) {
      throw new Error(`Failed to delete media file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 