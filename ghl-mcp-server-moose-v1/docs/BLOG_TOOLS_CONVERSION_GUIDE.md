# Blog Tools Conversion Guide - JSON Schema to Zod

## ⚠️ Status: READY FOR CONVERSION

The blog-tools.ts file is ready to be converted from JSON Schema to Zod Schema format, following the established patterns from contact-tools.ts and conversation-tools.ts.

---

## 📋 Overview

**File to Convert:** `/src/tools/blog-tools.ts`  
**Reference Files:**
- `/src/tools/contact-tools.ts` - Pattern reference
- `/src/tools/conversation-tools.ts` - Error handling reference

**Tools to Convert:** 7 blog management tools

---

## 🔧 Step-by-Step Conversion Plan

### Step 1: Update Imports

**Current:**
```typescript
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { GHLApiClient } from '../clients/ghl-api-client.js';
```

**New:**
```typescript
import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
```

**Changes:**
- Remove `Tool` import
- Add `z` (Zod) import

---

### Step 2: Update Return Type

**Current:**
```typescript
getToolDefinitions(): Tool[] {
```

**New:**
```typescript
getToolDefinitions(): any[] {
```

---

### Step 3: Convert Tool Schemas (7 Tools)

#### Tool 1: create_blog_post

**Current JSON Schema:**
```typescript
{
  name: 'create_blog_post',
  description: 'Create a new blog post in GoHighLevel. Requires blog ID, author ID, and category IDs which can be obtained from other blog tools.',
  inputSchema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: 'Blog post title' },
      blogId: { type: 'string', description: 'Blog site ID (use get_blog_sites to find available blogs)' },
      content: { type: 'string', description: 'Full HTML content of the blog post' },
      description: { type: 'string', description: 'Short description/excerpt of the blog post' },
      imageUrl: { type: 'string', description: 'URL of the featured image for the blog post' },
      imageAltText: { type: 'string', description: 'Alt text for the featured image (for SEO and accessibility)' },
      urlSlug: { type: 'string', description: 'URL slug for the blog post (use check_url_slug to verify availability)' },
      author: { type: 'string', description: 'Author ID (use get_blog_authors to find available authors)' },
      categories: { type: 'array', items: { type: 'string' }, description: 'Array of category IDs (use get_blog_categories to find available categories)' },
      tags: { type: 'array', items: { type: 'string' }, description: 'Optional array of tags for the blog post' },
      status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED'], description: 'Publication status of the blog post', default: 'DRAFT' },
      canonicalLink: { type: 'string', description: 'Optional canonical URL for SEO' },
      publishedAt: { type: 'string', description: 'Optional ISO timestamp for publication date (defaults to now for PUBLISHED status)' }
    },
    required: ['title', 'blogId', 'content', 'description', 'imageUrl', 'imageAltText', 'urlSlug', 'author', 'categories']
  }
}
```

**New Zod Schema:**
```typescript
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
}
```

---

#### Tool 2: update_blog_post

**New Zod Schema:**
```typescript
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
}
```

---

#### Tool 3: get_blog_posts

**New Zod Schema:**
```typescript
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
}
```

---

#### Tool 4: get_blog_sites

**New Zod Schema:**
```typescript
{
  name: 'get_blog_sites',
  description: 'Get all blog sites for the current location. Use this to find available blogs before creating or managing posts.',
  inputSchema: {
    limit: z.number().min(1).max(100).optional().describe('Number of blogs to retrieve (default: 10)'),
    skip: z.number().min(0).optional().describe('Number of blogs to skip for pagination (default: 0)'),
    searchTerm: z.string().optional().describe('Optional search term to filter blogs by name')
  }
}
```

---

#### Tool 5: get_blog_authors

**New Zod Schema:**
```typescript
{
  name: 'get_blog_authors',
  description: 'Get all available blog authors for the current location. Use this to find author IDs for creating blog posts.',
  inputSchema: {
    limit: z.number().min(1).max(100).optional().describe('Number of authors to retrieve (default: 10)'),
    offset: z.number().min(0).optional().describe('Number of authors to skip for pagination (default: 0)')
  }
}
```

---

#### Tool 6: get_blog_categories

**New Zod Schema:**
```typescript
{
  name: 'get_blog_categories',
  description: 'Get all available blog categories for the current location. Use this to find category IDs for creating blog posts.',
  inputSchema: {
    limit: z.number().min(1).max(100).optional().describe('Number of categories to retrieve (default: 10)'),
    offset: z.number().min(0).optional().describe('Number of categories to skip for pagination (default: 0)')
  }
}
```

---

#### Tool 7: check_url_slug

**New Zod Schema:**
```typescript
{
  name: 'check_url_slug',
  description: 'Check if a URL slug is available for use. Use this before creating or updating blog posts to ensure unique URLs.',
  inputSchema: {
    urlSlug: z.string().describe('URL slug to check for availability'),
    postId: z.string().optional().describe('Optional post ID when updating an existing post (to exclude itself from the check)')
  }
}
```

---

### Step 4: Add Error Handling

Add blog-specific error handling to the `createBlogPost` method:

```typescript
private async createBlogPost(params: MCPCreateBlogPostParams): Promise<{ success: boolean; blogPost: GHLBlogPost; message: string }> {
  try {
    // ... existing implementation ...
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
```

Add similar error handling to `updateBlogPost` for slug conflicts.

---

## 🎯 Conversion Checklist

- [ ] Update imports (remove `Tool`, add `z`)
- [ ] Change return type from `Tool[]` to `any[]`
- [ ] Convert `create_blog_post` schema to Zod
- [ ] Convert `update_blog_post` schema to Zod
- [ ] Convert `get_blog_posts` schema to Zod
- [ ] Convert `get_blog_sites` schema to Zod
- [ ] Convert `get_blog_authors` schema to Zod
- [ ] Convert `get_blog_categories` schema to Zod
- [ ] Convert `check_url_slug` schema to Zod
- [ ] Add error handling for duplicate slugs in `createBlogPost`
- [ ] Add error handling for duplicate slugs in `updateBlogPost`
- [ ] Test build with `npm run build`
- [ ] Verify no breaking changes to tool names
- [ ] Verify all optional parameters marked with `.optional()`
- [ ] Verify all required parameters have no `.optional()`

---

## 📝 Key Conversion Patterns

### Pattern 1: Required String Field
**Before:** `{ type: 'string', description: 'Field description' }`  
**After:** `z.string().describe('Field description')`

### Pattern 2: Optional String Field
**Before:** `{ type: 'string', description: 'Optional field' }` (not in required array)  
**After:** `z.string().optional().describe('Optional field')`

### Pattern 3: Array of Strings
**Before:** `{ type: 'array', items: { type: 'string' }, description: 'Array field' }`  
**After:** `z.array(z.string()).describe('Array field')`

### Pattern 4: Optional Array
**Before:** `{ type: 'array', items: { type: 'string' }, description: 'Optional array' }` (not in required)  
**After:** `z.array(z.string()).optional().describe('Optional array')`

### Pattern 5: Enum Field
**Before:** `{ type: 'string', enum: ['DRAFT', 'PUBLISHED'], description: 'Status' }`  
**After:** `z.enum(['DRAFT', 'PUBLISHED']).describe('Status')`

### Pattern 6: Optional Enum
**Before:** `{ type: 'string', enum: ['DRAFT', 'PUBLISHED'], description: 'Optional status' }` (not in required)  
**After:** `z.enum(['DRAFT', 'PUBLISHED']).optional().describe('Optional status')`

### Pattern 7: Number with Constraints
**Before:** `{ type: 'number', minimum: 1, maximum: 100, description: 'Limit' }`  
**After:** `z.number().min(1).max(100).describe('Limit')`

### Pattern 8: Optional Number
**Before:** `{ type: 'number', description: 'Optional number' }` (not in required)  
**After:** `z.number().optional().describe('Optional number')`

---

## 🚨 Common Pitfalls to Avoid

1. **Don't forget `.optional()`** - Fields not in `required` array must have `.optional()`
2. **Don't remove descriptions** - Use `.describe()` for all fields
3. **Don't change tool names** - Keep exact same names for backward compatibility
4. **Don't change parameter names** - Keep exact same parameter names
5. **Don't skip error handling** - Add blog-specific error messages
6. **Don't forget to test** - Run `npm run build` after conversion

---

## 🧪 Testing After Conversion

### Build Test
```bash
npm run build
```
Expected: No TypeScript errors

### Manual Test Checklist
- [ ] `create_blog_post` - Test with valid data
- [ ] `create_blog_post` - Test with duplicate slug (should show helpful error)
- [ ] `update_blog_post` - Test updating a post
- [ ] `get_blog_posts` - Test listing posts
- [ ] `get_blog_sites` - Test getting blog sites
- [ ] `get_blog_authors` - Test getting authors
- [ ] `get_blog_categories` - Test getting categories
- [ ] `check_url_slug` - Test slug availability check

---

## 📊 Expected Results

### Before Conversion
- Uses old JSON Schema format
- Generic error messages
- 7 tools with JSON schemas

### After Conversion
- Uses modern Zod schemas
- Blog-specific error messages (duplicate slug)
- 7 tools with Zod schemas
- Same tool names and functionality
- Better type safety
- Improved error handling

---

## 🔗 Integration

After conversion, the blog tools will need to be registered in the HTTP server (similar to contact and conversation tools):

```typescript
// In src/http-server.ts

import { BlogTools } from './tools/blog-tools';

// Initialize
const blogTools = new BlogTools(ghlClient);

// Register tools
const blogToolDefinitions = blogTools.getToolDefinitions();
for (const tool of blogToolDefinitions) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (params: any) => {
      return await blogTools.executeTool(tool.name, params);
    }
  );
}
```

---

## 📚 Reference Files

**Pattern Reference:**
- `/src/tools/contact-tools.ts` - Shows correct Zod schema patterns
- `/src/tools/conversation-tools.ts` - Shows error handling patterns

**Original File:**
- `/src/tools/blog-tools-org.ts` - Backup of original JSON schema version

**Target File:**
- `/src/tools/blog-tools.ts` - File to be converted

---

**Conversion Status:** ⏳ PENDING  
**Estimated Time:** 30-45 minutes  
**Complexity:** Medium (7 tools, straightforward schemas)  
**Risk Level:** Low (well-established pattern, good references)
