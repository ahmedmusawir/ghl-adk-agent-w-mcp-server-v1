/**
 * GoHighLevel Products API Tools for MCP Server
 * Provides comprehensive tools for managing products, prices, inventory, collections, and reviews
 */

import { z } from "zod";
import {
  // API Client Types
  GHLCreateProductRequest,
  GHLUpdateProductRequest,
  GHLListProductsRequest,
  GHLGetProductRequest,
  GHLDeleteProductRequest,
  GHLCreatePriceRequest,
  GHLUpdatePriceRequest,
  GHLListPricesRequest,
  GHLGetPriceRequest,
  GHLDeletePriceRequest,
  GHLBulkUpdateRequest,
  GHLListInventoryRequest,
  GHLUpdateInventoryRequest,
  GHLGetProductStoreStatsRequest,
  GHLUpdateProductStoreRequest,
  GHLCreateProductCollectionRequest,
  GHLUpdateProductCollectionRequest,
  GHLListProductCollectionsRequest,
  GHLGetProductCollectionRequest,
  GHLDeleteProductCollectionRequest,
  GHLListProductReviewsRequest,
  GHLGetReviewsCountRequest,
  GHLUpdateProductReviewRequest,
  GHLDeleteProductReviewRequest,
  GHLBulkUpdateProductReviewsRequest
} from '../types/ghl-types.js';

import { GHLApiClient } from '../clients/ghl-api-client.js';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

export interface ProductsToolResult {
  [x: string]: unknown;
  content: {
    type: 'text';
    text: string;
  }[];
}

export class ProductsTools {
  constructor(private apiClient: GHLApiClient) {}

  // Product Operations
  async createProduct(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLCreateProductRequest = {
        ...params,
        locationId: params.locationId || this.apiClient.getConfig().locationId
      };

      const response = await this.apiClient.createProduct(request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        message: 'Product created successfully',
        product: response.data
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async listProducts(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLListProductsRequest = {
        ...params,
        locationId: params.locationId || this.apiClient.getConfig().locationId
      };

      const response = await this.apiClient.listProducts(request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      const total = response.data.total[0]?.total || 0;
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        products: response.data.products,
        pagination: {
          total,
          returned: response.data.products.length,
          limit: params.limit || 20,
          offset: params.offset || 0,
          hasMore: (params.offset || 0) + response.data.products.length < total
        },
        filters: {
          search: params.search || null,
          storeId: params.storeId || null,
          includedInStore: params.includedInStore ?? null,
          availableInStore: params.availableInStore ?? null
        }
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  getToolDefinitions(): any[] {
    return [
      // Product Management Tools
      {
        name: 'create_product',
        description: `Create a new product in your GoHighLevel store.

Add products to sell through your GHL e-commerce platform.

Product Types:
- **DIGITAL**: Downloads, courses, digital content (no shipping)
- **PHYSICAL**: Physical items that require shipping
- **SERVICE**: Services, appointments, consultations
- **PHYSICAL/DIGITAL**: Combo products (book + course)

USAGE EXAMPLES:

1. Create a digital course:
{
  "name": "Marketing Mastery Course",
  "productType": "DIGITAL",
  "description": "Complete 10-module marketing course",
  "availableInStore": true
}

2. Create a physical product with image:
{
  "name": "Company T-Shirt",
  "productType": "PHYSICAL",
  "description": "Premium cotton t-shirt with logo",
  "image": "https://example.com/tshirt.jpg",
  "availableInStore": true
}

3. Create a service:
{
  "name": "1-Hour Strategy Consultation",
  "productType": "SERVICE",
  "description": "One-on-one business strategy session"
}

WORKFLOW:
1. Create product with this tool
2. Use create_price to add pricing
3. Product appears in your store

Returns: Complete product object with _id, name, productType, and all fields.

Related Tools: create_price, update_product, list_products`,
        inputSchema: {
          name: z.string().min(1).describe('Product name (customer-facing)'),
          productType: z.enum(['DIGITAL', 'PHYSICAL', 'SERVICE', 'PHYSICAL/DIGITAL']).describe('Product type: DIGITAL (downloads), PHYSICAL (ships), SERVICE (appointments), PHYSICAL/DIGITAL (combo)'),
          description: z.string().optional().describe('Product description (supports HTML/markdown)'),
          image: z.string().url().optional().describe('Product image URL (recommended: 1200x1200px)'),
          availableInStore: z.boolean().optional().describe('Make product visible in store (default: true)'),
          slug: z.string().optional().describe('URL-friendly slug (auto-generated from name if not provided)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_products',
        description: `List products with filtering and search.

Browse and search your product catalog.

USAGE EXAMPLES:

1. Get all products (no filters):
{}

2. Search by name:
{
  "search": "shirt"
}

3. Get only visible products:
{
  "availableInStore": true
}

4. Paginate (page 2 with 20 per page):
{
  "limit": 20,
  "offset": 20
}

5. Count digital products (get all, then filter in response):
{
  "limit": 100
}
Then filter response: products.filter(p => p.productType === "DIGITAL").length

RESPONSE FORMAT:
{
  "success": true,
  "products": [...],  // Array of product objects
  "pagination": { "total": 50, "returned": 20, "hasMore": true }
}

Returns: Array of complete product objects with _id, name, productType, availableInStore, etc.

Related Tools: get_product, create_product, update_product`,
        inputSchema: {
          limit: z.number().min(1).max(100).optional().describe('Maximum products to return (default: 20, max: 100)'),
          offset: z.number().min(0).optional().describe('Number of products to skip (for pagination)'),
          search: z.string().optional().describe('Search term for product names'),
          storeId: z.string().optional().describe('Filter by specific store ID'),
          includedInStore: z.boolean().optional().describe('Filter by store inclusion status'),
          availableInStore: z.boolean().optional().describe('Filter by store availability (true = visible products)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_product',
        description: `Get a specific product by ID.

Retrieve complete product details. REQUIRED before updating a product.

USAGE EXAMPLE:
{
  "productId": "6889e92370362859b6bdd6a1"
}

RESPONSE FORMAT:
{
  "success": true,
  "product": {
    "_id": "6889e92370362859b6bdd6a1",
    "name": "Marketing Course",
    "productType": "DIGITAL",
    "description": "...",
    "availableInStore": true,
    "medias": [...],
    "collectionIds": [...],
    "seo": {...},
    "createdAt": "...",
    "updatedAt": "..."
  }
}

IMPORTANT: Always call this BEFORE update_product to get the current name and productType (both required for updates).

Returns: Complete product object with all fields from GHL API.

Related Tools: list_products, update_product, list_prices`,
        inputSchema: {
          productId: z.string().describe('Product ID to retrieve'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'update_product',
        description: `Update an existing product.

⚠️ REQUIRED WORKFLOW:
1. FIRST call get_product to get current name and productType
2. Include BOTH name and productType in your update (even if not changing them)
3. Add the fields you want to change

USAGE EXAMPLES:

1. Update description (must include name + productType):
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Marketing Course",
  "productType": "DIGITAL",
  "description": "Updated course description here"
}

2. Hide product from store:
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Marketing Course",
  "productType": "DIGITAL",
  "availableInStore": false
}

3. Change product name:
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "NEW Product Name Here",
  "productType": "DIGITAL"
}

⚠️ API CONSTRAINTS:
- name: REQUIRED in every update
- productType: REQUIRED in every update (but CANNOT be changed - pass current value)
- If you omit name or productType, you will get a 422 validation error

Returns: Updated product object with all fields.

Related Tools: get_product, create_product, create_price`,
        inputSchema: {
          productId: z.string().describe('Product ID to update'),
          name: z.string().min(1).describe('Product name (REQUIRED - include current name even if not changing it)'),
          productType: z.enum(['DIGITAL', 'PHYSICAL', 'SERVICE', 'PHYSICAL/DIGITAL']).describe('Product type (REQUIRED - must match current type, cannot be changed)'),
          description: z.string().optional().describe('New description (optional)'),
          image: z.string().url().optional().describe('New image URL (optional)'),
          availableInStore: z.boolean().optional().describe('Update store visibility (optional)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_product',
        description: `Delete a product by ID.

⚠️ WARNING: This is PERMANENT and cannot be undone!

Use Cases:
- Remove discontinued products
- Clean up test products
- Delete duplicate products
- Remove outdated offerings

What Gets Deleted:
- The product itself
- Product configuration
- Associated metadata
- Store listings

⚠️ Before Deleting:
1. Verify correct product (use get_product)
2. Check if product has active orders
3. Consider hiding instead (availableInStore=false)
4. Remove from collections first
5. Have backup of product data

⚠️ Impact:
- Product no longer visible in store
- Cannot be purchased
- Existing orders NOT affected
- Prices remain but orphaned
- Cannot be recovered after deletion

Safer Alternative:
- Update product: availableInStore=false
- Keeps product data intact
- Can be reactivated if needed
- Preserves order history

💡 Best Practice:
- Hide products instead of deleting when possible
- Document why product was removed
- Export product data before deletion

Returns: Confirmation of deletion.

Related Tools: update_product, get_product, list_products`,
        inputSchema: {
          productId: z.string().describe('Product ID to permanently delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Price Management Tools
      {
        name: 'create_price',
        description: `Create a price for a product.

⚠️ CRITICAL - MONETARY VALUE FORMAT:
Amount must be a FLOAT with explicit decimal places. The API does NOT use cents.
- For $99.00, use: 99.00 (NOT 9900)
- For $29.50, use: 29.50 (NOT 2950)
- For whole numbers like $100, use: 100.00

Price Types:
- **one_time**: Single payment (buy once)
- **recurring**: Subscription/membership

USAGE EXAMPLES:

1. Basic one-time price ($99.00):
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Standard",
  "type": "one_time",
  "currency": "USD",
  "amount": 99.00
}

2. Monthly subscription ($29/month):
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Monthly Plan",
  "type": "recurring",
  "currency": "USD",
  "amount": 29.00
}

3. Sale price (was $99, now $49):
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Holiday Sale",
  "type": "one_time",
  "currency": "USD",
  "amount": 49.00,
  "compareAtPrice": 99.00
}

4. Product variant (size/color):
{
  "productId": "6889e92370362859b6bdd6a1",
  "name": "Large - Blue",
  "type": "one_time",
  "currency": "USD",
  "amount": 39.00
}

Returns: Created price object with _id and all fields.

Related Tools: list_prices, create_product, list_products`,
        inputSchema: {
          productId: z.string().describe('Product ID to create price for'),
          name: z.string().describe('Price/variant name (e.g., "Standard", "Monthly Plan", "Large - Blue")'),
          type: z.enum(['one_time', 'recurring']).describe('Price type: one_time (single payment) or recurring (subscription)'),
          currency: z.string().describe('Currency code ("USD", "EUR", "GBP", "CAD")'),
          amount: z.number().min(0).describe('Price as float with decimals (99.00 = $99.00, 29.50 = $29.50). NOT cents.'),
          compareAtPrice: z.number().min(0).optional().describe('Original price as float for showing discounts (e.g., 99.00 when amount=49.00). NOT cents.'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_prices',
        description: `List prices for a product.

View all pricing options and variants for a product.

USAGE EXAMPLE:
{
  "productId": "6889e92370362859b6bdd6a1"
}

RESPONSE FORMAT:
{
  "success": true,
  "productId": "6889e92370362859b6bdd6a1",
  "prices": [
    {
      "_id": "price123",
      "name": "Standard",
      "type": "one_time",
      "amount": 99.00,
      "currency": "USD",
      "compareAtPrice": null
    },
    {
      "_id": "price456",
      "name": "Monthly Plan",
      "type": "recurring",
      "amount": 29.00,
      "currency": "USD"
    }
  ],
  "pagination": { "total": 2, "returned": 2 }
}

**AI/AGENT DISPLAY RULE:** When displaying monetary values from this response:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")
- Example: amount: 99, currency: "USD" → display as "99.00 USD"

Returns: Array of price objects with _id, name, type, amount, currency.

Related Tools: create_price, get_product, list_products`,
        inputSchema: {
          productId: z.string().describe('Product ID to list prices for'),
          limit: z.number().min(1).max(100).optional().describe('Maximum prices to return (for pagination)'),
          offset: z.number().min(0).optional().describe('Number of prices to skip (for pagination)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Inventory Tools
      {
        name: 'list_inventory',
        description: `List inventory items with stock levels.

Track product inventory and stock quantities.

Use Cases:
- Monitor stock levels
- Find low-stock items
- Search inventory by product
- Track inventory across variants
- Audit inventory status

What You Get:
- Product and variant information
- Current stock quantities
- Inventory tracking status
- Product IDs and names
- Variant details

Inventory Management:
- Track stock for physical products
- Monitor quantities per variant
- Get alerts for low stock
- Plan restocking

Filtering:
- search: Find specific products
- Pagination with limit/offset

Examples:
- All inventory: {} (no filters)
- Search: {search: "shirt"}
- Page 2: {limit: 50, offset: 50}

💡 Use Cases:
- Before creating orders (check stock)
- Inventory audits
- Restocking decisions
- Product availability checks

Returns: Array of inventory items with stock levels.

Related Tools: list_products, get_product, list_prices`,
        inputSchema: {
          limit: z.number().min(1).max(100).optional().describe('Maximum items to return (default: 20, max: 100)'),
          offset: z.number().min(0).optional().describe('Number of items to skip (for pagination)'),
          search: z.string().optional().describe('Search term for inventory items'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Collection Tools
      {
        name: 'create_product_collection',
        description: `Create a new product collection.

Organize products into collections for better browsing.

Use Cases:
- Group related products ("Summer Collection")
- Create category pages ("T-Shirts", "Courses")
- Build themed collections ("Best Sellers")
- Organize by season/event
- Improve store navigation

Collection Benefits:
- Better product organization
- Easier customer browsing
- SEO-friendly category pages
- Featured product groups
- Marketing campaigns

How It Works:
1. Create collection with name and slug
2. Add collection image (optional)
3. Set SEO metadata
4. Add products to collection
5. Collection appears in store

Examples:
- Basic: name="Summer Sale", slug="summer-sale"
- With image: name="T-Shirts", slug="t-shirts", image="https://..."
- With SEO: name="Courses", slug="courses", seo={title:"Online Courses", description:"..."}

💡 Best Practices:
- Use clear, descriptive names
- Create SEO-friendly slugs (lowercase, hyphens)
- Add collection images (1200x400px recommended)
- Write compelling SEO descriptions
- Organize logically for customers

Returns: Created collection with ID and configuration.

Related Tools: list_product_collections, create_product, list_products`,
        inputSchema: {
          name: z.string().min(1).describe('Collection name (e.g., "Summer Sale", "T-Shirts", "Best Sellers")'),
          slug: z.string().min(1).describe('URL-friendly slug (e.g., "summer-sale", "t-shirts")'),
          image: z.string().url().optional().describe('Collection banner image URL (recommended: 1200x400px)'),
          seo: z.object({
            title: z.string().optional().describe('SEO title for search engines'),
            description: z.string().optional().describe('SEO description for search engines')
          }).optional().describe('SEO metadata for collection page'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_product_collections',
        description: `List product collections.

Browse and search your product collections.

Use Cases:
- View all collections
- Search collections by name
- Find collection IDs
- Audit collection structure
- Review store organization

What You Get:
- All collections
- Collection names and slugs
- Collection images
- SEO metadata
- Collection IDs
- Product counts per collection

Filtering:
- name: Search by collection name
- Pagination with limit/offset

Examples:
- All collections: {} (no filters)
- Search: {name: "summer"}
- Page 2: {limit: 20, offset: 20}

Common Workflow:
1. List collections
2. Find collection ID
3. Add products to collection
4. Display on store

Returns: Array of collections with details.

Related Tools: create_product_collection, list_products, create_product`,
        inputSchema: {
          limit: z.number().min(1).max(100).optional().describe('Maximum collections to return (default: 20, max: 100)'),
          offset: z.number().min(0).optional().describe('Number of collections to skip (for pagination)'),
          name: z.string().optional().describe('Search by collection name'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      }
    ];
  }

  async executeProductsTool(toolName: string, params: any): Promise<ProductsToolResult> {
    switch (toolName) {
      case 'create_product':
        return this.createProduct(params);
      case 'list_products':
        return this.listProducts(params);
      case 'get_product':
        return this.getProduct(params);
      case 'update_product':
        return this.updateProduct(params);
      case 'delete_product':
        return this.deleteProduct(params);
      case 'create_price':
        return this.createPrice(params);
      case 'list_prices':
        return this.listPrices(params);
      case 'list_inventory':
        return this.listInventory(params);
      case 'create_product_collection':
        return this.createProductCollection(params);
      case 'list_product_collections':
        return this.listProductCollections(params);
      default:
        return {
          content: [{
            type: 'text',
            text: `❌ **Unknown Products Tool**: ${toolName}`
          }]
        };
    }
  }

  // Additional Product Operations
  async getProduct(params: any): Promise<ProductsToolResult> {
    try {
      const response = await this.apiClient.getProduct(
        params.productId,
        params.locationId || this.apiClient.getConfig().locationId
      );
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        product: response.data
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async updateProduct(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLUpdateProductRequest = {
        ...params,
        locationId: params.locationId || this.apiClient.getConfig().locationId
      };

      const response = await this.apiClient.updateProduct(params.productId, request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        message: 'Product updated successfully',
        product: response.data
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async deleteProduct(params: any): Promise<ProductsToolResult> {
    try {
      const response = await this.apiClient.deleteProduct(
        params.productId,
        params.locationId || this.apiClient.getConfig().locationId
      );
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      const result = {
        success: true,
        message: 'Product deleted successfully',
        productId: params.productId,
        status: response.data.status
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async createPrice(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLCreatePriceRequest = {
        ...params,
        locationId: params.locationId || this.apiClient.getConfig().locationId
      };

      const response = await this.apiClient.createPrice(params.productId, request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        message: 'Price created successfully',
        price: response.data
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async listPrices(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLListPricesRequest = {
        ...params,
        locationId: params.locationId || this.apiClient.getConfig().locationId
      };

      const response = await this.apiClient.listPrices(params.productId, request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        productId: params.productId,
        prices: response.data.prices,
        pagination: {
          total: response.data.total,
          returned: response.data.prices.length
        }
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async listInventory(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLListInventoryRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        ...params
      };

      const response = await this.apiClient.listInventory(request);
      
      if (!response.data) {
        throw new Error('No data returned from API');
      }
      
      const total = response.data.total.total;
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        inventory: response.data.inventory,
        pagination: {
          total,
          returned: response.data.inventory.length
        },
        filters: {
          search: params.search || null
        }
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async createProductCollection(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLCreateProductCollectionRequest = {
        ...params,
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.createProductCollection(request);
      
      if (!response.data?.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        message: 'Collection created successfully',
        collection: response.data.data
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }

  async listProductCollections(params: any): Promise<ProductsToolResult> {
    try {
      const request: GHLListProductCollectionsRequest = {
        ...params,
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.listProductCollections(request);
      
      if (!response.data?.data) {
        throw new Error('No data returned from API');
      }
      
      // Return raw API data for maximum flexibility
      const result = {
        success: true,
        collections: response.data.data,
        pagination: {
          total: response.data.total,
          returned: response.data.data.length
        },
        filters: {
          name: params.name || null
        }
      };
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text', 
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          }, null, 2)
        }]
      };
    }
  }
} 