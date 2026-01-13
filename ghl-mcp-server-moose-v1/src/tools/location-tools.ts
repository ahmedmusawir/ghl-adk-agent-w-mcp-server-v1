/**
 * GoHighLevel Location Management Tools
 * Implements all location/sub-account management functionality for the MCP server
 * 
 * IMPORTANT: Follows lessons learned from calendar-tools fix:
 * - Always use this.ghlClient.getConfig().locationId as fallback (never empty string)
 * - Return response.data (unwrapped) not response
 * - Comprehensive error handling for all HTTP codes
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPSearchLocationsParams,
  MCPGetLocationParams,
  MCPCreateLocationParams,
  MCPUpdateLocationParams,
  MCPDeleteLocationParams,
  MCPGetLocationTagsParams,
  MCPCreateLocationTagParams,
  MCPGetLocationTagParams,
  MCPUpdateLocationTagParams,
  MCPDeleteLocationTagParams,
  MCPSearchLocationTasksParams,
  MCPGetCustomFieldsParams,
  MCPCreateCustomFieldParams,
  MCPGetCustomFieldParams,
  MCPUpdateCustomFieldParams,
  MCPDeleteCustomFieldParams,
  MCPGetCustomValuesParams,
  MCPCreateCustomValueParams,
  MCPGetCustomValueParams,
  MCPUpdateCustomValueParams,
  MCPDeleteCustomValueParams,
  MCPGetLocationTemplatesParams,
  MCPDeleteLocationTemplateParams,
  MCPGetTimezonesParams,
  GHLLocation,
  GHLLocationDetailed,
  GHLLocationTag,
  GHLLocationCustomField,
  GHLLocationCustomValue
} from '../types/ghl-types.js';

/**
 * Location Tools Class
 * Implements MCP tools for location and sub-account management
 */
export class LocationTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all location operations
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'search_locations',
        description: `Search for locations/sub-accounts in GoHighLevel with flexible filtering.

Locations (also called sub-accounts) are individual business accounts within an agency. Each location has its own contacts, calendars, workflows, and settings.

Use Cases:
- Find locations by company/agency ID
- Search for specific locations by email
- List all locations with pagination
- Discover location IDs for other operations

Parameters:
- companyId: (optional) Filter by specific company/agency
- email: (optional) Search by location email address
- skip: Pagination offset (default: 0)
- limit: Max results to return (default: 10)
- order: Sort order 'asc' or 'desc' (default: 'asc')

Returns: Array of locations with IDs, names, contact info, and basic settings.

Best Practices:
- Use pagination for large agency accounts
- Filter by companyId to narrow results
- Save location IDs for subsequent operations

Related Tools: get_location (get full details), create_location`,
        inputSchema: {
          companyId: z.string().optional().describe('Company/Agency ID to filter locations'),
          email: z.string().email().optional().describe('Filter by location email address'),
          skip: z.number().optional().describe('Number of results to skip for pagination (default: 0)'),
          limit: z.number().optional().describe('Maximum number of locations to return (default: 10, max: 100)'),
          order: z.enum(['asc', 'desc']).optional().describe('Sort order by creation date (default: asc)')
        }
      },
      {
        name: 'get_location',
        description: `Get detailed information about a specific location/sub-account by ID.

Retrieves complete location profile including business details, settings, integrations, and configuration.

Use Cases:
- Get full location details before updates
- Verify location exists and is accessible
- Check location settings and configuration
- Retrieve business contact information

Parameters:
- locationId: The unique identifier for the location

Returns: Complete location object with all settings, integrations, business info, and metadata.

Best Practices:
- Use this before update_location to see current values
- Verify locationId from search_locations first
- Check timezone and country settings for proper configuration

Related Tools: search_locations (find IDs), update_location, delete_location`,
        inputSchema: {
          locationId: z.string().describe('The unique ID of the location to retrieve')
        }
      },
      {
        name: 'create_location',
        description: `Create a new sub-account/location in GoHighLevel.

⚠️ IMPORTANT: Requires Agency Pro plan and location creation permissions.

Creates a complete new location with business details, prospect information, and optional snapshot template.

Use Cases:
- Onboard new client businesses
- Set up new franchise locations
- Create test/sandbox locations
- Deploy pre-configured location templates

Required Parameters:
- name: Business/location name
- companyId: Parent company/agency ID
- prospectInfo: Contact details (firstName, lastName, email)

Optional Parameters:
- phone: Business phone with country code (e.g., +14155551234)
- address, city, state, country, postalCode: Business address
- website: Business website URL
- timezone: Business timezone (use get_timezones for valid values)
- snapshotId: Template to load into location

Returns: Created location with generated ID and all settings.

Known Limitations:
- Account plan may limit number of locations
- Requires specific agency permissions
- Snapshot must be compatible with account type

Best Practices:
- Always specify timezone (defaults can cause issues)
- Use 2-letter country codes (US, CA, GB, etc.)
- Validate timezone with get_timezones tool first
- Include complete address for proper localization

Related Tools: get_timezones (validate timezone), update_location, delete_location`,
        inputSchema: {
          name: z.string().describe('Name of the sub-account/location (e.g., "Acme Corp - NYC")'),
          companyId: z.string().describe('Parent company/agency ID'),
          prospectInfo: z.object({
            firstName: z.string().describe('Primary contact first name'),
            lastName: z.string().describe('Primary contact last name'),
            email: z.string().email().describe('Primary contact email address')
          }).describe('Primary contact information for the location'),
          phone: z.string().optional().describe('Business phone with country code (e.g., +14155551234)'),
          address: z.string().optional().describe('Street address of the business'),
          city: z.string().optional().describe('City where business is located'),
          state: z.string().optional().describe('State/province (e.g., "CA", "New York")'),
          country: z.string().optional().describe('2-letter country code (e.g., US, CA, GB)'),
          postalCode: z.string().optional().describe('Postal/ZIP code'),
          website: z.string().url().optional().describe('Business website URL'),
          timezone: z.string().optional().describe('Business timezone (e.g., "America/New_York", "UTC"). Use get_timezones for valid values'),
          snapshotId: z.string().optional().describe('Snapshot/template ID to load into the location')
        }
      },
      {
        name: 'update_location',
        description: `Update an existing sub-account/location in GoHighLevel.

Modify location settings, business information, and configuration. Only provided fields will be updated.

Use Cases:
- Update business contact information
- Change location timezone or address
- Modify location name or website
- Update company assignment

Parameters:
- locationId: The location to update (required)
- name: Updated business name
- companyId: Move to different company/agency
- phone, address, city, state, country, postalCode: Updated business details
- website: Updated website URL
- timezone: Updated timezone

Returns: Updated location object with all current settings.

Best Practices:
- Use get_location first to see current values
- Only include fields you want to change
- Validate timezone with get_timezones before updating
- Verify companyId exists if changing parent company

Related Tools: get_location (see current values), get_timezones (validate timezone)`,
        inputSchema: {
          locationId: z.string().describe('The unique ID of the location to update'),
          name: z.string().optional().describe('Updated name of the sub-account/location'),
          companyId: z.string().optional().describe('Move location to different company/agency'),
          phone: z.string().optional().describe('Updated phone number with country code'),
          address: z.string().optional().describe('Updated street address'),
          city: z.string().optional().describe('Updated city'),
          state: z.string().optional().describe('Updated state/province'),
          country: z.string().optional().describe('Updated 2-letter country code'),
          postalCode: z.string().optional().describe('Updated postal/ZIP code'),
          website: z.string().url().optional().describe('Updated website URL'),
          timezone: z.string().optional().describe('Updated timezone (use get_timezones for valid values)')
        }
      },
      {
        name: 'delete_location',
        description: `Delete a sub-account/location from GoHighLevel.

⚠️ WARNING: This action is PERMANENT and cannot be undone!

Deletes the location and optionally its associated Twilio account. All data including contacts, conversations, appointments, and workflows will be permanently removed.

Use Cases:
- Remove test/sandbox locations
- Clean up inactive client accounts
- Delete duplicate locations
- Decommission closed businesses

Parameters:
- locationId: The location to delete (required)
- deleteTwilioAccount: Whether to also delete associated Twilio account (default: false)

⚠️ Data Loss Warning:
- All contacts and their history
- All conversations and messages
- All appointments and calendars
- All workflows and automations
- All custom fields and values
- All integrations and settings

Best Practices:
- Export important data before deletion
- Verify locationId is correct (use get_location first)
- Consider archiving instead of deleting
- Only set deleteTwilioAccount=true if you're sure

Related Tools: get_location (verify before delete), search_locations`,
        inputSchema: {
          locationId: z.string().describe('The unique ID of the location to delete'),
          deleteTwilioAccount: z.boolean().optional().describe('Whether to delete associated Twilio account (default: false)')
        }
      },

      // ============================================================================
      // TAG SYSTEM (4 tools)
      // ============================================================================

      {
        name: 'get_location_tags',
        description: `Get all tags for a specific location.

Tags help organize and categorize contacts, opportunities, and other resources within a location.

Use Cases:
- List all available tags in a location
- Find tag IDs for filtering operations
- Audit tag usage and organization
- Discover tag names before creating new ones

Parameters:
- locationId: The location to get tags from

Returns: Array of tags with IDs, names, and metadata.

Best Practices:
- Check existing tags before creating duplicates
- Use tag IDs in contact/opportunity filtering
- Tags are location-specific (not shared across locations)

Related Tools: create_location_tag, update_location_tag, delete_location_tag`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)')
        }
      },
      {
        name: 'create_location_tag',
        description: `Create a new tag for a location.

Tags help organize contacts, opportunities, and other resources. Each tag has a unique name within the location.

Use Cases:
- Create tags for contact segmentation
- Set up opportunity categorization
- Organize resources by type or status
- Build tag-based automation triggers

Parameters:
- locationId: The location to create tag in
- name: Tag name (must be unique within location)

Returns: Created tag with generated ID.

Known Limitations:
- Tag names must be unique within the location
- Some special characters may not be allowed
- Tag name length limits may apply

Best Practices:
- Use consistent naming conventions (e.g., "Lead - Hot", "Customer - VIP")
- Check existing tags with get_location_tags first
- Use descriptive names for clarity
- Consider tag hierarchy in naming (Category - Subcategory)

Related Tools: get_location_tags (check existing), update_location_tag, delete_location_tag`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          name: z.string().describe('Name of the tag (must be unique within location)')
        }
      },
      {
        name: 'get_location_tag',
        description: `Get a specific location tag by ID.

Retrieves detailed information about a single tag.

Use Cases:
- Verify tag exists before operations
- Get tag details for display
- Check tag properties

Parameters:
- locationId: The location containing the tag
- tagId: The tag to retrieve

Returns: Tag object with ID, name, and metadata.

Related Tools: get_location_tags (list all tags), update_location_tag, delete_location_tag`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          tagId: z.string().describe('The tag ID to retrieve')
        }
      },
      {
        name: 'update_location_tag',
        description: `Update an existing location tag.

Modify tag name while preserving all tag assignments to contacts and opportunities.

Use Cases:
- Fix typos in tag names
- Rename tags for better organization
- Update tag naming conventions
- Consolidate similar tag names

Parameters:
- locationId: The location containing the tag
- tagId: The tag to update
- name: New tag name (must be unique)

Returns: Updated tag with new name.

Best Practices:
- Use get_location_tags to find tagId first
- Verify new name doesn't conflict with existing tags
- Tag assignments are preserved after rename
- Consider impact on automations using tag names

Related Tools: get_location_tags (find tagId), create_location_tag, delete_location_tag`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          tagId: z.string().describe('The tag ID to update'),
          name: z.string().describe('Updated name for the tag (must be unique within location)')
        }
      },
      {
        name: 'delete_location_tag',
        description: `Delete a location tag.

⚠️ WARNING: This removes the tag from all contacts and opportunities!

Permanently deletes the tag and removes it from all resources it's assigned to.

Use Cases:
- Remove unused or obsolete tags
- Clean up duplicate tags
- Simplify tag organization
- Remove test tags

Parameters:
- locationId: The location containing the tag
- tagId: The tag to delete

⚠️ Impact:
- Tag removed from all contacts
- Tag removed from all opportunities
- Tag-based automations may break
- Cannot be undone

Best Practices:
- Export contacts with this tag before deletion
- Update automations that reference this tag
- Consider renaming instead of deleting
- Verify tagId with get_location_tags first

Related Tools: get_location_tags (find tagId), update_location_tag (rename instead)`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          tagId: z.string().describe('The tag ID to delete')
        }
      },

      // ============================================================================
      // LOCATION TASKS (1 tool)
      // ============================================================================

      {
        name: 'search_location_tasks',
        description: `Search tasks within a location with advanced filtering.

Tasks are action items assigned to contacts or team members within a location.

Use Cases:
- Find tasks by contact
- List tasks assigned to specific users
- Filter completed vs pending tasks
- Search task content

Parameters:
- locationId: The location to search (required)
- contactId: Filter by contact IDs (array)
- completed: Filter by completion status (boolean)
- assignedTo: Filter by assigned user IDs (array)
- query: Search task content
- limit: Max results (default: 25)
- skip: Pagination offset (default: 0)
- businessId: Filter by business ID

Returns: Array of tasks with details, assignments, and status.

Best Practices:
- Use filters to narrow large result sets
- Paginate for locations with many tasks
- Combine filters for precise results

Related Tools: Contact task tools for individual contact task management`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          contactId: z.array(z.string()).optional().describe('Filter by specific contact IDs'),
          completed: z.boolean().optional().describe('Filter by completion status'),
          assignedTo: z.array(z.string()).optional().describe('Filter by assigned user IDs'),
          query: z.string().optional().describe('Search query for task content'),
          limit: z.number().optional().describe('Maximum number of tasks to return (default: 25)'),
          skip: z.number().optional().describe('Number of tasks to skip for pagination (default: 0)'),
          businessId: z.string().optional().describe('Business ID filter')
        }
      },

      // ============================================================================
      // CUSTOM FIELDS (3 tools)
      // ============================================================================

      {
        name: 'get_location_custom_fields',
        description: `Get custom fields for a location, optionally filtered by model type.

Custom fields allow you to store additional data on contacts and opportunities beyond the standard fields.

Use Cases:
- List all custom fields in a location
- Find custom field IDs for data entry
- Audit custom field configuration
- Discover field types and options

Parameters:
- locationId: The location to get custom fields from
- model: Filter by 'contact', 'opportunity', or 'all' (default: 'all')

Returns: Array of custom field definitions with IDs, names, types, and options.

Field Types:
- TEXT: Single-line text input
- TEXTAREA: Multi-line text input
- NUMBER: Numeric values
- CHECKBOX: Boolean yes/no
- SELECT: Dropdown with predefined options
- RADIO: Radio button selection
- DATE: Date picker

Best Practices:
- Check existing fields before creating new ones
- Note field IDs for setting custom values
- Understand field types for proper data entry
- Custom fields are location-specific

Related Tools: create_location_custom_field, update_location_custom_field, get_location_custom_values`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          model: z.enum(['contact', 'opportunity', 'all']).optional().describe('Filter by model type (default: all)')
        }
      },
      {
        name: 'create_location_custom_field',
        description: `Create a new custom field for a location.

Custom fields extend the data model for contacts or opportunities with business-specific information.

Use Cases:
- Add industry-specific fields (e.g., "Property Type" for real estate)
- Track custom metrics (e.g., "Lifetime Value", "Risk Score")
- Store additional contact details (e.g., "Preferred Contact Time")
- Create dropdown selections for categorization

Required Parameters:
- locationId: The location to create field in
- name: Field name/label
- dataType: Field type (TEXT, TEXTAREA, NUMBER, CHECKBOX, SELECT, RADIO, DATE)
- model: 'contact' or 'opportunity'

Optional Parameters:
- placeholder: Hint text shown in empty field
- position: Display order (default: 0)

Returns: Created custom field with generated ID.

Field Type Guidelines:
- TEXT: Short text (names, IDs, codes)
- TEXTAREA: Long text (notes, descriptions)
- NUMBER: Numeric values (prices, scores, counts)
- CHECKBOX: Yes/no, true/false
- SELECT: Choose one from dropdown list
- RADIO: Choose one from radio buttons
- DATE: Date selection

Best Practices:
- Use descriptive names (shown to users)
- Choose appropriate dataType for validation
- Set position for logical field ordering
- Check existing fields to avoid duplicates

Related Tools: get_location_custom_fields (check existing), update_location_custom_field, create_location_custom_value (set values)`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          name: z.string().describe('Name/label of the custom field (shown to users)'),
          dataType: z.enum(['TEXT', 'TEXTAREA', 'NUMBER', 'CHECKBOX', 'SELECT', 'RADIO', 'DATE']).describe('Data type of the field'),
          model: z.enum(['contact', 'opportunity']).describe('Model to create the field for'),
          placeholder: z.string().optional().describe('Placeholder text shown in empty field'),
          position: z.number().optional().describe('Display order/position (default: 0)')
        }
      },
      {
        name: 'get_location_custom_field',
        description: `Get a specific custom field by ID.

Retrieves detailed information about a single custom field definition.

Use Cases:
- Verify custom field exists
- Check field type and options
- Get field configuration details

Parameters:
- locationId: The location containing the field
- customFieldId: The field to retrieve

Returns: Custom field definition with type, options, and settings.

Related Tools: get_location_custom_fields (list all), update_location_custom_field`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customFieldId: z.string().describe('The custom field ID to retrieve')
        }
      },
      {
        name: 'update_location_custom_field',
        description: `Update an existing custom field.

Modify custom field properties like name, placeholder, and position. Field type (dataType) cannot be changed.

Use Cases:
- Fix typos in field names
- Update placeholder text
- Reorder fields by changing position
- Improve field labels for clarity

Parameters:
- locationId: The location containing the field
- customFieldId: The field to update
- name: Updated field name/label
- placeholder: Updated placeholder text
- position: Updated display order

Returns: Updated custom field definition.

Limitations:
- Cannot change dataType after creation
- Cannot change model (contact/opportunity)
- Existing data is preserved

Best Practices:
- Use get_location_custom_fields to find customFieldId
- Test changes in non-production location first
- Update field names carefully (may affect integrations)
- Preserve data integrity when renaming

Related Tools: get_location_custom_fields (find fieldId), create_location_custom_field`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customFieldId: z.string().describe('The custom field ID to update'),
          name: z.string().describe('Updated name/label of the custom field'),
          placeholder: z.string().optional().describe('Updated placeholder text'),
          position: z.number().optional().describe('Updated display order/position')
        }
      },
      {
        name: 'delete_location_custom_field',
        description: `Delete a custom field from a location.

⚠️ WARNING: This removes the field and ALL its data!

Permanently deletes a custom field definition and all values stored in it across all contacts/opportunities.

Use Cases:
- Remove obsolete custom fields
- Clean up unused fields
- Simplify data model

Parameters:
- locationId: The location containing the field
- customFieldId: The field to delete

⚠️ Impact:
- Field definition permanently deleted
- All stored values permanently lost
- Cannot be recovered
- May affect integrations and reports

Best Practices:
- Export all field data before deletion
- Verify field is truly unused
- Check integrations that may reference this field
- Consider hiding field instead of deleting

Related Tools: get_location_custom_fields (find fieldId), get_location_custom_values (export data first)`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customFieldId: z.string().describe('The custom field ID to delete')
        }
      },

      // ============================================================================
      // CUSTOM VALUES (3 tools)
      // ============================================================================

      {
        name: 'get_location_custom_values',
        description: `Get custom field values for a location.

Retrieves custom values (location-level variables like domain, company info, etc).

Use Cases:
- View location custom values
- Get value IDs for updates
- Audit custom value usage

Returns: Array of custom values with IDs, names, keys, and values (if populated).

NOTE: GHL API omits the 'value' field if empty. Use get_location_custom_value (singular) with ID to get full details.

Related Tools: get_location_custom_value (get single by ID), update_location_custom_value`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location)'),
          limit: z.number().optional().describe('Max number of values to return (default: 25, use smaller values to avoid timeout)')
        }
      },
      {
        name: 'create_location_custom_value',
        description: `Create/set a custom field value for a location.

Sets the value for a custom field. This is typically done at the contact or opportunity level.

Use Cases:
- Set custom field values during data import
- Initialize custom fields for new records
- Bulk update custom field values
- Set default values

Parameters:
- locationId: The location ID
- name: Custom field name
- value: Value to set

Returns: Created custom value record.

Best Practices:
- Verify field exists with get_location_custom_fields first
- Ensure value matches field dataType
- Use appropriate format for dates and numbers
- Check field options for SELECT/RADIO types

Related Tools: get_location_custom_fields (verify field), update_location_custom_value, get_location_custom_values`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          name: z.string().describe('Name of the custom field'),
          value: z.string().describe('Value to set for the custom field')
        }
      },
      {
        name: 'get_location_custom_value',
        description: `Get a specific custom value by ID.

Retrieves a single custom field value record.

Use Cases:
- Verify custom value exists
- Get current value for a field
- Check value details

Parameters:
- locationId: The location ID
- customValueId: The custom value record to retrieve

Returns: Custom value record with field name and value.

Related Tools: get_location_custom_values (list all), update_location_custom_value`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customValueId: z.string().describe('The custom value ID to retrieve')
        }
      },
      {
        name: 'update_location_custom_value',
        description: `Update an existing custom field value.

Modify the value stored in a custom field.

Use Cases:
- Update custom field data
- Correct data entry errors
- Bulk update field values
- Sync external data changes

Parameters:
- locationId: The location ID
- customValueId: The custom value record to update
- name: Custom field name
- value: New value

Returns: Updated custom value record.

Best Practices:
- Use get_location_custom_values to find customValueId
- Ensure new value matches field dataType
- Validate value format for dates and numbers
- Check field options for SELECT/RADIO types

Related Tools: get_location_custom_values (find valueId), create_location_custom_value, get_location_custom_fields`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customValueId: z.string().describe('The custom value ID to update'),
          name: z.string().describe('Name of the custom field'),
          value: z.string().describe('New value for the custom field')
        }
      },
      {
        name: 'delete_location_custom_value',
        description: `Delete a custom value from a location.

⚠️ WARNING: This permanently removes the stored value!

Deletes a specific custom field value. The field definition remains, only the value is removed.

Use Cases:
- Clear incorrect data
- Remove obsolete values
- Reset field to empty state

Parameters:
- locationId: The location ID
- customValueId: The custom value record to delete

⚠️ Impact:
- Value permanently deleted
- Field definition remains intact
- Cannot be recovered
- Field will be empty after deletion

Best Practices:
- Export value before deletion if needed
- Verify correct customValueId
- Consider updating to empty string instead
- Check if value is referenced elsewhere

Related Tools: get_location_custom_values (find valueId), update_location_custom_value (set to empty instead)`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          customValueId: z.string().describe('The custom value ID to delete')
        }
      },

      // ============================================================================
      // TEMPLATES & SETTINGS (3 tools)
      // ============================================================================

      {
        name: 'get_location_templates',
        description: `Get SMS/Email/WhatsApp templates for a location.

Templates are pre-defined message formats used in campaigns, workflows, and manual messaging.

PARAMETERS:
- locationId: Your GHL location ID (required)
- originId: Origin ID (optional - defaults to locationId if not provided)
- type: Filter by 'sms', 'email', or 'whatsapp'
- deleted: Include deleted templates (default: false)
- skip: Pagination offset (default: 0)
- limit: Max results (default: 25)

USAGE EXAMPLES:

Simple (recommended):
{
  "locationId": "4rKuULHASyQ99nwdL1XH"
}

With filters:
{
  "locationId": "4rKuULHASyQ99nwdL1XH",
  "type": "sms",
  "limit": 20
}

Explicit originId (rare):
{
  "locationId": "4rKuULHASyQ99nwdL1XH",
  "originId": "differentOriginId123"
}

RETURNS: Array of templates with IDs, names, content, and metadata.

Best Practices:
- Usually just provide locationId (originId auto-populated)
- Filter by type to narrow results
- Use pagination for locations with many templates
- Note template IDs for campaign/workflow use

Related Tools: delete_location_template`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          originId: z.string().optional().describe('Origin ID (optional - defaults to locationId if not provided)'),
          type: z.enum(['sms', 'email', 'whatsapp']).optional().describe('Filter by template type'),
          deleted: z.boolean().optional().describe('Include deleted templates (default: false)'),
          skip: z.number().optional().describe('Number to skip for pagination (default: 0)'),
          limit: z.number().optional().describe('Maximum number to return (default: 25, max: 100)')
        }
      },
      {
        name: 'delete_location_template',
        description: `Delete a template from a location.

⚠️ WARNING: This may break campaigns and workflows using this template!

Permanently deletes a message template. Active campaigns and workflows using this template may fail.

Use Cases:
- Remove obsolete templates
- Clean up test templates
- Delete duplicate templates
- Remove unused templates

Parameters:
- locationId: The location ID
- templateId: The template to delete

⚠️ Impact:
- Template cannot be recovered
- Campaigns using this template may break
- Workflows using this template may fail
- Scheduled messages using this template may fail

Best Practices:
- Check template usage before deletion
- Update campaigns/workflows first
- Consider archiving instead of deleting
- Export template content before deletion

Related Tools: get_location_templates (find templateId)`,
        inputSchema: {
          locationId: z.string().optional().describe('The location ID (optional - uses configured location if not provided)'),
          templateId: z.string().describe('The template ID to delete')
        }
      },

      {
        name: 'get_timezones',
        description: `Get list of valid timezone identifiers for location configuration.

Returns all supported timezone identifiers in IANA format (e.g., "America/New_York", "Europe/London").

Use Cases:
- Validate timezone before creating/updating location
- Display timezone options to users
- Convert between timezone formats
- Reference for location configuration

Parameters: None required

Returns: Array of timezone objects with identifiers, offsets, and display names.

Timezone Format:
- Uses IANA timezone database format
- Examples: "America/New_York", "Europe/London", "Asia/Tokyo", "UTC"
- Includes UTC offset information
- Handles daylight saving time automatically

Best Practices:
- Use this before create_location or update_location
- Store timezone identifier, not display name
- Consider user's actual timezone, not just country
- UTC is safe default but may not be ideal for users

Related Tools: create_location (requires timezone), update_location (change timezone)`,
        inputSchema: {}
      }
    ];
  }

  /**
   * Execute location tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      // Location Management
      case 'search_locations':
        return this.searchLocations(args as MCPSearchLocationsParams);
      case 'get_location':
        return this.getLocation(args as MCPGetLocationParams);
      case 'create_location':
        return this.createLocation(args as MCPCreateLocationParams);
      case 'update_location':
        return this.updateLocation(args as MCPUpdateLocationParams);
      case 'delete_location':
        return this.deleteLocation(args as MCPDeleteLocationParams);

      // Location Tags
      case 'get_location_tags':
        return this.getLocationTags(args as MCPGetLocationTagsParams);
      case 'create_location_tag':
        return this.createLocationTag(args as MCPCreateLocationTagParams);
      case 'get_location_tag':
        return this.getLocationTag(args as MCPGetLocationTagParams);
      case 'update_location_tag':
        return this.updateLocationTag(args as MCPUpdateLocationTagParams);
      case 'delete_location_tag':
        return this.deleteLocationTag(args as MCPDeleteLocationTagParams);

      // Location Tasks
      case 'search_location_tasks':
        return this.searchLocationTasks(args as MCPSearchLocationTasksParams);

      // Custom Fields
      case 'get_location_custom_fields':
        return this.getLocationCustomFields(args as MCPGetCustomFieldsParams);
      case 'create_location_custom_field':
        return this.createLocationCustomField(args as MCPCreateCustomFieldParams);
      case 'get_location_custom_field':
        return this.getLocationCustomField(args as MCPGetCustomFieldParams);
      case 'update_location_custom_field':
        return this.updateLocationCustomField(args as MCPUpdateCustomFieldParams);
      case 'delete_location_custom_field':
        return this.deleteLocationCustomField(args as MCPDeleteCustomFieldParams);

      // Custom Values
      case 'get_location_custom_values':
        return this.getLocationCustomValues(args as MCPGetCustomValuesParams);
      case 'create_location_custom_value':
        return this.createLocationCustomValue(args as MCPCreateCustomValueParams);
      case 'get_location_custom_value':
        return this.getLocationCustomValue(args as MCPGetCustomValueParams);
      case 'update_location_custom_value':
        return this.updateLocationCustomValue(args as MCPUpdateCustomValueParams);
      case 'delete_location_custom_value':
        return this.deleteLocationCustomValue(args as MCPDeleteCustomValueParams);

      // Templates
      case 'get_location_templates':
        return this.getLocationTemplates(args as MCPGetLocationTemplatesParams);
      case 'delete_location_template':
        return this.deleteLocationTemplate(args as MCPDeleteLocationTemplateParams);

      // Timezones
      case 'get_timezones':
        return this.getTimezones(args as MCPGetTimezonesParams);

      default:
        throw new Error(`Unknown location tool: ${name}`);
    }
  }

  private async searchLocations(params: MCPSearchLocationsParams): Promise<{ success: boolean; locations: GHLLocation[]; message: string }> {
    try {
      const response = await this.ghlClient.searchLocations(params);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const locations = response.data.locations || [];
      return {
        success: true,
        locations,
        message: `Found ${locations.length} locations`
      };
    } catch (error) {
      throw new Error(`Failed to search locations: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocation(params: MCPGetLocationParams): Promise<{ success: boolean; location: GHLLocationDetailed; message: string }> {
    try {
      const response = await this.ghlClient.getLocationById(params.locationId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        location: response.data.location,
        message: 'Location retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get location: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationTags(params: MCPGetLocationTagsParams): Promise<{ success: boolean; tags: GHLLocationTag[]; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationTags(locationId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const tags = response.data.tags || [];
      return {
        success: true,
        tags,
        message: `Retrieved ${tags.length} location tags`
      };
    } catch (error) {
      throw new Error(`Failed to get location tags: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createLocation(params: MCPCreateLocationParams): Promise<{ success: boolean; location: GHLLocationDetailed; message: string }> {
    try {
      const response = await this.ghlClient.createLocation(params);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        location: response.data,
        message: `Location "${params.name}" created successfully`
      };
    } catch (error) {
      throw new Error(`Failed to create location: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateLocation(params: MCPUpdateLocationParams): Promise<{ success: boolean; location: GHLLocationDetailed; message: string }> {
    try {
      const { locationId, ...updateData } = params;
      const response = await this.ghlClient.updateLocation(locationId, updateData);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        location: response.data,
        message: 'Location updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update location: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLocation(params: MCPDeleteLocationParams): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.deleteLocation(params.locationId, params.deleteTwilioAccount);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        message: response.data.message || 'Location deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete location: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createLocationTag(params: MCPCreateLocationTagParams): Promise<{ success: boolean; tag: GHLLocationTag; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.createLocationTag(locationId, { name: params.name });
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        tag: response.data.tag,
        message: `Tag "${params.name}" created successfully`
      };
    } catch (error) {
      throw new Error(`Failed to create location tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationTag(params: MCPGetLocationTagParams): Promise<{ success: boolean; tag: GHLLocationTag; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationTag(locationId, params.tagId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        tag: response.data.tag,
        message: 'Location tag retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get location tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateLocationTag(params: MCPUpdateLocationTagParams): Promise<{ success: boolean; tag: GHLLocationTag; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.updateLocationTag(locationId, params.tagId, { name: params.name });
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        tag: response.data.tag,
        message: 'Location tag updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update location tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLocationTag(params: MCPDeleteLocationTagParams): Promise<{ success: boolean; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.deleteLocationTag(locationId, params.tagId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        message: 'Location tag deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete location tag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async searchLocationTasks(params: MCPSearchLocationTasksParams): Promise<{ success: boolean; tasks: any[]; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, ...searchParams } = params;
      const response = await this.ghlClient.searchLocationTasks(locationId, searchParams);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const tasks = response.data.tasks || [];
      return {
        success: true,
        tasks,
        message: `Found ${tasks.length} tasks`
      };
    } catch (error) {
      throw new Error(`Failed to search location tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationCustomFields(params: MCPGetCustomFieldsParams): Promise<{ success: boolean; customFields: GHLLocationCustomField[]; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationCustomFields(locationId, params.model);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const customFields = response.data.customFields || [];
      return {
        success: true,
        customFields,
        message: `Retrieved ${customFields.length} custom fields`
      };
    } catch (error) {
      throw new Error(`Failed to get custom fields: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createLocationCustomField(params: MCPCreateCustomFieldParams): Promise<{ success: boolean; customField: GHLLocationCustomField; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, ...fieldData } = params;
      const response = await this.ghlClient.createLocationCustomField(locationId, fieldData);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customField: response.data.customField,
        message: `Custom field "${params.name}" created successfully`
      };
    } catch (error) {
      throw new Error(`Failed to create custom field: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationCustomField(params: MCPGetCustomFieldParams): Promise<{ success: boolean; customField: GHLLocationCustomField; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationCustomField(locationId, params.customFieldId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customField: response.data.customField,
        message: 'Custom field retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get custom field: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateLocationCustomField(params: MCPUpdateCustomFieldParams): Promise<{ success: boolean; customField: GHLLocationCustomField; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, customFieldId, ...fieldData } = params;
      const response = await this.ghlClient.updateLocationCustomField(locationId, customFieldId, fieldData);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customField: response.data.customField,
        message: 'Custom field updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update custom field: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLocationCustomField(params: MCPDeleteCustomFieldParams): Promise<{ success: boolean; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.deleteLocationCustomField(locationId, params.customFieldId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        message: 'Custom field deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete custom field: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationCustomValues(params: MCPGetCustomValuesParams): Promise<{ success: boolean; customValues: GHLLocationCustomValue[]; total: number; returned: number; hasMore: boolean; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationCustomValues(locationId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const allCustomValues = response.data.customValues || [];
      
      // Apply limit to prevent response size issues
      const limit = params.limit || 25;
      const customValues = allCustomValues.slice(0, limit);
      const hasMore = allCustomValues.length > limit;
      
      // DEBUG: Log count only (not full response to avoid log bloat)
      process.stderr.write(`[DEBUG get_location_custom_values] Total: ${allCustomValues.length}, Returning: ${customValues.length}\n`);
      
      return {
        success: true,
        customValues,
        total: allCustomValues.length,
        returned: customValues.length,
        hasMore,
        message: `Retrieved ${customValues.length} of ${allCustomValues.length} custom values${hasMore ? ' (use limit parameter to get more)' : ''}`
      };
    } catch (error) {
      throw new Error(`Failed to get custom values: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async createLocationCustomValue(params: MCPCreateCustomValueParams): Promise<{ success: boolean; customValue: GHLLocationCustomValue; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, ...valueData } = params;
      const response = await this.ghlClient.createLocationCustomValue(locationId, valueData);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customValue: response.data.customValue,
        message: `Custom value "${params.name}" created successfully`
      };
    } catch (error) {
      throw new Error(`Failed to create custom value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationCustomValue(params: MCPGetCustomValueParams): Promise<{ success: boolean; customValue: GHLLocationCustomValue; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getLocationCustomValue(locationId, params.customValueId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customValue: response.data.customValue,
        message: 'Custom value retrieved successfully'
      };
    } catch (error) {
      throw new Error(`Failed to get custom value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async updateLocationCustomValue(params: MCPUpdateCustomValueParams): Promise<{ success: boolean; customValue: GHLLocationCustomValue; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, customValueId, ...valueData } = params;
      const response = await this.ghlClient.updateLocationCustomValue(locationId, customValueId, valueData);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        customValue: response.data.customValue,
        message: 'Custom value updated successfully'
      };
    } catch (error) {
      throw new Error(`Failed to update custom value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLocationCustomValue(params: MCPDeleteCustomValueParams): Promise<{ success: boolean; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.deleteLocationCustomValue(locationId, params.customValueId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        message: 'Custom value deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete custom value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getLocationTemplates(params: MCPGetLocationTemplatesParams): Promise<{ success: boolean; templates: any[]; totalCount: number; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const { locationId: _, ...templateParams } = params;
      // Auto-populate originId with locationId if not provided
      const originId = params.originId || locationId;
      const response = await this.ghlClient.getLocationTemplates(locationId, { ...templateParams, originId });
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const templates = response.data.templates || [];
      const totalCount = response.data.totalCount || templates.length;
      return {
        success: true,
        templates,
        totalCount,
        message: `Retrieved ${templates.length} templates (${totalCount} total)`
      };
    } catch (error) {
      throw new Error(`Failed to get location templates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async deleteLocationTemplate(params: MCPDeleteLocationTemplateParams): Promise<{ success: boolean; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.deleteLocationTemplate(locationId, params.templateId);
      if (!response.success) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      return {
        success: true,
        message: 'Template deleted successfully'
      };
    } catch (error) {
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async getTimezones(params: MCPGetTimezonesParams): Promise<{ success: boolean; timezones: string[]; message: string }> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const response = await this.ghlClient.getTimezones(locationId);
      if (!response.success || !response.data) {
        const errorMsg = response.error?.message || 'Unknown API error';
        throw new Error(`API request failed: ${errorMsg}`);
      }
      const timezones = Array.isArray(response.data) ? response.data : [];
      return {
        success: true,
        timezones,
        message: `Retrieved ${timezones.length} available timezones`
      };
    } catch (error) {
      throw new Error(`Failed to get timezones: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 