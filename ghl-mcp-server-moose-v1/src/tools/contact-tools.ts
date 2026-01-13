/**
 * GoHighLevel Contact Tools
 * Implements all contact management functionality for the MCP server
 */

import { z } from "zod";
import { GHLApiClient } from "../clients/ghl-api-client.js";
import {
  MCPCreateContactParams,
  MCPSearchContactsParams,
  MCPUpdateContactParams,
  MCPAddContactTagsParams,
  MCPRemoveContactTagsParams,
  MCPGetContactTasksParams,
  MCPCreateContactTaskParams,
  MCPGetContactTaskParams,
  MCPUpdateContactTaskParams,
  MCPDeleteContactTaskParams,
  MCPUpdateTaskCompletionParams,
  MCPGetContactNotesParams,
  MCPCreateContactNoteParams,
  MCPGetContactNoteParams,
  MCPUpdateContactNoteParams,
  MCPDeleteContactNoteParams,
  MCPUpsertContactParams,
  MCPGetDuplicateContactParams,
  MCPGetContactsByBusinessParams,
  MCPGetContactAppointmentsParams,
  MCPBulkUpdateContactTagsParams,
  MCPBulkUpdateContactBusinessParams,
  MCPAddContactFollowersParams,
  MCPRemoveContactFollowersParams,
  MCPAddContactToCampaignParams,
  MCPRemoveContactFromCampaignParams,
  MCPRemoveContactFromAllCampaignsParams,
  MCPAddContactToWorkflowParams,
  MCPRemoveContactFromWorkflowParams,
  GHLContact,
  GHLSearchContactsResponse,
  GHLContactTagsResponse,
  GHLTask,
  GHLNote,
  GHLAppointment,
  GHLUpsertContactResponse,
  GHLBulkTagsResponse,
  GHLBulkBusinessResponse,
  GHLFollowersResponse,
} from "../types/ghl-types.js";

/**
 * Contact Tools class
 * Provides comprehensive contact management capabilities
 */
export class ContactTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all contact operations
   */
  getToolDefinitions(): any[] {
    return [
      // Basic Contact Management
      {
        name: "create_contact",
        description: "Create a new contact in GoHighLevel",
        inputSchema: {
          firstName: z.string().optional().describe("Contact first name"),
          lastName: z.string().optional().describe("Contact last name"),
          email: z.string().describe("Contact email address"),
          phone: z.string().optional().describe("Contact phone number"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Tags to assign to contact"),
          source: z.string().optional().describe("Source of the contact"),
        },
      },
      {
        name: "search_contacts",
        // description: 'Search for contacts with advanced filtering options',
        description:
          "Search for contacts by name, email, phone, or other criteria. Call with no parameters to list all contacts.",
        inputSchema: {
          query: z.string().optional().describe("Search query string"),
          email: z.string().optional().describe("Filter by email address"),
          phone: z.string().optional().describe("Filter by phone number"),
          limit: z
            .number()
            .optional()
            .describe("Maximum number of results (default: 25)"),
        },
      },
      {
        name: "get_contact",
        description: "Get detailed information about a specific contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },
      {
        name: "update_contact",
        description: `Update contact information including custom fields.

Use this tool to update standard contact fields (name, email, phone, tags) AND custom field values.

CUSTOM FIELDS:
To update custom field values, provide an array of objects with 'id' and 'field_value':
- id: The custom field ID (get from create_location_custom_field)
- field_value: The value to set (string, number, array, or object depending on field type)

EXAMPLE:
{
  "contactId": "abc123",
  "firstName": "John",
  "customFields": [
    {"id": "KG6BuozCm6hthcrFJskq", "field_value": "MCP-12345"},
    {"id": "anotherFieldId", "field_value": "Some value"}
  ]
}

Related Tools: create_contact, get_contact, create_location_custom_field`,
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          firstName: z.string().optional().describe("Contact first name"),
          lastName: z.string().optional().describe("Contact last name"),
          email: z.string().optional().describe("Contact email address"),
          phone: z.string().optional().describe("Contact phone number"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Tags to assign to contact"),
          customFields: z
            .array(
              z.object({
                id: z.string().describe("Custom field ID"),
                field_value: z.union([
                  z.string(),
                  z.number(),
                  z.array(z.string()),
                  z.record(z.any())
                ]).describe("Custom field value (string, number, array, or object)")
              })
            )
            .optional()
            .describe("Array of custom field values to update. Each object must have 'id' (custom field ID) and 'field_value' (the value to set)"),
        },
      },
      {
        name: "delete_contact",
        description: "Delete a contact from GoHighLevel",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },
      {
        name: "add_contact_tags",
        description: "Add tags to a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          tags: z.array(z.string()).describe("Tags to add"),
        },
      },
      {
        name: "remove_contact_tags",
        description: "Remove tags from a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          tags: z.array(z.string()).describe("Tags to remove"),
        },
      },

      // Task Management
      {
        name: "get_contact_tasks",
        description: "Get all tasks for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },
      {
        name: "create_contact_task",
        description: "Create a new task for a contact. IMPORTANT: assignedTo must be a GHL User ID (team member), NOT a contact ID. Tasks can only be assigned to users who log into GoHighLevel.",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          title: z.string().describe("Task title"),
          body: z.string().optional().describe("Task description"),
          dueDate: z.string().describe("Due date (ISO format)"),
          completed: z.boolean().optional().describe("Task completion status"),
          assignedTo: z
            .string()
            .optional()
            .describe("GHL User ID (team member) to assign task to - NOT a contact ID"),
        },
      },
      {
        name: "get_contact_task",
        description: "Get a specific task for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          taskId: z.string().describe("Task ID"),
        },
      },
      {
        name: "update_contact_task",
        description: "Update a task for a contact. IMPORTANT: assignedTo must be a GHL User ID (team member), NOT a contact ID. Tasks can only be assigned to users who log into GoHighLevel.",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          taskId: z.string().describe("Task ID"),
          title: z.string().optional().describe("Task title"),
          body: z.string().optional().describe("Task description"),
          dueDate: z.string().optional().describe("Due date (ISO format)"),
          completed: z.boolean().optional().describe("Task completion status"),
          assignedTo: z
            .string()
            .optional()
            .describe("GHL User ID (team member) to assign task to - NOT a contact ID"),
        },
      },
      {
        name: "delete_contact_task",
        description: "Delete a task for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          taskId: z.string().describe("Task ID"),
        },
      },
      {
        name: "update_task_completion",
        description: "Update task completion status",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          taskId: z.string().describe("Task ID"),
          completed: z.boolean().describe("Completion status"),
        },
      },

      // Note Management
      {
        name: "get_contact_notes",
        description: "Get all notes for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },
      {
        name: "create_contact_note",
        description: "Create a new note for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          body: z.string().describe("Note content"),
          userId: z.string().optional().describe("User ID creating the note"),
        },
      },
      {
        name: "get_contact_note",
        description: "Get a specific note for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          noteId: z.string().describe("Note ID"),
        },
      },
      {
        name: "update_contact_note",
        description: "Update a note for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          noteId: z.string().describe("Note ID"),
          body: z.string().describe("Note content"),
          userId: z.string().optional().describe("User ID updating the note"),
        },
      },
      {
        name: "delete_contact_note",
        description: "Delete a note for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          noteId: z.string().describe("Note ID"),
        },
      },

      // Advanced Contact Operations
      {
        name: "upsert_contact",
        description:
          "Create or update contact based on email/phone (smart merge)",
        inputSchema: {
          firstName: z.string().optional().describe("Contact first name"),
          lastName: z.string().optional().describe("Contact last name"),
          email: z.string().optional().describe("Contact email address"),
          phone: z.string().optional().describe("Contact phone number"),
          tags: z
            .array(z.string())
            .optional()
            .describe("Tags to assign to contact"),
          source: z.string().optional().describe("Source of the contact"),
          assignedTo: z
            .string()
            .optional()
            .describe("User ID to assign contact to"),
        },
      },
      {
        name: "get_duplicate_contact",
        description: "Check for duplicate contacts by email or phone",
        inputSchema: {
          email: z
            .string()
            .optional()
            .describe("Email to check for duplicates"),
          phone: z
            .string()
            .optional()
            .describe("Phone to check for duplicates"),
        },
      },
      {
        name: "get_contacts_by_business",
        description: "Get contacts associated with a specific business",
        inputSchema: {
          businessId: z.string().describe("Business ID"),
          limit: z.number().optional().describe("Maximum number of results"),
          skip: z.number().optional().describe("Number of results to skip"),
          query: z.string().optional().describe("Search query"),
        },
      },
      {
        name: "get_contact_appointments",
        description: "Get all appointments for a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },

      // Bulk Operations
      {
        name: "bulk_update_contact_tags",
        description: "Bulk add or remove tags from multiple contacts",
        inputSchema: {
          contactIds: z.array(z.string()).describe("Array of contact IDs"),
          tags: z.array(z.string()).describe("Tags to add or remove"),
          operation: z.enum(["add", "remove"]).describe("Operation to perform"),
          removeAllTags: z
            .boolean()
            .optional()
            .describe("Remove all existing tags before adding new ones"),
        },
      },
      {
        name: "bulk_update_contact_business",
        description: "Bulk update business association for multiple contacts",
        inputSchema: {
          contactIds: z.array(z.string()).describe("Array of contact IDs"),
          businessId: z
            .string()
            .optional()
            .describe("Business ID (null to remove from business)"),
        },
      },

      // Followers Management
      {
        name: "add_contact_followers",
        description: "Add followers to a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          followers: z
            .array(z.string())
            .describe("Array of user IDs to add as followers"),
        },
      },
      {
        name: "remove_contact_followers",
        description: "Remove followers from a contact",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          followers: z
            .array(z.string())
            .describe("Array of user IDs to remove as followers"),
        },
      },

      // Campaign Management
      {
        name: "add_contact_to_campaign",
        description: "Add contact to a marketing campaign",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          campaignId: z.string().describe("Campaign ID"),
        },
      },
      {
        name: "remove_contact_from_campaign",
        description: "Remove contact from a specific campaign",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          campaignId: z.string().describe("Campaign ID"),
        },
      },
      {
        name: "remove_contact_from_all_campaigns",
        description: "Remove contact from all campaigns",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
        },
      },

      // Workflow Management
      {
        name: "add_contact_to_workflow",
        description: "Add contact to a workflow",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          workflowId: z.string().describe("Workflow ID"),
          eventStartTime: z
            .string()
            .optional()
            .describe("Event start time (ISO format)"),
        },
      },
      {
        name: "remove_contact_from_workflow",
        description: "Remove contact from a workflow",
        inputSchema: {
          contactId: z.string().describe("Contact ID"),
          workflowId: z.string().describe("Workflow ID"),
          eventStartTime: z
            .string()
            .optional()
            .describe("Event start time (ISO format)"),
        },
      },
    ];
  }

  /**
   * Execute a contact tool with the given parameters
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    try {
      switch (toolName) {
        // Basic Contact Management
        case "create_contact":
          return await this.createContact(params as MCPCreateContactParams);
        case "search_contacts":
          return await this.searchContacts(params as MCPSearchContactsParams);
        case "get_contact":
          return await this.getContact(params.contactId);
        case "update_contact":
          return await this.updateContact(params as MCPUpdateContactParams);
        case "delete_contact":
          return await this.deleteContact(params.contactId);
        case "add_contact_tags":
          return await this.addContactTags(params as MCPAddContactTagsParams);
        case "remove_contact_tags":
          return await this.removeContactTags(
            params as MCPRemoveContactTagsParams
          );

        // Task Management
        case "get_contact_tasks":
          return await this.getContactTasks(params as MCPGetContactTasksParams);
        case "create_contact_task":
          return await this.createContactTask(
            params as MCPCreateContactTaskParams
          );
        case "get_contact_task":
          return await this.getContactTask(params as MCPGetContactTaskParams);
        case "update_contact_task":
          return await this.updateContactTask(
            params as MCPUpdateContactTaskParams
          );
        case "delete_contact_task":
          return await this.deleteContactTask(
            params as MCPDeleteContactTaskParams
          );
        case "update_task_completion":
          return await this.updateTaskCompletion(
            params as MCPUpdateTaskCompletionParams
          );

        // Note Management
        case "get_contact_notes":
          return await this.getContactNotes(params as MCPGetContactNotesParams);
        case "create_contact_note":
          return await this.createContactNote(
            params as MCPCreateContactNoteParams
          );
        case "get_contact_note":
          return await this.getContactNote(params as MCPGetContactNoteParams);
        case "update_contact_note":
          return await this.updateContactNote(
            params as MCPUpdateContactNoteParams
          );
        case "delete_contact_note":
          return await this.deleteContactNote(
            params as MCPDeleteContactNoteParams
          );

        // Advanced Operations
        case "upsert_contact":
          return await this.upsertContact(params as MCPUpsertContactParams);
        case "get_duplicate_contact":
          return await this.getDuplicateContact(
            params as MCPGetDuplicateContactParams
          );
        case "get_contacts_by_business":
          return await this.getContactsByBusiness(
            params as MCPGetContactsByBusinessParams
          );
        case "get_contact_appointments":
          return await this.getContactAppointments(
            params as MCPGetContactAppointmentsParams
          );

        // Bulk Operations
        case "bulk_update_contact_tags":
          return await this.bulkUpdateContactTags(
            params as MCPBulkUpdateContactTagsParams
          );
        case "bulk_update_contact_business":
          return await this.bulkUpdateContactBusiness(
            params as MCPBulkUpdateContactBusinessParams
          );

        // Followers Management
        case "add_contact_followers":
          return await this.addContactFollowers(
            params as MCPAddContactFollowersParams
          );
        case "remove_contact_followers":
          return await this.removeContactFollowers(
            params as MCPRemoveContactFollowersParams
          );

        // Campaign Management
        case "add_contact_to_campaign":
          return await this.addContactToCampaign(
            params as MCPAddContactToCampaignParams
          );
        case "remove_contact_from_campaign":
          return await this.removeContactFromCampaign(
            params as MCPRemoveContactFromCampaignParams
          );
        case "remove_contact_from_all_campaigns":
          return await this.removeContactFromAllCampaigns(
            params as MCPRemoveContactFromAllCampaignsParams
          );

        // Workflow Management
        case "add_contact_to_workflow":
          return await this.addContactToWorkflow(
            params as MCPAddContactToWorkflowParams
          );
        case "remove_contact_from_workflow":
          return await this.removeContactFromWorkflow(
            params as MCPRemoveContactFromWorkflowParams
          );

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      console.error(`Error executing contact tool ${toolName}:`, error);
      throw error;
    }
  }

  // Implementation methods - THESE STAY EXACTLY THE SAME

  private async createContact(
    params: MCPCreateContactParams
  ): Promise<GHLContact> {
    const response = await this.ghlClient.createContact({
      locationId: this.ghlClient.getConfig().locationId,
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone,
      tags: params.tags,
      source: params.source,
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to create contact");
    }

    return response.data!;
  }

  private async searchContacts(
    params: MCPSearchContactsParams
  ): Promise<GHLSearchContactsResponse> {
    const response = await this.ghlClient.searchContacts({
      locationId: this.ghlClient.getConfig().locationId,
      query: params.query,
      limit: params.limit,
      filters: {
        ...(params.email && { email: params.email }),
        ...(params.phone && { phone: params.phone }),
      },
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to search contacts");
    }

    return response.data!;
  }

  private async getContact(contactId: string): Promise<GHLContact> {
    const response = await this.ghlClient.getContact(contactId);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get contact");
    }

    // DEBUG: Log customFields count to verify GHL API response
    const contact = response.data!;
    const customFieldsCount = contact.customFields?.length || 0;
    const customFieldIds = contact.customFields?.map(f => f.id) || [];
    process.stderr.write(`[DEBUG get_contact] customFields count: ${customFieldsCount}, IDs: ${JSON.stringify(customFieldIds)}\n`);

    return contact;
  }

  private async updateContact(
    params: MCPUpdateContactParams
  ): Promise<GHLContact> {
    const response = await this.ghlClient.updateContact(params.contactId, {
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
      phone: params.phone,
      tags: params.tags,
      customFields: params.customFields,
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to update contact");
    }

    return response.data!;
  }

  private async deleteContact(
    contactId: string
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.deleteContact(contactId);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to delete contact");
    }

    return response.data!;
  }

  private async addContactTags(
    params: MCPAddContactTagsParams
  ): Promise<GHLContactTagsResponse> {
    const response = await this.ghlClient.addContactTags(
      params.contactId,
      params.tags
    );

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to add contact tags");
    }

    return response.data!;
  }

  private async removeContactTags(
    params: MCPRemoveContactTagsParams
  ): Promise<GHLContactTagsResponse> {
    const response = await this.ghlClient.removeContactTags(
      params.contactId,
      params.tags
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to remove contact tags"
      );
    }

    return response.data!;
  }

  // Task Management
  private async getContactTasks(
    params: MCPGetContactTasksParams
  ): Promise<{ tasks: GHLTask[]; count: number; contactId: string }> {
    const response = await this.ghlClient.getContactTasks(params.contactId);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get contact tasks");
    }

    const tasks = response.data || [];
    return {
      tasks: tasks,
      count: tasks.length,
      contactId: params.contactId,
    };
  }

  private async createContactTask(
    params: MCPCreateContactTaskParams
  ): Promise<GHLTask> {
    const response = await this.ghlClient.createContactTask(params.contactId, {
      title: params.title,
      body: params.body,
      dueDate: params.dueDate,
      completed: params.completed || false,
      assignedTo: params.assignedTo,
    });

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to create contact task"
      );
    }

    return response.data!;
  }

  private async getContactTask(
    params: MCPGetContactTaskParams
  ): Promise<GHLTask> {
    const response = await this.ghlClient.getContactTask(
      params.contactId,
      params.taskId
    );

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get contact task");
    }

    return response.data!;
  }

  private async updateContactTask(
    params: MCPUpdateContactTaskParams
  ): Promise<GHLTask> {
    const response = await this.ghlClient.updateContactTask(
      params.contactId,
      params.taskId,
      {
        title: params.title,
        body: params.body,
        dueDate: params.dueDate,
        completed: params.completed,
        assignedTo: params.assignedTo,
      }
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to update contact task"
      );
    }

    return response.data!;
  }

  private async deleteContactTask(
    params: MCPDeleteContactTaskParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.deleteContactTask(
      params.contactId,
      params.taskId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to delete contact task"
      );
    }

    return response.data!;
  }

  private async updateTaskCompletion(
    params: MCPUpdateTaskCompletionParams
  ): Promise<GHLTask> {
    const response = await this.ghlClient.updateTaskCompletion(
      params.contactId,
      params.taskId,
      params.completed
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to update task completion"
      );
    }

    return response.data!;
  }

  // Note Management
  private async getContactNotes(
    params: MCPGetContactNotesParams
  ): Promise<{ notes: GHLNote[]; count: number; contactId: string }> {
    const response = await this.ghlClient.getContactNotes(params.contactId);

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get contact notes");
    }

    const notes = response.data || [];
    return {
      notes: notes,
      count: notes.length,
      contactId: params.contactId,
    };
  }

  private async createContactNote(
    params: MCPCreateContactNoteParams
  ): Promise<GHLNote> {
    const response = await this.ghlClient.createContactNote(params.contactId, {
      body: params.body,
      userId: params.userId,
    });

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to create contact note"
      );
    }

    return response.data!;
  }

  private async getContactNote(
    params: MCPGetContactNoteParams
  ): Promise<GHLNote> {
    const response = await this.ghlClient.getContactNote(
      params.contactId,
      params.noteId
    );

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to get contact note");
    }

    return response.data!;
  }

  private async updateContactNote(
    params: MCPUpdateContactNoteParams
  ): Promise<GHLNote> {
    const response = await this.ghlClient.updateContactNote(
      params.contactId,
      params.noteId,
      {
        body: params.body,
        userId: params.userId,
      }
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to update contact note"
      );
    }

    return response.data!;
  }

  private async deleteContactNote(
    params: MCPDeleteContactNoteParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.deleteContactNote(
      params.contactId,
      params.noteId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to delete contact note"
      );
    }

    return response.data!;
  }

  // Advanced Operations
  private async upsertContact(
    params: MCPUpsertContactParams
  ): Promise<GHLUpsertContactResponse> {
    const response = await this.ghlClient.upsertContact({
      locationId: this.ghlClient.getConfig().locationId,
      firstName: params.firstName,
      lastName: params.lastName,
      name: params.name,
      email: params.email,
      phone: params.phone,
      address1: params.address,
      city: params.city,
      state: params.state,
      country: params.country,
      postalCode: params.postalCode,
      website: params.website,
      timezone: params.timezone,
      companyName: params.companyName,
      tags: params.tags,
      customFields: params.customFields,
      source: params.source,
      assignedTo: params.assignedTo,
    });

    if (!response.success) {
      throw new Error(response.error?.message || "Failed to upsert contact");
    }

    return response.data!;
  }

  private async getDuplicateContact(
    params: MCPGetDuplicateContactParams
  ): Promise<GHLContact | null> {
    const response = await this.ghlClient.getDuplicateContact(
      params.email,
      params.phone
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to check for duplicate contact"
      );
    }

    return response.data!;
  }

  private async getContactsByBusiness(
    params: MCPGetContactsByBusinessParams
  ): Promise<GHLSearchContactsResponse> {
    const response = await this.ghlClient.getContactsByBusiness(
      params.businessId,
      {
        limit: params.limit,
        skip: params.skip,
        query: params.query,
      }
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to get contacts by business"
      );
    }

    return response.data!;
  }

  private async getContactAppointments(
    params: MCPGetContactAppointmentsParams
  ): Promise<{ appointments: GHLAppointment[]; count: number; contactId: string }> {
    const response = await this.ghlClient.getContactAppointments(
      params.contactId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to get contact appointments"
      );
    }

    const appointments = response.data || [];
    return {
      appointments: appointments,
      count: appointments.length,
      contactId: params.contactId,
    };
  }

  // Bulk Operations
  private async bulkUpdateContactTags(
    params: MCPBulkUpdateContactTagsParams
  ): Promise<GHLBulkTagsResponse> {
    const response = await this.ghlClient.bulkUpdateContactTags(
      params.contactIds,
      params.tags,
      params.operation,
      params.removeAllTags
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to bulk update contact tags"
      );
    }

    return response.data!;
  }

  private async bulkUpdateContactBusiness(
    params: MCPBulkUpdateContactBusinessParams
  ): Promise<GHLBulkBusinessResponse> {
    const response = await this.ghlClient.bulkUpdateContactBusiness(
      params.contactIds,
      params.businessId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to bulk update contact business"
      );
    }

    return response.data!;
  }

  // Followers Management
  private async addContactFollowers(
    params: MCPAddContactFollowersParams
  ): Promise<GHLFollowersResponse> {
    const response = await this.ghlClient.addContactFollowers(
      params.contactId,
      params.followers
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to add contact followers"
      );
    }

    return response.data!;
  }

  private async removeContactFollowers(
    params: MCPRemoveContactFollowersParams
  ): Promise<GHLFollowersResponse> {
    const response = await this.ghlClient.removeContactFollowers(
      params.contactId,
      params.followers
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to remove contact followers"
      );
    }

    return response.data!;
  }

  // Campaign Management
  private async addContactToCampaign(
    params: MCPAddContactToCampaignParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.addContactToCampaign(
      params.contactId,
      params.campaignId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to add contact to campaign"
      );
    }

    return response.data!;
  }

  private async removeContactFromCampaign(
    params: MCPRemoveContactFromCampaignParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.removeContactFromCampaign(
      params.contactId,
      params.campaignId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to remove contact from campaign"
      );
    }

    return response.data!;
  }

  private async removeContactFromAllCampaigns(
    params: MCPRemoveContactFromAllCampaignsParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.removeContactFromAllCampaigns(
      params.contactId
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to remove contact from all campaigns"
      );
    }

    return response.data!;
  }

  // Workflow Management
  private async addContactToWorkflow(
    params: MCPAddContactToWorkflowParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.addContactToWorkflow(
      params.contactId,
      params.workflowId,
      params.eventStartTime
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to add contact to workflow"
      );
    }

    return response.data!;
  }

  private async removeContactFromWorkflow(
    params: MCPRemoveContactFromWorkflowParams
  ): Promise<{ succeded: boolean }> {
    const response = await this.ghlClient.removeContactFromWorkflow(
      params.contactId,
      params.workflowId,
      params.eventStartTime
    );

    if (!response.success) {
      throw new Error(
        response.error?.message || "Failed to remove contact from workflow"
      );
    }

    return response.data!;
  }
}
