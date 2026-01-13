import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  GHLGetObjectSchemaRequest,
  GHLCreateObjectSchemaRequest,
  GHLUpdateObjectSchemaRequest,
  GHLCreateObjectRecordRequest,
  GHLUpdateObjectRecordRequest,
  GHLSearchObjectRecordsRequest
} from '../types/ghl-types.js';

/**
 * ObjectTools class for GoHighLevel Custom Objects API endpoints
 * Handles both object schema management and record operations for custom and standard objects
 */
export class ObjectTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get all available Custom Objects tool definitions
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'get_all_objects',
        description: `Get all objects (custom and standard) for a location.

Returns both system objects (contact, opportunity, business) and custom objects.

Use Cases:
- List all available object types
- Discover custom objects
- Get object schema keys
- Understand data model

Returns: Array of objects with keys, labels, and properties.

Related Tools: get_object_schema, create_object_schema`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'create_object_schema',
        description: `Create a new custom object schema.

Define custom data structures for your business needs.

Use Cases:
- Create pet records system
- Build support ticket tracking
- Manage inventory items
- Store custom business data

Examples:
- Pet tracking: labels={singular:"Pet", plural:"Pets"}, key="pet"
- Support tickets: labels={singular:"Ticket", plural:"Tickets"}, key="ticket"

Returns: Created object schema with ID and configuration.

Related Tools: get_object_schema, update_object_schema, create_object_record`,
        inputSchema: {
          labels: z.object({
            singular: z.string().describe('Singular name (e.g., "Pet")'),
            plural: z.string().describe('Plural name (e.g., "Pets")')
          }).describe('Singular and plural names for the custom object'),
          key: z.string().describe('Unique key for the object (e.g., "pet"). The "custom_objects." prefix is added automatically'),
          description: z.string().optional().describe('Description of the custom object'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          primaryDisplayPropertyDetails: z.object({
            key: z.string().describe('Property key (e.g., "name")'),
            name: z.string().describe('Display name (e.g., "Pet Name")'),
            dataType: z.enum(['TEXT', 'NUMERICAL']).describe('Data type')
          }).describe('Primary property configuration for display')
        }
      },
      {
        name: 'get_object_schema',
        description: `Get object schema details by key.

Retrieve complete schema including all fields and properties.

Use Cases:
- View custom object structure
- Get field definitions
- Understand object properties
- Prepare for record creation

Supports both custom objects ("custom_objects.pet") and standard objects ("contact", "opportunity").

Returns: Object schema with fields, properties, and configuration.

Related Tools: get_all_objects, create_object_schema, update_object_schema`,
        inputSchema: {
          key: z.string().describe('Object key (e.g., "custom_objects.pet" for custom, "contact" for standard)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          fetchProperties: z.boolean().optional().describe('Whether to fetch all standard/custom fields (default: true)')
        }
      },
      {
        name: 'update_object_schema',
        description: `Update object schema properties.

Modify labels, description, and searchable fields.

Use Cases:
- Update object labels
- Change description
- Configure searchable fields
- Refine object schema

Searchable properties enable search_object_records to find records by those fields.

Returns: Updated object schema.

Related Tools: get_object_schema, search_object_records`,
        inputSchema: {
          key: z.string().describe('Object key to update'),
          searchableProperties: z.array(z.string()).describe('Array of field keys that should be searchable (e.g., ["custom_objects.pet.name"])'),
          labels: z.object({
            singular: z.string().describe('Updated singular name'),
            plural: z.string().describe('Updated plural name')
          }).optional().describe('Updated singular and plural names'),
          description: z.string().optional().describe('Updated description'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'create_object_record',
        description: `Create a new record in a custom or standard object.

Add data to your custom objects or standard objects.

Use Cases:
- Add new pet record
- Create support ticket
- Add inventory item
- Store custom business data

Examples:
- Pet: schemaKey="custom_objects.pet", properties={"name":"Buddy", "breed":"Golden Retriever"}
- Ticket: schemaKey="custom_objects.ticket", properties={"title":"Bug report", "status":"open"}

Returns: Created record with ID and all properties.

Related Tools: get_object_record, update_object_record, search_object_records`,
        inputSchema: {
          schemaKey: z.string().describe('Schema key of the object (e.g., "custom_objects.pet", "business")'),
          properties: z.record(z.any()).describe('Record properties as key-value pairs (e.g., {"name": "Buddy", "breed": "Golden Retriever"})'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          owner: z.array(z.string()).max(1).optional().describe('Array of user IDs who own this record (max 1, custom objects only)'),
          followers: z.array(z.string()).max(10).optional().describe('Array of user IDs who follow this record (max 10)')
        }
      },
      {
        name: 'get_object_record',
        description: `Get a specific record by ID.

Retrieve complete record data from custom or standard objects.

Use Cases:
- View pet details
- Get ticket information
- Retrieve inventory item
- Access custom record data

Returns: Complete record with all properties and metadata.

Related Tools: search_object_records, create_object_record, update_object_record`,
        inputSchema: {
          schemaKey: z.string().describe('Schema key of the object'),
          recordId: z.string().describe('ID of the record to retrieve')
        }
      },
      {
        name: 'update_object_record',
        description: `Update an existing record.

Modify properties, owner, or followers of a record.

Use Cases:
- Update pet information
- Change ticket status
- Modify inventory data
- Update custom record fields

Only provide the properties you want to update.

Returns: Updated record with all current properties.

Related Tools: get_object_record, create_object_record`,
        inputSchema: {
          schemaKey: z.string().describe('Schema key of the object'),
          recordId: z.string().describe('ID of the record to update'),
          properties: z.record(z.any()).optional().describe('Updated record properties as key-value pairs'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          owner: z.array(z.string()).max(1).optional().describe('Updated array of user IDs who own this record (max 1)'),
          followers: z.array(z.string()).max(10).optional().describe('Updated array of user IDs who follow this record (max 10)')
        }
      },
      {
        name: 'delete_object_record',
        description: `Delete a record from a custom or standard object.

⚠️ WARNING: This is permanent and cannot be undone!
⚠️ All associated data will be lost!

Use Cases:
- Remove outdated records
- Delete test data
- Clean up duplicates

Related Tools: get_object_record, search_object_records`,
        inputSchema: {
          schemaKey: z.string().describe('Schema key of the object'),
          recordId: z.string().describe('ID of the record to delete')
        }
      },
      {
        name: 'search_object_records',
        description: `Search records within a custom or standard object.

Query custom data using searchable properties configured in the schema.

Use Cases:
- Find pets by name or breed
- Search tickets by title
- Query inventory by SKU
- Filter custom records

Query format: "fieldName:value" (e.g., "name:Buddy", "status:open")
Only fields marked as searchable in update_object_schema can be queried.

Returns: Array of matching records with pagination info.

Related Tools: get_object_record, update_object_schema`,
        inputSchema: {
          schemaKey: z.string().describe('Schema key of the object to search in'),
          query: z.string().describe('Search query using searchable properties (e.g., "name:Buddy")'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          page: z.number().min(1).optional().describe('Page number for pagination (default: 1)'),
          pageLimit: z.number().min(1).max(100).optional().describe('Number of records per page (default: 10, max: 100)'),
          searchAfter: z.array(z.string()).optional().describe('Cursor for pagination (returned from previous search)')
        }
      }
    ];
  }

  /**
   * Execute an object tool by name with given arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'get_all_objects':
        return this.getAllObjects(args);
      
      case 'create_object_schema':
        return this.createObjectSchema(args);
      
      case 'get_object_schema':
        return this.getObjectSchema(args);
      
      case 'update_object_schema':
        return this.updateObjectSchema(args);
      
      case 'create_object_record':
        return this.createObjectRecord(args);
      
      case 'get_object_record':
        return this.getObjectRecord(args);
      
      case 'update_object_record':
        return this.updateObjectRecord(args);
      
      case 'delete_object_record':
        return this.deleteObjectRecord(args);
      
      case 'search_object_records':
        return this.searchObjectRecords(args);
      
      default:
        throw new Error(`Unknown object tool: ${name}`);
    }
  }

  /**
   * GET ALL OBJECTS
   */
  private async getAllObjects(params: any = {}): Promise<{ success: boolean; objects: any[]; message: string }> {
    try {
      const response = await this.ghlClient.getObjectsByLocation(params.locationId);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }

      const objects = Array.isArray(response.data.objects) ? response.data.objects : [];
      
      return {
        success: true,
        objects,
        message: `Retrieved ${objects.length} objects for location`
      };
    } catch (error) {
      throw new Error(`Failed to get objects: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * CREATE OBJECT SCHEMA
   */
  private async createObjectSchema(params: any): Promise<{ success: boolean; object: any; message: string }> {
    try {
      const schemaData: GHLCreateObjectSchemaRequest = {
        labels: params.labels,
        key: params.key,
        description: params.description,
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        primaryDisplayPropertyDetails: params.primaryDisplayPropertyDetails
      };

      const response = await this.ghlClient.createObjectSchema(schemaData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        object: response.data.object,
        message: `Custom object schema created successfully with key: ${response.data.object.key}`
      };
    } catch (error) {
      throw new Error(`Failed to create object schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * GET OBJECT SCHEMA
   */
  private async getObjectSchema(params: any): Promise<{ success: boolean; object: any; fields?: any[]; cache?: boolean; message: string }> {
    try {
      const requestParams: GHLGetObjectSchemaRequest = {
        key: params.key,
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        fetchProperties: params.fetchProperties
      };

      const response = await this.ghlClient.getObjectSchema(requestParams);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        object: response.data.object,
        fields: response.data.fields,
        cache: response.data.cache,
        message: `Object schema retrieved successfully for key: ${params.key}`
      };
    } catch (error) {
      throw new Error(`Failed to get object schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPDATE OBJECT SCHEMA
   */
  private async updateObjectSchema(params: any): Promise<{ success: boolean; object: any; message: string }> {
    try {
      const updateData: GHLUpdateObjectSchemaRequest = {
        labels: params.labels,
        description: params.description,
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        searchableProperties: params.searchableProperties
      };

      const response = await this.ghlClient.updateObjectSchema(params.key, updateData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        object: response.data.object,
        message: `Object schema updated successfully for key: ${params.key}`
      };
    } catch (error) {
      throw new Error(`Failed to update object schema: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * CREATE OBJECT RECORD
   */
  private async createObjectRecord(params: any): Promise<{ success: boolean; record: any; recordId: string; message: string }> {
    try {
      const recordData: GHLCreateObjectRecordRequest = {
        properties: params.properties,
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        owner: params.owner,
        followers: params.followers
      };

      const response = await this.ghlClient.createObjectRecord(params.schemaKey, recordData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        record: response.data.record,
        recordId: response.data.record.id,
        message: `Record created successfully in ${params.schemaKey} with ID: ${response.data.record.id}`
      };
    } catch (error) {
      throw new Error(`Failed to create object record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * GET OBJECT RECORD
   */
  private async getObjectRecord(params: any): Promise<{ success: boolean; record: any; message: string }> {
    try {
      const response = await this.ghlClient.getObjectRecord(params.schemaKey, params.recordId);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        record: response.data.record,
        message: `Record retrieved successfully from ${params.schemaKey}`
      };
    } catch (error) {
      throw new Error(`Failed to get object record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * UPDATE OBJECT RECORD
   */
  private async updateObjectRecord(params: any): Promise<{ success: boolean; record: any; message: string }> {
    try {
      const updateData: GHLUpdateObjectRecordRequest = {
        properties: params.properties,
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        owner: params.owner,
        followers: params.followers
      };

      const response = await this.ghlClient.updateObjectRecord(params.schemaKey, params.recordId, updateData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        record: response.data.record,
        message: `Record updated successfully in ${params.schemaKey}`
      };
    } catch (error) {
      throw new Error(`Failed to update object record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * DELETE OBJECT RECORD
   */
  private async deleteObjectRecord(params: any): Promise<{ success: boolean; deletedId: string; message: string }> {
    try {
      const response = await this.ghlClient.deleteObjectRecord(params.schemaKey, params.recordId);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      
      return {
        success: true,
        deletedId: response.data.id,
        message: `Record deleted successfully from ${params.schemaKey}`
      };
    } catch (error) {
      throw new Error(`Failed to delete object record: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * SEARCH OBJECT RECORDS
   */
  private async searchObjectRecords(params: any): Promise<{ success: boolean; records: any[]; total: number; message: string }> {
    try {
      const searchData: GHLSearchObjectRecordsRequest = {
        locationId: params.locationId || this.ghlClient.getConfig().locationId,
        page: params.page || 1,
        pageLimit: params.pageLimit || 10,
        query: params.query,
        searchAfter: params.searchAfter || []
      };

      const response = await this.ghlClient.searchObjectRecords(params.schemaKey, searchData);
      
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }

      const records = Array.isArray(response.data.records) ? response.data.records : [];
      
      return {
        success: true,
        records,
        total: response.data.total,
        message: `Found ${records.length} records in ${params.schemaKey} (${response.data.total} total)`
      };
    } catch (error) {
      throw new Error(`Failed to search object records: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 