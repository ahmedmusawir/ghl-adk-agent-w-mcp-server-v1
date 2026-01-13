import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

export class CustomFieldV2Tools {
  constructor(private apiClient: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      // Custom Field Management Tools
      {
        name: 'get_custom_field_by_id',
        description: `Get a custom field or folder by its ID.

Retrieve detailed information about a specific custom field or folder.

Use Cases:
- View field configuration
- Get folder details
- Verify field settings
- Inspect field properties

Supports custom objects and company (business) fields.

Returns: Field or folder details with all configuration.

Related Tools: get_custom_fields_by_object_key, update_custom_field`,
        inputSchema: {
          id: z.string().describe('The ID of the custom field or folder to retrieve')
        }
      },
      {
        name: 'create_custom_field',
        description: `Create a new custom field for custom objects or company.

Add custom fields to collect specific data for your business needs.

Field Types Available:
- TEXT, LARGE_TEXT - Text input fields
- NUMERICAL, PHONE, MONETORY - Number/currency fields
- EMAIL - Email validation field
- DATE - Date picker
- CHECKBOX, SINGLE_OPTIONS, MULTIPLE_OPTIONS - Selection fields
- RADIO, TEXTBOX_LIST - Advanced selection
- FILE_UPLOAD - File attachment field

Use Cases:
- Add pet breed field to pet objects
- Create custom contact fields
- Build form fields for data collection
- Organize fields in folders

Examples:
- Text field: dataType="TEXT", fieldKey="custom_object.pet.breed"
- Dropdown: dataType="SINGLE_OPTIONS", options=[{key:"dog", label:"Dog"}]
- File upload: dataType="FILE_UPLOAD", acceptedFormats=".pdf", maxFileLimit=5

Returns: Created field with ID and configuration.

Related Tools: update_custom_field, get_custom_fields_by_object_key`,
        inputSchema: {
          dataType: z.enum(['TEXT', 'LARGE_TEXT', 'NUMERICAL', 'PHONE', 'MONETORY', 'CHECKBOX', 'SINGLE_OPTIONS', 'MULTIPLE_OPTIONS', 'DATE', 'TEXTBOX_LIST', 'FILE_UPLOAD', 'RADIO', 'EMAIL']).describe('Type of field to create'),
          fieldKey: z.string().describe('Field key. Format: "custom_object.{objectKey}.{fieldKey}" (e.g., "custom_object.pet.name")'),
          objectKey: z.string().describe('Object key. Format: "custom_object.{objectKey}" (e.g., "custom_object.pet")'),
          parentId: z.string().describe('ID of the parent folder for organization'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          name: z.string().optional().describe('Field name (optional for some field types)'),
          description: z.string().optional().describe('Description of the field'),
          placeholder: z.string().optional().describe('Placeholder text for the field'),
          showInForms: z.boolean().optional().describe('Whether the field should be shown in forms (default: true)'),
          options: z.array(z.object({
            key: z.string().describe('Key of the option'),
            label: z.string().describe('Label of the option'),
            url: z.string().optional().describe('URL associated with the option (RADIO type only)')
          })).optional().describe('Options for SINGLE_OPTIONS, MULTIPLE_OPTIONS, RADIO, CHECKBOX, TEXTBOX_LIST types'),
          acceptedFormats: z.enum(['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.gif', '.csv', '.xlsx', '.xls', 'all']).optional().describe('Allowed file formats (FILE_UPLOAD type only)'),
          maxFileLimit: z.number().optional().describe('Maximum file limit for uploads (FILE_UPLOAD type only)'),
          allowCustomOption: z.boolean().optional().describe('Allow custom option values (RADIO type only)')
        }
      },
      {
        name: 'update_custom_field',
        description: `Update an existing custom field by ID.

Modify field properties including name, description, options, and settings.

Use Cases:
- Update field labels
- Modify dropdown options
- Change file upload limits
- Update field descriptions

⚠️ Note: When updating options, provide ALL options you want to keep (replaces existing).

Returns: Updated field configuration.

Related Tools: get_custom_field_by_id, create_custom_field`,
        inputSchema: {
          id: z.string().describe('The ID of the custom field to update'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          name: z.string().optional().describe('Updated field name'),
          description: z.string().optional().describe('Updated description'),
          placeholder: z.string().optional().describe('Updated placeholder text'),
          showInForms: z.boolean().optional().describe('Whether field should be shown in forms'),
          options: z.array(z.object({
            key: z.string().describe('Key of the option'),
            label: z.string().describe('Label of the option'),
            url: z.string().optional().describe('URL (RADIO type only)')
          })).optional().describe('Updated options (replaces ALL existing - include all you want to keep)'),
          acceptedFormats: z.enum(['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png', '.gif', '.csv', '.xlsx', '.xls', 'all']).optional().describe('Updated file formats'),
          maxFileLimit: z.number().optional().describe('Updated max file limit')
        }
      },
      {
        name: 'delete_custom_field',
        description: `Delete a custom field by ID.

⚠️ WARNING: This is permanent and cannot be undone!
⚠️ All data stored in this field will be lost!

Use Cases:
- Remove unused fields
- Clean up test fields
- Reorganize field structure

Related Tools: get_custom_field_by_id, get_custom_fields_by_object_key`,
        inputSchema: {
          id: z.string().describe('The ID of the custom field to delete')
        }
      },
      {
        name: 'get_custom_fields_by_object_key',
        description: `Get all custom fields and folders for a specific object.

Retrieve complete field structure for custom objects or company.

Use Cases:
- List all fields for an object
- View field organization
- Discover available fields
- Prepare for data entry

Returns: All fields and folders with complete configuration.

Related Tools: get_custom_field_by_id, create_custom_field`,
        inputSchema: {
          objectKey: z.string().describe('Object key. Format: "custom_object.{objectKey}" (e.g., "custom_object.pet")'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      // Custom Field Folder Management Tools
      {
        name: 'create_custom_field_folder',
        description: `Create a new custom field folder.

Organize custom fields into folders for better structure.

Use Cases:
- Group related fields together
- Organize fields by category
- Improve field management
- Create logical field sections

Examples:
- "Pet Details" folder for pet-related fields
- "Contact Info" folder for contact fields

Returns: Created folder with ID.

Related Tools: update_custom_field_folder, delete_custom_field_folder`,
        inputSchema: {
          objectKey: z.string().describe('Object key. Format: "custom_object.{objectKey}" (e.g., "custom_object.pet")'),
          name: z.string().describe('Name of the folder'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'update_custom_field_folder',
        description: `Update the name of an existing custom field folder.

Rename folders to better reflect their contents.

Use Cases:
- Rename folders for clarity
- Update folder organization
- Improve field structure

Returns: Updated folder configuration.

Related Tools: create_custom_field_folder, get_custom_fields_by_object_key`,
        inputSchema: {
          id: z.string().describe('The ID of the folder to update'),
          name: z.string().describe('New name for the folder'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_custom_field_folder',
        description: `Delete a custom field folder.

⚠️ WARNING: This may affect fields within the folder!
⚠️ Fields may be moved or reorganized!

Use Cases:
- Remove empty folders
- Reorganize field structure
- Clean up folder hierarchy

Related Tools: create_custom_field_folder, get_custom_fields_by_object_key`,
        inputSchema: {
          id: z.string().describe('The ID of the folder to delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      }
    ];
  }

  async executeCustomFieldV2Tool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'get_custom_field_by_id': {
          const result = await this.apiClient.getCustomFieldV2ById(args.id);
          return {
            success: true,
            data: result.data,
            message: `Custom field/folder retrieved successfully`
          };
        }

        case 'create_custom_field': {
          const result = await this.apiClient.createCustomFieldV2({
            locationId: args.locationId || '',
            name: args.name,
            description: args.description,
            placeholder: args.placeholder,
            showInForms: args.showInForms ?? true,
            options: args.options,
            acceptedFormats: args.acceptedFormats,
            dataType: args.dataType,
            fieldKey: args.fieldKey,
            objectKey: args.objectKey,
            maxFileLimit: args.maxFileLimit,
            allowCustomOption: args.allowCustomOption,
            parentId: args.parentId
          });
          return {
            success: true,
            data: result.data,
            message: `Custom field '${args.fieldKey}' created successfully`
          };
        }

        case 'update_custom_field': {
          const result = await this.apiClient.updateCustomFieldV2(args.id, {
            locationId: args.locationId || '',
            name: args.name,
            description: args.description,
            placeholder: args.placeholder,
            showInForms: args.showInForms ?? true,
            options: args.options,
            acceptedFormats: args.acceptedFormats,
            maxFileLimit: args.maxFileLimit
          });
          return {
            success: true,
            data: result.data,
            message: `Custom field updated successfully`
          };
        }

        case 'delete_custom_field': {
          const result = await this.apiClient.deleteCustomFieldV2(args.id);
          return {
            success: true,
            data: result.data,
            message: `Custom field deleted successfully`
          };
        }

        case 'get_custom_fields_by_object_key': {
          const result = await this.apiClient.getCustomFieldsV2ByObjectKey({
            objectKey: args.objectKey,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Retrieved ${result.data?.fields?.length || 0} fields and ${result.data?.folders?.length || 0} folders for object '${args.objectKey}'`
          };
        }

        case 'create_custom_field_folder': {
          const result = await this.apiClient.createCustomFieldV2Folder({
            objectKey: args.objectKey,
            name: args.name,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Custom field folder '${args.name}' created successfully`
          };
        }

        case 'update_custom_field_folder': {
          const result = await this.apiClient.updateCustomFieldV2Folder(args.id, {
            name: args.name,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Custom field folder updated to '${args.name}'`
          };
        }

        case 'delete_custom_field_folder': {
          const result = await this.apiClient.deleteCustomFieldV2Folder({
            id: args.id,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Custom field folder deleted successfully`
          };
        }

        default:
          throw new Error(`Unknown custom field V2 tool: ${name}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Failed to execute ${name}`
      };
    }
  }
} 