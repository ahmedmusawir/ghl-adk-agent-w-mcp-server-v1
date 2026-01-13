import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

export class AssociationTools {
  constructor(private apiClient: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      // Association Management Tools
      {
        name: 'get_all_associations',
        description: `Get all associations for a location.

Returns both system-defined and user-defined associations.

Use Cases:
- List all available associations
- Discover relationship types
- View association configurations
- Prepare for creating relations

Returns: Array of associations with IDs, keys, and object mappings.

Related Tools: create_association, get_association_by_id`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          skip: z.number().min(0).optional().describe('Number of records to skip for pagination (default: 0)'),
          limit: z.number().min(1).max(100).optional().describe('Maximum number of records to return (default: 20, max: 100)')
        }
      },
      {
        name: 'create_association',
        description: `Create a new association between two object types.

Define relationship types between entities like contacts, custom objects, and opportunities.

Use Cases:
- Link students to teachers
- Connect pets to owners (contacts)
- Associate tickets to products
- Map custom business relationships

Examples:
- Student-Teacher: key="student_teacher", firstObjectKey="custom_objects.student", secondObjectKey="contact"
- Pet-Owner: key="pet_owner", firstObjectKey="custom_objects.pet", secondObjectKey="contact"

Returns: Created association with ID and configuration.

Related Tools: create_relation, get_all_associations`,
        inputSchema: {
          key: z.string().describe('Unique key for the association (e.g., "student_teacher")'),
          firstObjectLabel: z.string().describe('Label for the first object (e.g., "student")'),
          firstObjectKey: z.string().describe('Key for the first object (e.g., "custom_objects.student")'),
          secondObjectLabel: z.string().describe('Label for the second object (e.g., "teacher")'),
          secondObjectKey: z.string().describe('Key for the second object (e.g., "contact")'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_association_by_id',
        description: `Get a specific association by its ID.

Retrieve association details for both system-defined and user-defined associations.

Use Cases:
- View association configuration
- Get object mappings
- Verify association setup

Returns: Association with ID, key, labels, and object mappings.

Related Tools: get_all_associations, update_association`,
        inputSchema: {
          associationId: z.string().describe('The ID of the association to retrieve')
        }
      },
      {
        name: 'update_association',
        description: `Update the labels of an existing association.

Only user-defined associations can be updated (system associations are read-only).

Use Cases:
- Rename association labels
- Update relationship terminology
- Refine association descriptions

Returns: Updated association with new labels.

Related Tools: get_association_by_id, create_association`,
        inputSchema: {
          associationId: z.string().describe('The ID of the association to update'),
          firstObjectLabel: z.string().describe('New label for the first object in the association'),
          secondObjectLabel: z.string().describe('New label for the second object in the association')
        }
      },
      {
        name: 'delete_association',
        description: `Delete a user-defined association.

⚠️ WARNING: This is permanent and cannot be undone!
⚠️ All relations created with this association will also be deleted!

Only user-defined associations can be deleted (system associations cannot be removed).

Related Tools: get_all_associations, delete_relation`,
        inputSchema: {
          associationId: z.string().describe('The ID of the association to delete')
        }
      },
      {
        name: 'get_association_by_key',
        description: `Get an association by its key name.

Find associations using their unique key identifier.

Use Cases:
- Look up association by key
- Verify association exists
- Get association ID from key

Returns: Association matching the key.

Related Tools: get_all_associations, get_association_by_id`,
        inputSchema: {
          keyName: z.string().describe('The key name of the association to retrieve'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_association_by_object_key',
        description: `Get associations by object key.

Find all associations that involve a specific object type.

Use Cases:
- Find all associations for contacts
- List associations for a custom object
- Discover available relationships for an object

Examples:
- objectKey="contact" - Find all contact associations
- objectKey="custom_objects.pet" - Find all pet associations

Returns: Array of associations involving the specified object.

Related Tools: get_all_associations, create_association`,
        inputSchema: {
          objectKey: z.string().describe('The object key to search for (e.g., "custom_objects.pet", "contact", "opportunity")'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      // Relation Management Tools
      {
        name: 'create_relation',
        description: `Create a relation between two specific records.

Link individual records together using an existing association.

Use Cases:
- Link a student to their teacher
- Connect a pet to its owner (contact)
- Associate a ticket to a product
- Map custom business relationships

Examples:
- Link student record to teacher contact: associationId="abc123", firstRecordId="student_id", secondRecordId="contact_id"
- Link pet to owner: associationId="xyz789", firstRecordId="pet_id", secondRecordId="owner_contact_id"

Returns: Created relation with ID and record mappings.

Related Tools: get_relations_by_record, delete_relation, create_association`,
        inputSchema: {
          associationId: z.string().describe('The ID of the association to use for this relation'),
          firstRecordId: z.string().describe('ID of the first record (matches first object in association)'),
          secondRecordId: z.string().describe('ID of the second record (matches second object in association)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_relations_by_record',
        description: `Get all relations for a specific record.

Retrieve all relationships linked to a particular record with pagination.

Use Cases:
- Find all teachers for a student
- List all pets owned by a contact
- Get all tickets for a product
- View all relationships for a record

Optionally filter by specific association IDs to narrow results.

Returns: Array of relations with related record IDs and association info.

Related Tools: create_relation, delete_relation`,
        inputSchema: {
          recordId: z.string().describe('The record ID to get relations for'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          skip: z.number().min(0).optional().describe('Number of records to skip for pagination (default: 0)'),
          limit: z.number().min(1).optional().describe('Maximum number of records to return (default: 20)'),
          associationIds: z.array(z.string()).optional().describe('Optional array of association IDs to filter relations')
        }
      },
      {
        name: 'delete_relation',
        description: `Delete a specific relation between two records.

⚠️ WARNING: This is permanent and cannot be undone!

Unlinks two records but does not delete the records themselves.

Use Cases:
- Remove student-teacher link
- Unlink pet from owner
- Disconnect ticket from product

Related Tools: create_relation, get_relations_by_record`,
        inputSchema: {
          relationId: z.string().describe('The ID of the relation to delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      }
    ];
  }

  async executeAssociationTool(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'get_all_associations': {
          const result = await this.apiClient.getAssociations({
            locationId: args.locationId || '',
            skip: args.skip || 0,
            limit: args.limit || 20
          });
          return {
            success: true,
            data: result.data,
            message: `Retrieved ${result.data?.associations?.length || 0} associations`
          };
        }

        case 'create_association': {
          const result = await this.apiClient.createAssociation({
            locationId: args.locationId || '',
            key: args.key,
            firstObjectLabel: args.firstObjectLabel,
            firstObjectKey: args.firstObjectKey,
            secondObjectLabel: args.secondObjectLabel,
            secondObjectKey: args.secondObjectKey
          });
          return {
            success: true,
            data: result.data,
            message: `Association '${args.key}' created successfully`
          };
        }

        case 'get_association_by_id': {
          const result = await this.apiClient.getAssociationById(args.associationId);
          return {
            success: true,
            data: result.data,
            message: `Association retrieved successfully`
          };
        }

        case 'update_association': {
          const result = await this.apiClient.updateAssociation(args.associationId, {
            firstObjectLabel: args.firstObjectLabel,
            secondObjectLabel: args.secondObjectLabel
          });
          return {
            success: true,
            data: result.data,
            message: `Association updated successfully`
          };
        }

        case 'delete_association': {
          const result = await this.apiClient.deleteAssociation(args.associationId);
          return {
            success: true,
            data: result.data,
            message: `Association deleted successfully`
          };
        }

        case 'get_association_by_key': {
          const result = await this.apiClient.getAssociationByKey({
            keyName: args.keyName,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Association with key '${args.keyName}' retrieved successfully`
          };
        }

        case 'get_association_by_object_key': {
          const result = await this.apiClient.getAssociationByObjectKey({
            objectKey: args.objectKey,
            locationId: args.locationId
          });
          return {
            success: true,
            data: result.data,
            message: `Association with object key '${args.objectKey}' retrieved successfully`
          };
        }

        case 'create_relation': {
          const result = await this.apiClient.createRelation({
            locationId: args.locationId || '',
            associationId: args.associationId,
            firstRecordId: args.firstRecordId,
            secondRecordId: args.secondRecordId
          });
          return {
            success: true,
            data: result.data,
            message: `Relation created successfully between records`
          };
        }

        case 'get_relations_by_record': {
          const result = await this.apiClient.getRelationsByRecord({
            recordId: args.recordId,
            locationId: args.locationId || '',
            skip: args.skip || 0,
            limit: args.limit || 20,
            associationIds: args.associationIds
          });
          return {
            success: true,
            data: result.data,
            message: `Retrieved ${result.data?.relations?.length || 0} relations for record`
          };
        }

        case 'delete_relation': {
          const result = await this.apiClient.deleteRelation({
            relationId: args.relationId,
            locationId: args.locationId || ''
          });
          return {
            success: true,
            data: result.data,
            message: `Relation deleted successfully`
          };
        }

        default:
          throw new Error(`Unknown association tool: ${name}`);
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