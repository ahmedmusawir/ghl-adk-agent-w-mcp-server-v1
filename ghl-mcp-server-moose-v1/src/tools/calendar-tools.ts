/**
 * GoHighLevel Calendar & Appointments Tools
 * Implements all calendar and appointment management functionality for the MCP server
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

/**
 * Calendar Tools Class
 * Provides comprehensive calendar and appointment management capabilities
 */
export class CalendarTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all calendar operations
   */
  getToolDefinitions(): any[] {
    return [
      // Calendar Management (5 tools)
      {
        name: 'get_calendar_groups',
        description: `Get all calendar groups in GoHighLevel.

Calendar groups organize multiple calendars together (e.g., "Sales Team", "Support Team").

Use Cases:
- Discover available calendar groups before filtering calendars
- List all calendar organizational structures
- Find group IDs for calendar filtering

Returns: Array of calendar groups with IDs, names, and metadata.

Related Tools: get_calendars (use groupId to filter)`,
        inputSchema: {}
      },
      {
        name: 'get_calendars',
        description: `Get calendars from GoHighLevel, optionally filtered by calendar group.

Use Cases:
- List all available calendars in the location
- Filter calendars by specific group
- Find calendar IDs for appointment booking
- Discover calendar settings and availability

Parameters:
- groupId: (optional) Filter calendars belonging to specific group

Returns: Array of calendars with IDs, names, settings, and availability rules.

Related Tools: get_calendar_groups, create_appointment, get_free_slots`,
        inputSchema: {
          groupId: z.string().optional().describe('Optional: Filter calendars by calendar group ID')
        }
      },
      {
        name: 'create_calendar',
        description: `Create a new calendar in GoHighLevel.

IMPORTANT: Requires admin/calendar management permissions.

Use Cases:
- Set up new service calendars (consultations, demos, support)
- Create team member calendars
- Configure appointment booking calendars

Required Parameters:
- name: Calendar display name
- description: What this calendar is for

Optional Parameters:
- groupId: Assign to specific calendar group
- meetingLocation: Where meetings take place
- slotDuration: Default appointment length in minutes
- slotInterval: Booking interval in minutes

Returns: Created calendar with ID and settings.

Related Tools: get_calendar_groups (to find groupId), update_calendar`,
        inputSchema: {
          name: z.string().describe('Calendar name (e.g., "Sales Consultations")'),
          description: z.string().describe('Calendar description/purpose'),
          groupId: z.string().optional().describe('Optional: Calendar group ID to assign this calendar to'),
          meetingLocation: z.string().optional().describe('Optional: Default meeting location (address, Zoom link, etc.)'),
          slotDuration: z.number().optional().describe('Optional: Default appointment duration in minutes (e.g., 30, 60)'),
          slotInterval: z.number().optional().describe('Optional: Booking interval in minutes (e.g., 15, 30)')
        }
      },
      {
        name: 'update_calendar',
        description: `Update an existing calendar's settings in GoHighLevel.

IMPORTANT: Requires admin/calendar management permissions.

Use Cases:
- Change calendar name or description
- Update meeting location
- Modify slot duration or intervals
- Reassign to different calendar group

Parameters:
- calendarId: ID of calendar to update
- All other fields are optional - only provide fields you want to change

Returns: Updated calendar with new settings.

Related Tools: get_calendars (to find calendarId), delete_calendar`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to update'),
          name: z.string().optional().describe('Optional: New calendar name'),
          description: z.string().optional().describe('Optional: New calendar description'),
          groupId: z.string().optional().describe('Optional: Move to different calendar group'),
          meetingLocation: z.string().optional().describe('Optional: Update meeting location'),
          slotDuration: z.number().optional().describe('Optional: Update appointment duration in minutes'),
          slotInterval: z.number().optional().describe('Optional: Update booking interval in minutes')
        }
      },
      {
        name: 'delete_calendar',
        description: `Delete a calendar from GoHighLevel.

⚠️ WARNING: This action is permanent and cannot be undone!
⚠️ All appointments in this calendar will be affected!

IMPORTANT: Requires admin/calendar management permissions.

Use Cases:
- Remove obsolete calendars
- Clean up test calendars
- Decommission service calendars

Before deleting:
1. Verify no active appointments (use get_calendar_events)
2. Notify team members using this calendar
3. Consider disabling instead of deleting

Parameters:
- calendarId: ID of calendar to permanently delete

Related Tools: get_calendars (to find calendarId), get_calendar_events (to check for appointments)`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to permanently delete')
        }
      },

      // Appointment Booking (7 tools)
      {
        name: 'get_calendar_events',
        description: `Get events/appointments from a calendar within a date range.

Use Cases:
- View scheduled appointments for a calendar
- Check calendar availability
- Find appointments within specific timeframe
- Audit appointment history

Required Parameters:
- calendarId: Which calendar to query
- startTime: Start of date range (ISO 8601 format)
- endTime: End of date range (ISO 8601 format)

Date Format: Use ISO 8601 format (e.g., "2025-10-20T09:00:00Z")

Returns: Array of appointments/events with details (time, contact, status, etc.)

Related Tools: get_calendars (to find calendarId), get_free_slots, create_appointment`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to query'),
          startTime: z.string().describe('Start of date range in ISO 8601 format (e.g., "2025-10-20T09:00:00Z")'),
          endTime: z.string().describe('End of date range in ISO 8601 format (e.g., "2025-10-21T17:00:00Z")')
        }
      },
      {
        name: 'get_free_slots',
        description: `Check available time slots for booking appointments on a calendar.

Use Cases:
- Find available appointment times before booking
- Show customers available slots
- Check calendar availability
- Plan appointment scheduling

Required Parameters:
- calendarId: Which calendar to check
- startDate: Start of availability check (YYYY-MM-DD format)
- endDate: End of availability check (YYYY-MM-DD format)
- timezone: Timezone for availability (e.g., "America/New_York", "UTC")

IMPORTANT - Timezone:
- Use standard IANA timezone format
- Examples: "America/New_York", "Europe/London", "Asia/Tokyo", "UTC"
- Invalid timezone will cause 400 error

Returns: Array of available time slots with start/end times.

Related Tools: create_appointment (book a slot), get_calendar_events`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to check availability'),
          startDate: z.string().describe('Start date for availability check (YYYY-MM-DD format, e.g., "2025-10-20")'),
          endDate: z.string().describe('End date for availability check (YYYY-MM-DD format, e.g., "2025-10-27")'),
          timezone: z.string().describe('Timezone for availability (IANA format, e.g., "America/New_York", "UTC")')
        }
      },
      {
        name: 'create_appointment',
        description: `Book a new appointment on a calendar.

IMPORTANT: Check availability first using get_free_slots to avoid conflicts!

Use Cases:
- Book customer appointments
- Schedule consultations
- Reserve calendar time slots

Required Parameters:
- calendarId: Which calendar to book on
- startTime: Appointment start (ISO 8601 format)
- endTime: Appointment end (ISO 8601 format)
- contactId: GHL contact ID for the appointment

Optional Parameters:
- title: Appointment title/subject
- appointmentStatus: Status (confirmed, showed, noshow, cancelled)
- assignedUserId: Assign to specific team member

Date Format: Use ISO 8601 format (e.g., "2025-10-20T14:00:00Z")

Returns: Created appointment with ID and details.

Related Tools: get_free_slots (check availability first), get_calendars, search_contacts`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to book on'),
          contactId: z.string().describe('The GHL contact ID for this appointment'),
          startTime: z.string().describe('Appointment start time in ISO 8601 format (e.g., "2025-10-20T14:00:00Z")'),
          endTime: z.string().describe('Appointment end time in ISO 8601 format (e.g., "2025-10-20T15:00:00Z")'),
          title: z.string().optional().describe('Optional: Appointment title/subject'),
          appointmentStatus: z.enum(['confirmed', 'showed', 'noshow', 'cancelled']).optional().describe('Optional: Appointment status'),
          assignedUserId: z.string().optional().describe('Optional: Assign to specific team member (user ID)')
        }
      },
      {
        name: 'get_appointment',
        description: `Get details of a specific appointment by ID.

Use Cases:
- View appointment details
- Check appointment status
- Verify booking information
- Get contact and calendar info

Parameters:
- eventId: The unique appointment/event ID

Returns: Full appointment details including contact, calendar, time, status, etc.

Related Tools: get_calendar_events (to find eventId), update_appointment, delete_appointment`,
        inputSchema: {
          eventId: z.string().describe('The unique ID of the appointment/event to retrieve')
        }
      },
      {
        name: 'update_appointment',
        description: `Update an existing appointment's details.

Use Cases:
- Reschedule appointment to different time
- Change appointment status
- Update appointment title
- Reassign to different team member

Parameters:
- eventId: The appointment ID to update
- All other fields are optional - only provide fields you want to change

IMPORTANT: When rescheduling, check availability with get_free_slots first!

Returns: Updated appointment with new details.

Related Tools: get_appointment (to find eventId), get_free_slots (when rescheduling), delete_appointment`,
        inputSchema: {
          eventId: z.string().describe('The unique ID of the appointment to update'),
          startTime: z.string().optional().describe('Optional: New start time in ISO 8601 format'),
          endTime: z.string().optional().describe('Optional: New end time in ISO 8601 format'),
          title: z.string().optional().describe('Optional: New appointment title'),
          appointmentStatus: z.enum(['confirmed', 'showed', 'noshow', 'cancelled']).optional().describe('Optional: New appointment status'),
          assignedUserId: z.string().optional().describe('Optional: Reassign to different team member')
        }
      },
      {
        name: 'delete_appointment',
        description: `Cancel/delete an appointment.

⚠️ WARNING: This action is permanent and cannot be undone!

Use Cases:
- Cancel appointments
- Remove no-shows
- Clean up cancelled bookings

IMPORTANT: Consider updating status to 'cancelled' instead of deleting for record-keeping.

Parameters:
- eventId: The appointment ID to delete

Alternative: Use update_appointment with status='cancelled' to keep records.

Related Tools: get_appointment (to find eventId), update_appointment (to cancel without deleting)`,
        inputSchema: {
          eventId: z.string().describe('The unique ID of the appointment to delete')
        }
      },

      // Schedule Control (2 tools)
      {
        name: 'create_block_slot',
        description: `Block time on a calendar to prevent bookings.

Use Cases:
- Block lunch breaks
- Reserve time for internal meetings
- Block holidays or time off
- Prevent bookings during specific hours

Required Parameters:
- calendarId: Which calendar to block time on
- startTime: When the block starts (ISO 8601 format)
- endTime: When the block ends (ISO 8601 format)

Optional Parameters:
- title: Description of the block (e.g., "Lunch Break", "Team Meeting")
- assignedUserId: Assign block to specific team member

Date Format: Use ISO 8601 format (e.g., "2025-10-20T12:00:00Z")

Returns: Created block slot with ID and details.

Related Tools: update_block_slot, get_calendar_events (to view blocks), delete_appointment (to remove blocks)`,
        inputSchema: {
          calendarId: z.string().describe('The unique ID of the calendar to block time on'),
          startTime: z.string().describe('Block start time in ISO 8601 format (e.g., "2025-10-20T12:00:00Z")'),
          endTime: z.string().describe('Block end time in ISO 8601 format (e.g., "2025-10-20T13:00:00Z")'),
          title: z.string().optional().describe('Optional: Description of the block (e.g., "Lunch Break")'),
          assignedUserId: z.string().optional().describe('Optional: Assign to specific team member (user ID)')
        }
      },
      {
        name: 'update_block_slot',
        description: `Update an existing blocked time slot.

Use Cases:
- Reschedule blocked time
- Change block duration
- Update block description
- Reassign block to different team member

Parameters:
- eventId: The block slot ID to update
- All other fields are optional - only provide fields you want to change

Date Format: Use ISO 8601 format for startTime and endTime (e.g., "2025-10-20T12:00:00Z")

Returns: Updated block slot with new details.

Related Tools: create_block_slot, get_calendar_events (to find eventId), delete_appointment (to remove block)`,
        inputSchema: {
          eventId: z.string().describe('The unique ID of the block slot to update'),
          startTime: z.string().optional().describe('Optional: New start time in ISO 8601 format'),
          endTime: z.string().optional().describe('Optional: New end time in ISO 8601 format'),
          title: z.string().optional().describe('Optional: New description for the block'),
          assignedUserId: z.string().optional().describe('Optional: Reassign to different team member')
        }
      }
    ];
  }

  /**
   * Execute a calendar tool with the given parameters
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    try {
      switch (toolName) {
        // Calendar Management
        case 'get_calendar_groups':
          return await this.getCalendarGroups();
        case 'get_calendars':
          return await this.getCalendars(params.groupId);
        case 'create_calendar':
          return await this.createCalendar(params);
        case 'update_calendar':
          return await this.updateCalendar(params);
        case 'delete_calendar':
          return await this.deleteCalendar(params.calendarId);
        
        // Appointment Booking
        case 'get_calendar_events':
          return await this.getCalendarEvents(params);
        case 'get_free_slots':
          return await this.getFreeSlots(params);
        case 'create_appointment':
          return await this.createAppointment(params);
        case 'get_appointment':
          return await this.getAppointment(params.eventId);
        case 'update_appointment':
          return await this.updateAppointment(params);
        case 'delete_appointment':
          return await this.deleteAppointment(params.eventId);
        
        // Schedule Control
        case 'create_block_slot':
          return await this.createBlockSlot(params);
        case 'update_block_slot':
          return await this.updateBlockSlot(params);
        
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * CALENDAR MANAGEMENT METHODS
   */

  /**
   * Get all calendar groups
   */
  private async getCalendarGroups(): Promise<any> {
    try {
      const response = await this.ghlClient.getCalendarGroups();
      return response.data;
    } catch (error: any) {
      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot access calendar groups.

Please check:
- API key has calendar read permissions
- User has access to calendars in this location
- Location has calendars feature enabled

Original error: ${error.message || error}`);
      }

      // Configuration errors
      if (error.message?.includes('(500)')) {
        throw new Error(`Calendar service error: The calendar system may not be properly configured.

Please verify:
- Calendars feature is enabled for this location
- Calendar settings are configured in GHL dashboard

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to get calendar groups: ${error.message || error}`);
    }
  }

  /**
   * Get calendars, optionally filtered by group
   */
  private async getCalendars(groupId?: string): Promise<any> {
    try {
      const response = await this.ghlClient.getCalendars(groupId ? { groupId } : undefined);
      return response.data;
    } catch (error: any) {
      // Group not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar group not found: ${groupId}

The specified group ID doesn't exist or has been deleted.
Use get_calendar_groups tool to see available groups.

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot access calendars.

Please check:
- API key has calendar read permissions
- User has access to calendars in this location

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to get calendars: ${error.message || error}`);
    }
  }

  /**
   * Create a new calendar
   */
  private async createCalendar(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.createCalendar(params);
      return response.data;
    } catch (error: any) {
      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot create calendars.

This operation requires admin or calendar management permissions.

Please check:
- API key has calendar write/admin permissions
- User role allows calendar creation
- Location plan includes calendar management

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid calendar data: ${error.message}

Common issues:
- Missing required fields (name, description)
- Invalid groupId (use get_calendar_groups to verify)
- Invalid slot duration or interval values
- Name already in use

Original error: ${error.message || error}`);
      }

      // Group not found
      if (error.message?.includes('(404)') && params.groupId) {
        throw new Error(`Calendar group not found: ${params.groupId}

The specified group ID doesn't exist.
Use get_calendar_groups tool to find valid group IDs.

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to create calendar: ${error.message || error}`);
    }
  }

  /**
   * Update an existing calendar
   */
  private async updateCalendar(params: any): Promise<any> {
    try {
      const { calendarId, ...updateData } = params;
      const response = await this.ghlClient.updateCalendar(calendarId, updateData);
      return response.data;
    } catch (error: any) {
      // Calendar not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar not found: ${params.calendarId}

The calendar may have been deleted or the ID is incorrect.
Use get_calendars tool to find valid calendar IDs.

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot update calendar.

This operation requires admin or calendar management permissions.

Please check:
- API key has calendar write/admin permissions
- User has permission to modify this calendar
- Calendar is not system-protected

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid update data: ${error.message}

Common issues:
- Invalid groupId (use get_calendar_groups to verify)
- Invalid slot duration or interval values
- Name conflicts with existing calendar

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to update calendar: ${error.message || error}`);
    }
  }

  /**
   * Delete a calendar
   */
  private async deleteCalendar(calendarId: string): Promise<any> {
    try {
      const response = await this.ghlClient.deleteCalendar(calendarId);
      return response.data;
    } catch (error: any) {
      // Calendar not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar not found: ${calendarId}

The calendar may have already been deleted or the ID is incorrect.
Use get_calendars tool to verify calendar exists.

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot delete calendar.

This operation requires admin permissions.

Please check:
- API key has calendar admin permissions
- User has permission to delete calendars
- Calendar is not system-protected

Original error: ${error.message || error}`);
      }

      // Calendar has active appointments
      if (error.message?.includes('(409)')) {
        throw new Error(`Cannot delete calendar: Active appointments exist.

This calendar has scheduled appointments and cannot be deleted.

Options:
1. Cancel all appointments first (use get_calendar_events to find them)
2. Disable the calendar instead of deleting
3. Wait until all appointments are completed

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to delete calendar: ${error.message || error}`);
    }
  }

  /**
   * APPOINTMENT BOOKING METHODS
   */

  /**
   * Get calendar events within a date range
   */
  private async getCalendarEvents(params: any): Promise<any> {
    try {
      // Convert ISO dates to milliseconds for GHL API
      const startTime = this.convertToMilliseconds(params.startTime);
      const endTime = this.convertToMilliseconds(params.endTime);

      const response = await this.ghlClient.getCalendarEvents({
        locationId: this.ghlClient.getConfig().locationId,
        calendarId: params.calendarId,
        startTime: startTime,
        endTime: endTime
      });
      return response.data;
    } catch (error: any) {
      // Calendar not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar not found: ${params.calendarId}

The calendar may have been deleted or the ID is incorrect.
Use get_calendars tool to find valid calendar IDs.

Original error: ${error.message || error}`);
      }

      // Invalid date/time format
      if (error.message?.includes('(400)') && error.message?.includes('time')) {
        throw new Error(`Invalid date/time format: ${error.message}

Date/time must be in ISO 8601 format.
Examples:
- "2025-10-20T09:00:00Z" (UTC)
- "2025-10-20T14:00:00-05:00" (with timezone offset)

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot access calendar events.

Please check:
- API key has calendar read permissions
- User has access to this calendar

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to get calendar events: ${error.message || error}`);
    }
  }

  /**
   * Get available time slots for booking
   */
  private async getFreeSlots(params: any): Promise<any> {
    try {
      // Convert date strings to milliseconds for GHL API
      const startDate = this.convertDateToMilliseconds(params.startDate);
      const endDate = this.convertDateToMilliseconds(params.endDate);

      const response = await this.ghlClient.getFreeSlots({
        calendarId: params.calendarId,
        startDate: startDate,
        endDate: endDate,
        timezone: params.timezone
      });
      return response.data;
    } catch (error: any) {
      // Calendar not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar not found: ${params.calendarId}

The calendar may have been deleted or the ID is incorrect.
Use get_calendars tool to find valid calendar IDs.

Original error: ${error.message || error}`);
      }

      // Invalid timezone
      if (error.message?.includes('(400)') && (error.message?.includes('timezone') || error.message?.includes('time zone'))) {
        throw new Error(`Invalid timezone: ${params.timezone}

Use standard IANA timezone format.
Examples:
- "America/New_York"
- "Europe/London"
- "Asia/Tokyo"
- "UTC"

Original error: ${error.message || error}`);
      }

      // Invalid date format
      if (error.message?.includes('(400)') && error.message?.includes('date')) {
        throw new Error(`Invalid date format: ${error.message}

Date must be in YYYY-MM-DD format.
Examples: "2025-10-20", "2025-12-31"

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot check calendar availability.

Please check:
- API key has calendar read permissions
- User has access to this calendar

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to get free slots: ${error.message || error}`);
    }
  }

  /**
   * Create a new appointment
   */
  private async createAppointment(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.createAppointment(params);
      return response.data;
    } catch (error: any) {
      // Appointment conflict (slot already booked)
      if (error.message?.includes('(409)')) {
        throw new Error(`Appointment conflict: Time slot is already booked.

The requested time slot is not available.

Solutions:
1. Use get_free_slots tool to find available times
2. Choose a different time slot
3. Check calendar availability before booking

Original error: ${error.message || error}`);
      }

      // Calendar not found
      if (error.message?.includes('(404)') && error.message?.includes('calendar')) {
        throw new Error(`Calendar not found: ${params.calendarId}

The calendar may have been deleted or the ID is incorrect.
Use get_calendars tool to find valid calendar IDs.

Original error: ${error.message || error}`);
      }

      // Contact not found
      if (error.message?.includes('(404)') && error.message?.includes('contact')) {
        throw new Error(`Contact not found: ${params.contactId}

The contact ID doesn't exist or has been deleted.
Use search_contacts tool to find valid contact IDs.

Original error: ${error.message || error}`);
      }

      // Invalid date/time format
      if (error.message?.includes('(400)') && error.message?.includes('time')) {
        throw new Error(`Invalid date/time format: ${error.message}

Use ISO 8601 format for startTime and endTime.
Example: "2025-10-20T14:00:00Z"

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid appointment data: ${error.message}

Common issues:
- Missing required fields (calendarId, contactId, startTime, endTime)
- Invalid time range (endTime must be after startTime)
- Invalid status value
- Invalid assignedUserId

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot create appointments.

Please check:
- API key has calendar write permissions
- User has permission to book on this calendar
- Calendar allows public booking

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to create appointment: ${error.message || error}`);
    }
  }

  /**
   * Get a specific appointment by ID
   */
  private async getAppointment(eventId: string): Promise<any> {
    try {
      const response = await this.ghlClient.getAppointment(eventId);
      return response.data;
    } catch (error: any) {
      // Appointment not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Appointment not found: ${eventId}

The appointment may have been deleted or the ID is incorrect.
Use get_calendar_events tool to find valid appointment IDs.

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot access this appointment.

Please check:
- API key has calendar read permissions
- User has access to this appointment

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to get appointment: ${error.message || error}`);
    }
  }

  /**
   * Update an existing appointment
   */
  private async updateAppointment(params: any): Promise<any> {
    try {
      const { eventId, ...updateData } = params;
      const response = await this.ghlClient.updateAppointment(eventId, updateData);
      return response.data;
    } catch (error: any) {
      // Appointment not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Appointment not found: ${params.eventId}

The appointment may have been deleted or the ID is incorrect.
Use get_calendar_events tool to find valid appointment IDs.

Original error: ${error.message || error}`);
      }

      // Appointment conflict (when rescheduling)
      if (error.message?.includes('(409)')) {
        throw new Error(`Appointment conflict: New time slot is already booked.

When rescheduling, the new time slot must be available.

Solutions:
1. Use get_free_slots tool to find available times
2. Choose a different time slot

Original error: ${error.message || error}`);
      }

      // Invalid date/time format
      if (error.message?.includes('(400)') && error.message?.includes('time')) {
        throw new Error(`Invalid date/time format: ${error.message}

Use ISO 8601 format for startTime and endTime.
Example: "2025-10-20T14:00:00Z"

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid update data: ${error.message}

Common issues:
- Invalid time range (endTime must be after startTime)
- Invalid status value
- Invalid assignedUserId

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot update this appointment.

Please check:
- API key has calendar write permissions
- User has permission to modify this appointment

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to update appointment: ${error.message || error}`);
    }
  }

  /**
   * Delete an appointment
   */
  private async deleteAppointment(eventId: string): Promise<any> {
    try {
      const response = await this.ghlClient.deleteAppointment(eventId);
      return response.data;
    } catch (error: any) {
      // Appointment not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Appointment not found: ${eventId}

The appointment may have already been deleted or the ID is incorrect.
Use get_calendar_events tool to verify appointment exists.

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot delete this appointment.

Please check:
- API key has calendar write/delete permissions
- User has permission to cancel this appointment

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to delete appointment: ${error.message || error}`);
    }
  }

  /**
   * SCHEDULE CONTROL METHODS
   */

  /**
   * Create a block slot to prevent bookings
   */
  private async createBlockSlot(params: any): Promise<any> {
    try {
      const response = await this.ghlClient.createBlockSlot(params);
      return response.data;
    } catch (error: any) {
      // Calendar not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Calendar not found: ${params.calendarId}

The calendar may have been deleted or the ID is incorrect.
Use get_calendars tool to find valid calendar IDs.

Original error: ${error.message || error}`);
      }

      // Time conflict with existing block or appointment
      if (error.message?.includes('(409)')) {
        throw new Error(`Time conflict: The specified time overlaps with existing block or appointment.

The time slot you're trying to block is already occupied.

Solutions:
1. Use get_calendar_events to see existing blocks/appointments
2. Choose a different time slot
3. Delete conflicting block/appointment first

Original error: ${error.message || error}`);
      }

      // Invalid date/time format
      if (error.message?.includes('(400)') && error.message?.includes('time')) {
        throw new Error(`Invalid date/time format: ${error.message}

Use ISO 8601 format for startTime and endTime.
Example: "2025-10-20T12:00:00Z"

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid block slot data: ${error.message}

Common issues:
- Missing required fields (calendarId, startTime, endTime)
- Invalid time range (endTime must be after startTime)
- Invalid assignedUserId

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot create block slots.

Please check:
- API key has calendar write permissions
- User has permission to block time on this calendar

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to create block slot: ${error.message || error}`);
    }
  }

  /**
   * Update an existing block slot
   */
  private async updateBlockSlot(params: any): Promise<any> {
    try {
      const { eventId, ...updateData } = params;
      const response = await this.ghlClient.updateBlockSlot(eventId, updateData);
      return response.data;
    } catch (error: any) {
      // Block slot not found
      if (error.message?.includes('(404)')) {
        throw new Error(`Block slot not found: ${params.eventId}

The block slot may have been deleted or the ID is incorrect.
Use get_calendar_events tool to find valid block slot IDs.

Original error: ${error.message || error}`);
      }

      // Time conflict when rescheduling
      if (error.message?.includes('(409)')) {
        throw new Error(`Time conflict: New time overlaps with existing block or appointment.

When rescheduling a block, the new time must be available.

Solutions:
1. Use get_calendar_events to check for conflicts
2. Choose a different time slot

Original error: ${error.message || error}`);
      }

      // Invalid date/time format
      if (error.message?.includes('(400)') && error.message?.includes('time')) {
        throw new Error(`Invalid date/time format: ${error.message}

Use ISO 8601 format for startTime and endTime.
Example: "2025-10-20T12:00:00Z"

Original error: ${error.message || error}`);
      }

      // Validation errors
      if (error.message?.includes('(400)')) {
        throw new Error(`Invalid update data: ${error.message}

Common issues:
- Invalid time range (endTime must be after startTime)
- Invalid assignedUserId

Original error: ${error.message || error}`);
      }

      // Permission errors
      if (error.message?.includes('(401)') || error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot update this block slot.

Please check:
- API key has calendar write permissions
- User has permission to modify blocks on this calendar

Original error: ${error.message || error}`);
      }

      throw new Error(`Failed to update block slot: ${error.message || error}`);
    }
  }

  /**
   * HELPER METHODS
   */

  /**
   * Convert date string to milliseconds for GHL API
   * GHL API expects timestamps in milliseconds, not ISO 8601
   * Used for: getCalendarEvents (startTime/endTime)
   */
  private convertToMilliseconds(dateString: string): string {
    // If already in milliseconds, return as is
    if (/^\d+$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse as ISO date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getTime().toString();
    }
    
    // Return as is if can't parse
    return dateString;
  }

  /**
   * Convert date string to milliseconds for date-only values
   * Returns number instead of string
   * Used for: getFreeSlots (startDate/endDate)
   */
  private convertDateToMilliseconds(dateString: string): number {
    // If already in milliseconds, parse and return
    if (/^\d+$/.test(dateString)) {
      return parseInt(dateString, 10);
    }
    
    // Try to parse as date string (YYYY-MM-DD format)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
    
    // Fallback to current time
    return Date.now();
  }
}
