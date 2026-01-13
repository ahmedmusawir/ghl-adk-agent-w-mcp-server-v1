import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  // Invoice Template Types
  CreateInvoiceTemplateDto,
  CreateInvoiceTemplateResponseDto,
  UpdateInvoiceTemplateDto,
  UpdateInvoiceTemplateResponseDto,
  DeleteInvoiceTemplateResponseDto,
  ListTemplatesResponse,
  InvoiceTemplate,
  UpdateInvoiceLateFeesConfigurationDto,
  UpdatePaymentMethodsConfigurationDto,
  
  // Invoice Schedule Types
  CreateInvoiceScheduleDto,
  CreateInvoiceScheduleResponseDto,
  UpdateInvoiceScheduleDto,
  UpdateInvoiceScheduleResponseDto,
  DeleteInvoiceScheduleResponseDto,
  ListSchedulesResponse,
  GetScheduleResponseDto,
  ScheduleInvoiceScheduleDto,
  ScheduleInvoiceScheduleResponseDto,
  AutoPaymentScheduleDto,
  AutoPaymentInvoiceScheduleResponseDto,
  CancelInvoiceScheduleDto,
  CancelInvoiceScheduleResponseDto,
  UpdateAndScheduleInvoiceScheduleResponseDto,
  
  // Invoice Types
  CreateInvoiceDto,
  CreateInvoiceResponseDto,
  UpdateInvoiceDto,
  UpdateInvoiceResponseDto,
  DeleteInvoiceResponseDto,
  GetInvoiceResponseDto,
  ListInvoicesResponseDto,
  VoidInvoiceDto,
  VoidInvoiceResponseDto,
  SendInvoiceDto,
  SendInvoicesResponseDto,
  RecordPaymentDto,
  RecordPaymentResponseDto,
  Text2PayDto,
  Text2PayInvoiceResponseDto,
  GenerateInvoiceNumberResponse,
  PatchInvoiceStatsLastViewedDto,
  
  // Estimate Types
  CreateEstimatesDto,
  EstimateResponseDto,
  UpdateEstimateDto,
  SendEstimateDto,
  CreateInvoiceFromEstimateDto,
  CreateInvoiceFromEstimateResponseDto,
  ListEstimatesResponseDto,
  EstimateIdParam,
  GenerateEstimateNumberResponse,
  EstimateTemplatesDto,
  EstimateTemplateResponseDto,
  ListEstimateTemplateResponseDto,
  AltDto
} from '../types/ghl-types.js';

export class InvoicesTools {
  private client: GHLApiClient;

  constructor(client: GHLApiClient) {
    this.client = client;
  }

  getToolDefinitions(): any[] {
    return [
      // Invoice Template Tools
      {
        name: 'create_invoice_template',
        description: `Create a reusable invoice template.

Build professional invoice templates for recurring billing scenarios.

⚠️ CRITICAL - MONETARY VALUE FORMAT:
Amount must be a FLOAT with explicit decimal places. The API does NOT use cents.
- For $99.00, use: 99.00 (NOT 9900)
- For $1,500.50, use: 1500.50

USAGE EXAMPLE:
{
  "name": "Monthly Service Template",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company",
    "phoneNo": "+1234567890",
    "website": "https://example.com"
  },
  "items": [
    {
      "name": "Monthly Service Fee",
      "description": "Web hosting service",
      "currency": "USD",
      "amount": 99.00,
      "qty": 1,
      "type": "recurring"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 0
  },
  "title": "Monthly Service Invoice"
}

REQUIRED FIELDS:
- name: Template name (internal identifier)
- currency: Currency code (USD, EUR, etc.)
- businessDetails: Your business info (name, phone, website)
- items: Array of line items (name, amount as float, qty, currency, type)
- discount: Discount settings (type: "percentage" or "fixed", value: number)

OPTIONAL FIELDS:
- title: Customer-facing invoice title
- termsNotes: Terms and conditions text
- invoiceNumberPrefix: Prefix for invoice numbers

Returns: Created template with ID.

Related Tools: list_invoice_templates, update_invoice_template, delete_invoice_template`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Template name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring" (REQUIRED)')
          })).describe('Line items array (REQUIRED)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings (REQUIRED)'),
          title: z.string().optional().describe('Customer-facing invoice title'),
          termsNotes: z.string().optional().describe('Terms and conditions'),
          invoiceNumberPrefix: z.string().optional().describe('Prefix for invoice numbers')
        }
      },
      {
        name: 'list_invoice_templates',
        description: `List all invoice templates with filtering.

View and manage your invoice templates.

Use Cases:
- Browse all templates
- Search for specific templates
- Filter by status or payment mode
- Audit template usage

Filtering Options:
- **status**: Filter by template status
- **search**: Search by template name
- **paymentMode**: Filter by live/test mode

Pagination:
- limit: Templates per page (default: 10)
- offset: Skip N templates

Returns: Array of invoice templates.

Related Tools: create_invoice_template, get_invoice_template`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          limit: z.string().optional().describe('Templates per page (default: 10)'),
          offset: z.string().optional().describe('Number to skip (pagination)'),
          status: z.string().optional().describe('Filter by status'),
          search: z.string().optional().describe('Search by template name'),
          paymentMode: z.enum(['default', 'live', 'test']).optional().describe('Payment mode filter')
        }
      },
      {
        name: 'get_invoice_template',
        description: `Get complete details for an invoice template.

Retrieve full template configuration and settings.

Use Cases:
- View template details
- Review template configuration
- Copy template settings
- Verify template before use

What You Get:
- Template name and title
- Currency settings
- Payment terms
- Line items configuration
- All template settings

Returns: Complete template object.

Related Tools: list_invoice_templates, update_invoice_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to retrieve'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'update_invoice_template',
        description: `Update an existing invoice template.

Modify template settings and configuration.

USAGE EXAMPLE:
{
  "templateId": "template123",
  "name": "Updated Service Template",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company Updated"
  },
  "items": [
    {
      "name": "Updated Service",
      "currency": "USD",
      "amount": 129.00,
      "qty": 1,
      "type": "recurring"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 10
  }
}

NOTE: When updating, you must provide the complete template data including businessDetails, items, and discount.

Returns: Updated template.

Related Tools: get_invoice_template, create_invoice_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to update'),
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Template name'),
          currency: z.string().describe('Currency code like USD, EUR'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring"')
          })).describe('Line items array'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings'),
          title: z.string().optional().describe('Customer-facing invoice title'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'delete_invoice_template',
        description: `Delete an invoice template permanently.

⚠️ WARNING: This action cannot be undone!

Use Cases:
- Remove unused templates
- Clean up old templates
- Delete test templates

What Happens:
- Template is permanently deleted
- Cannot be recovered
- Active invoices using template are not affected

💡 Best Practice: Export template data before deleting.

Returns: Confirmation of deletion.

Related Tools: list_invoice_templates, create_invoice_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to delete'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'update_invoice_template_late_fees',
        description: `Configure late fee settings for invoice template.

Automate late payment penalties.

Use Cases:
- Set late payment fees
- Configure grace periods
- Automate penalty charges

Returns: Updated template with late fee configuration.

Related Tools: create_invoice_template, update_invoice_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID'),
          altId: z.string().optional().describe('Location ID'),
          enabled: z.boolean().describe('Enable/disable late fees'),
          feeType: z.enum(['percentage', 'fixed']).optional().describe('Fee type'),
          feeAmount: z.number().optional().describe('Fee amount or percentage'),
          gracePeriodDays: z.number().optional().describe('Days before late fee applies')
        }
      },
      {
        name: 'update_invoice_template_payment_methods',
        description: `Configure accepted payment methods for template.

Set available payment options for invoices.

Use Cases:
- Enable credit card payments
- Configure ACH/bank transfers
- Set payment gateway options

Returns: Updated template with payment methods.

Related Tools: create_invoice_template, update_invoice_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID'),
          altId: z.string().optional().describe('Location ID'),
          creditCard: z.boolean().optional().describe('Accept credit cards'),
          ach: z.boolean().optional().describe('Accept ACH/bank transfers'),
          cash: z.boolean().optional().describe('Accept cash payments'),
          check: z.boolean().optional().describe('Accept check payments')
        }
      },

      // Invoice Schedule Tools
      {
        name: 'create_invoice_schedule',
        description: `Create a recurring invoice schedule.

Automate invoice generation with recurring schedules.

USAGE EXAMPLE:
{
  "name": "Monthly Retainer",
  "currency": "USD",
  "liveMode": false,
  "businessDetails": {
    "name": "My Company",
    "phoneNo": "+1234567890"
  },
  "contactDetails": {
    "id": "contact123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Monthly Service Fee",
      "currency": "USD",
      "amount": 1000.00,
      "qty": 1,
      "type": "recurring"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 0
  },
  "schedule": {
    "rrule": {
      "intervalType": "monthly",
      "interval": 1,
      "startDate": "2025-01-01",
      "dayOfMonth": 1,
      "dayOfWeek": "mo",
      "numOfWeek": 1
    }
  }
}

REQUIRED FIELDS:
- name: Schedule name
- currency: Currency code (USD, EUR, etc.)
- liveMode: Set false for test, true for production
- businessDetails: Your business info (name, phone, website)
- contactDetails: Customer info (id, name, email required)
- items: Array of line items (name, amount as float, qty, currency, type)
- discount: Discount settings (type: "percentage" or "fixed", value: number)
- schedule: Schedule options with executeAt date and rrule for recurrence

OPTIONAL FIELDS:
- title: Schedule title (MAX 40 CHARACTERS)
- termsNotes: Terms and conditions

IMPORTANT CONSTRAINTS:
- Use executeAt OR rrule, NOT BOTH at the same time
- executeAt: For one-time scheduled invoice on specific date
- rrule: For recurring invoices with frequency pattern

SCHEDULE RRULE OPTIONS (use only if NOT using executeAt):
- intervalType: "daily", "weekly", "monthly", "yearly" (REQUIRED)
- interval: Number of periods between invoices (REQUIRED)
- startDate: Start date YYYY-MM-DD (REQUIRED)
- dayOfMonth: Day of month (-1 to 28, not 0) (REQUIRED)
- dayOfWeek: Day of week "mo", "tu", "we", "th", "fr", "sa", "su" (REQUIRED)
- numOfWeek: Week number in month (-1 to 4) (REQUIRED)
- count: Number of invoices to generate (optional)

Returns: Created schedule with ID.

Related Tools: list_invoice_schedules, update_invoice_schedule, schedule_invoice_schedule`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Schedule name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website')
          }).describe('Business details (REQUIRED)'),
          contactDetails: z.object({
            id: z.string().describe('Contact ID (REQUIRED)'),
            name: z.string().describe('Contact name (REQUIRED)'),
            email: z.string().optional().describe('Contact email'),
            phoneNo: z.string().optional().describe('Contact phone')
          }).describe('Customer contact details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type')
          })).describe('Line items array (REQUIRED)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings (REQUIRED)'),
          schedule: z.object({
            executeAt: z.string().optional().describe('One-time execution date YYYY-MM-DD (use this OR rrule, not both)'),
            rrule: z.object({
              intervalType: z.enum(['daily', 'weekly', 'monthly', 'yearly']).describe('Frequency type (REQUIRED)'),
              interval: z.number().describe('Interval between invoices (REQUIRED)'),
              startDate: z.string().describe('Start date YYYY-MM-DD (REQUIRED)'),
              dayOfMonth: z.number().describe('Day of month (-1 to 28, not 0) (REQUIRED)'),
              dayOfWeek: z.enum(['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su']).describe('Day of week (REQUIRED)'),
              numOfWeek: z.number().describe('Week number in month (-1 to 4) (REQUIRED)'),
              count: z.number().optional().describe('Number of invoices to generate')
            }).optional().describe('Recurrence rule (use this OR executeAt, not both)')
          }).describe('Schedule options (REQUIRED)'),
          title: z.string().optional().describe('Schedule title (MAX 40 CHARACTERS)'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'list_invoice_schedules',
        description: `List all recurring invoice schedules.

View and manage automated billing schedules.

Use Cases:
- Monitor active schedules
- Review billing automation
- Filter by status

Returns: Array of invoice schedules.

Related Tools: create_invoice_schedule, get_invoice_schedule`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          limit: z.string().optional().describe('Schedules per page (default: 10)'),
          offset: z.string().optional().describe('Pagination offset'),
          status: z.string().optional().describe('Filter by status'),
          search: z.string().optional().describe('Search schedules')
        }
      },
      {
        name: 'get_invoice_schedule',
        description: `Get recurring invoice schedule details.

Retrieve full schedule configuration.

Returns: Complete schedule object.

Related Tools: list_invoice_schedules, update_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'update_invoice_schedule',
        description: `Update a recurring invoice schedule.

Modify schedule settings and frequency.

Use Cases:
- Change billing frequency
- Update schedule name
- Modify template

Returns: Updated schedule.

Related Tools: get_invoice_schedule, schedule_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID to update'),
          altId: z.string().optional().describe('Location ID'),
          name: z.string().optional().describe('Schedule name'),
          templateId: z.string().optional().describe('Invoice template ID'),
          frequency: z.string().optional().describe('Billing frequency')
        }
      },
      {
        name: 'delete_invoice_schedule',
        description: `Delete a recurring invoice schedule.

⚠️ WARNING: This stops automated billing!

Use Cases:
- Cancel recurring billing
- Remove old schedules

Returns: Confirmation of deletion.

Related Tools: list_invoice_schedules, cancel_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID to delete'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'schedule_invoice_schedule',
        description: `Activate/schedule an invoice schedule.

Start automated invoice generation.

USAGE EXAMPLE:
{
  "scheduleId": "schedule123",
  "liveMode": false
}

REQUIRED FIELDS:
- scheduleId: The schedule ID to activate
- liveMode: Set false for test, true for production

Returns: Scheduled invoice schedule.

Related Tools: create_invoice_schedule, cancel_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID to activate'),
          altId: z.string().optional().describe('Location ID'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)')
        }
      },
      {
        name: 'auto_payment_invoice_schedule',
        description: `Enable automatic payment for invoice schedule.

Automate payment collection for recurring invoices.

USAGE EXAMPLE:
{
  "scheduleId": "schedule123",
  "id": "paymentMethod123",
  "autoPayment": {
    "enable": true,
    "type": "Card",
    "paymentMethodId": "pm_123"
  }
}

REQUIRED FIELDS:
- scheduleId: The schedule ID to configure
- id: Payment method ID or customer ID
- autoPayment: Auto payment configuration object
  - enable: true to enable, false to disable (REQUIRED)
  - type: "card", "us_bank_account" (REQUIRED)
  - paymentMethodId: Payment method ID (optional)
  - customerId: Customer ID (optional)
  - card: Object with brand/last4 if type is "card" (optional)
  - usBankAccount: Object with bank_name/last4 if type is "us_bank_account" (optional)

Returns: Updated schedule with auto-payment enabled.

Related Tools: schedule_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID'),
          altId: z.string().optional().describe('Location ID'),
          id: z.string().describe('Payment method ID or customer ID (REQUIRED)'),
          autoPayment: z.object({
            enable: z.boolean().describe('Enable/disable auto-payment (REQUIRED)'),
            type: z.string().describe('Payment type (e.g., "card", "us_bank_account") (REQUIRED)'),
            paymentMethodId: z.string().optional().describe('Payment method ID'),
            customerId: z.string().optional().describe('Customer ID'),
            cardId: z.string().optional().describe('Card ID')
          }).describe('Auto payment configuration (REQUIRED)')
        }
      },
      {
        name: 'cancel_invoice_schedule',
        description: `Cancel a recurring invoice schedule.

Stop automated invoice generation without deleting.

Use Cases:
- Pause recurring billing
- Temporarily stop invoices

Returns: Canceled schedule (can be reactivated).

Related Tools: schedule_invoice_schedule, delete_invoice_schedule`,
        inputSchema: {
          scheduleId: z.string().describe('Schedule ID to cancel'),
          altId: z.string().optional().describe('Location ID')
        }
      },

      // Invoice Management Tools
      {
        name: 'create_invoice',
        description: `Create a new invoice for a customer.

Generate professional invoices for products and services.

USAGE EXAMPLE:
{
  "name": "Invoice for Services",
  "currency": "USD",
  "issueDate": "2025-12-24",
  "liveMode": false,
  "businessDetails": {
    "name": "My Company",
    "phoneNo": "+1234567890"
  },
  "contactDetails": {
    "id": "contact123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Security System Upgrade",
      "currency": "USD",
      "amount": 150000.00,
      "qty": 1,
      "type": "one_time"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 0
  },
  "sentTo": {
    "email": ["john@example.com"]
  },
  "title": "Security Upgrade",
  "dueDate": "2026-01-23"
}

REQUIRED FIELDS:
- name: Invoice name (internal identifier)
- currency: Currency code (USD, EUR, etc.)
- issueDate: Issue date (YYYY-MM-DD format)
- liveMode: Set false for test, true for production
- businessDetails: Your business info (name, phone, website)
- contactDetails: Customer info (id, name, email required)
- items: Array of line items (name, amount as float, qty, currency, type)
- discount: Discount settings (type: "percentage" or "fixed", value: number)
- sentTo: Recipient info with email array

OPTIONAL FIELDS:
- title: Customer-facing invoice title (MAX 40 CHARACTERS)
- dueDate: Payment due date (YYYY-MM-DD)
- termsNotes: Terms and conditions

IMPORTANT CONSTRAINTS:
- title: Maximum 40 characters

Returns: Created invoice with ID.

Related Tools: list_invoices, send_invoice, record_invoice_payment`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Invoice name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          issueDate: z.string().describe('Issue date YYYY-MM-DD (REQUIRED)'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details (REQUIRED)'),
          contactDetails: z.object({
            id: z.string().describe('Contact ID (REQUIRED)'),
            name: z.string().describe('Contact name (REQUIRED)'),
            email: z.string().optional().describe('Contact email'),
            phoneNo: z.string().optional().describe('Contact phone')
          }).describe('Customer contact details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 150000.00 = $150,000). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring" (REQUIRED)')
          })).describe('Line items array (REQUIRED)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings (REQUIRED)'),
          sentTo: z.object({
            email: z.array(z.string()).optional().describe('Array of recipient emails')
          }).describe('Recipient info (REQUIRED)'),
          title: z.string().optional().describe('Customer-facing invoice title (MAX 40 characters)'),
          dueDate: z.string().optional().describe('Payment due date (YYYY-MM-DD)'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'list_invoices',
        description: `List all invoices with filtering.

View and manage customer invoices.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from invoice responses:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")
- Example: amount: 150000, currency: "USD" → display as "150000.00 USD"

Use Cases:
- Browse all invoices
- Filter by status (paid, unpaid, overdue)
- Search by customer

Returns: Array of invoices.

Related Tools: create_invoice, get_invoice`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          limit: z.string().optional().describe('Invoices per page (default: 10)'),
          offset: z.string().optional().describe('Pagination offset'),
          status: z.string().optional().describe('Filter by status'),
          contactId: z.string().optional().describe('Filter by contact'),
          search: z.string().optional().describe('Search invoices')
        }
      },
      {
        name: 'get_invoice',
        description: `Get complete invoice details.

Retrieve full invoice information.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from this response:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Returns: Complete invoice object.

Related Tools: list_invoices, update_invoice`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'update_invoice',
        description: `Update an existing invoice.

Modify invoice details before sending.

Use Cases:
- Update invoice items
- Change due date
- Modify amounts

Returns: Updated invoice.

Related Tools: get_invoice, send_invoice`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to update'),
          altId: z.string().optional().describe('Location ID'),
          title: z.string().optional().describe('Invoice title'),
          currency: z.string().optional().describe('Currency code'),
          dueDate: z.string().optional().describe('Due date'),
          items: z.array(z.any()).optional().describe('Invoice items')
        }
      },
      {
        name: 'delete_invoice',
        description: `Delete an invoice permanently.

⚠️ WARNING: This action cannot be undone!

Use Cases:
- Remove draft invoices
- Delete incorrect invoices

Returns: Confirmation of deletion.

Related Tools: void_invoice (for sent invoices)`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to delete'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'void_invoice',
        description: `Void a sent invoice.

Cancel an invoice without deleting (maintains record).

Use Cases:
- Cancel sent invoices
- Maintain audit trail
- Reverse billing errors

Returns: Voided invoice.

Related Tools: delete_invoice, record_invoice_payment`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to void'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'send_invoice',
        description: `Send invoice to customer via email/SMS.

Deliver invoice with payment link.

USAGE EXAMPLE:
{
  "invoiceId": "invoice123",
  "action": "email",
  "liveMode": false,
  "userId": "user123"
}

REQUIRED FIELDS:
- invoiceId: The invoice ID to send
- action: Delivery method - "email", "sms", "sms_and_email", or "send_manually"
- liveMode: Set false for test, true for production
- userId: User ID sending the invoice

Returns: Confirmation of send.

Related Tools: create_invoice, text2pay_invoice`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID to send'),
          altId: z.string().optional().describe('Location ID'),
          action: z.enum(['email', 'sms', 'sms_and_email', 'send_manually']).describe('Delivery method (REQUIRED)'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)'),
          userId: z.string().describe('User ID sending the invoice (REQUIRED)')
        }
      },
      {
        name: 'record_invoice_payment',
        description: `Record a manual payment for an invoice.

Log offline or external payments.

USAGE EXAMPLE:
{
  "invoiceId": "invoice123",
  "mode": "bank_transfer",
  "notes": "Wire transfer received",
  "amount": 250000.00
}

REQUIRED FIELDS:
- invoiceId: The invoice ID to record payment for
- mode: Payment mode - "cash", "card", "cheque", "bank_transfer", or "other"
- notes: Payment notes/description

OPTIONAL FIELDS:
- amount: Payment amount as float (e.g., 500.00 for $500) - for partial payments
- card: Card details object (if mode is "card")
- cheque: Cheque details object (if mode is "cheque")

Returns: Updated invoice with payment recorded.

Related Tools: get_invoice, list_invoices`,
        inputSchema: {
          invoiceId: z.string().describe('Invoice ID'),
          altId: z.string().optional().describe('Location ID'),
          mode: z.enum(['cash', 'card', 'cheque', 'bank_transfer', 'other']).describe('Payment mode (REQUIRED)'),
          notes: z.string().describe('Payment notes/description (REQUIRED)'),
          amount: z.number().optional().describe('Payment amount in cents (for partial payments)')
        }
      },
      {
        name: 'generate_invoice_number',
        description: `Generate unique invoice number.

Create sequential invoice numbers.

Use Cases:
- Get next invoice number
- Maintain invoice numbering

Returns: Next available invoice number.

Related Tools: create_invoice`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'text2pay_invoice',
        description: `Create and send invoice via SMS with payment link (Text2Pay).

Creates a new invoice and delivers it via SMS in one step.

USAGE EXAMPLE:
{
  "name": "SMS Invoice",
  "currency": "USD",
  "issueDate": "2025-12-24",
  "liveMode": false,
  "action": "send",
  "userId": "user123",
  "contactDetails": {
    "id": "contact123",
    "name": "John Doe",
    "phoneNo": "+1234567890"
  },
  "items": [
    {
      "name": "Service Fee",
      "currency": "USD",
      "amount": 100.00,
      "qty": 1,
      "type": "one_time"
    }
  ],
  "sentTo": {
    "phoneNo": ["+1234567890"]
  }
}

REQUIRED FIELDS:
- name: Invoice name
- currency: Currency code (USD, EUR, etc.)
- issueDate: Issue date (YYYY-MM-DD format)
- liveMode: Set false for test, true for production
- action: "draft" or "send"
- userId: User ID creating/sending the invoice
- contactDetails: Customer info (id, name, phoneNo required for SMS)
- items: Array of line items (name, amount as float, qty, currency, type)
- sentTo: Recipient info with phoneNo array for SMS

OPTIONAL FIELDS:
- title: Invoice title (MAX 40 CHARACTERS)
- discount: Discount settings
- businessDetails: Your business info

Returns: Created invoice with SMS confirmation.

Related Tools: send_invoice, create_invoice`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Invoice name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          issueDate: z.string().describe('Issue date YYYY-MM-DD (REQUIRED)'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)'),
          action: z.enum(['draft', 'send']).describe('Action: "draft" or "send" (REQUIRED)'),
          userId: z.string().describe('User ID creating/sending the invoice (REQUIRED)'),
          contactDetails: z.object({
            id: z.string().describe('Contact ID (REQUIRED)'),
            name: z.string().describe('Contact name (REQUIRED)'),
            phoneNo: z.string().optional().describe('Contact phone for SMS'),
            email: z.string().optional().describe('Contact email')
          }).describe('Customer contact details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type')
          })).describe('Line items array (REQUIRED)'),
          sentTo: z.object({
            phoneNo: z.array(z.string()).optional().describe('Array of phone numbers for SMS'),
            email: z.array(z.string()).optional().describe('Array of emails')
          }).describe('Recipient info (REQUIRED)'),
          title: z.string().optional().describe('Invoice title (MAX 40 CHARACTERS)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).optional().describe('Discount settings'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website')
          }).optional().describe('Business details')
        }
      },

      // Estimate Tools
      {
        name: 'create_estimate',
        description: `Create a new estimate/quote for a customer.

Provide pricing quotes before invoicing.

USAGE EXAMPLE:
{
  "name": "Project Quote",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company",
    "phoneNo": "+1234567890",
    "website": "https://example.com"
  },
  "contactDetails": {
    "id": "contact123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "items": [
    {
      "name": "Consulting Service",
      "description": "Initial consultation",
      "currency": "USD",
      "amount": 150.00,
      "qty": 1,
      "type": "one_time"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 0
  },
  "frequencySettings": {
    "enabled": false
  },
  "title": "Service Estimate",
  "expiryDate": "2025-01-31"
}

REQUIRED FIELDS:
- name: Estimate name (internal identifier)
- currency: Currency code (USD, EUR, etc.)
- businessDetails: Your business info (name, phone, website)
- contactDetails: Customer info (id, name, email required)
- items: Array of line items (name, amount as float, qty, currency, type)
- discount: Discount settings (type: "percentage" or "fixed", value: number)
- frequencySettings: { enabled: false } for one-time estimates

OPTIONAL FIELDS:
- title: Customer-facing estimate title
- expiryDate: Expiration date (YYYY-MM-DD format)
- issueDate: Issue date (YYYY-MM-DD format)
- termsNotes: Terms and conditions

Returns: Created estimate with ID.

Related Tools: send_estimate, create_invoice_from_estimate`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Estimate name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details (REQUIRED)'),
          contactDetails: z.object({
            id: z.string().describe('Contact ID (REQUIRED)'),
            name: z.string().describe('Contact name (REQUIRED)'),
            email: z.string().optional().describe('Contact email'),
            phoneNo: z.string().optional().describe('Contact phone')
          }).describe('Customer contact details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 150.00 = $150.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring" (REQUIRED)')
          })).describe('Line items array (REQUIRED)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings (REQUIRED)'),
          frequencySettings: z.object({
            enabled: z.boolean().describe('Enable recurring estimates (usually false for one-time)')
          }).describe('Frequency settings (REQUIRED) - set enabled: false for one-time estimates'),
          title: z.string().optional().describe('Customer-facing estimate title'),
          expiryDate: z.string().optional().describe('Expiration date (YYYY-MM-DD)'),
          issueDate: z.string().optional().describe('Issue date (YYYY-MM-DD)'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'list_estimates',
        description: `List all estimates with filtering.

View and manage customer estimates.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from estimate responses:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Use Cases:
- Browse all estimates
- Filter by status (draft, sent, accepted, declined)
- Track estimate conversions

Returns: Array of estimates.

Related Tools: create_estimate, get_estimate`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          limit: z.string().optional().describe('Estimates per page (default: 10)'),
          offset: z.string().optional().describe('Pagination offset'),
          status: z.enum(['all', 'draft', 'sent', 'accepted', 'declined', 'invoiced', 'viewed']).optional().describe('Filter by status'),
          contactId: z.string().optional().describe('Filter by contact'),
          search: z.string().optional().describe('Search estimates')
        }
      },
      {
        name: 'get_estimate',
        description: `Get complete estimate details.

Retrieve full estimate information.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from this response:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Returns: Complete estimate object.

Related Tools: list_estimates, update_estimate`,
        inputSchema: {
          estimateId: z.string().describe('Estimate ID'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'update_estimate',
        description: `Update an existing estimate.

Modify estimate details before sending.

USAGE EXAMPLE:
{
  "estimateId": "estimate123",
  "name": "Updated Project Quote",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company"
  },
  "contactDetails": {
    "id": "contact123",
    "name": "John Doe"
  },
  "items": [
    {
      "name": "Updated Service",
      "currency": "USD",
      "amount": 200.00,
      "qty": 1,
      "type": "one_time"
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 10
  }
}

NOTE: When updating, you must provide the complete estimate data including businessDetails, contactDetails, items, and discount.

Returns: Updated estimate.

Related Tools: get_estimate, send_estimate`,
        inputSchema: {
          estimateId: z.string().describe('Estimate ID to update'),
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Estimate name'),
          currency: z.string().describe('Currency code like USD, EUR'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details'),
          contactDetails: z.object({
            id: z.string().describe('Contact ID'),
            name: z.string().describe('Contact name'),
            email: z.string().optional().describe('Contact email'),
            phoneNo: z.string().optional().describe('Contact phone')
          }).describe('Customer contact details'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring"')
          })).describe('Line items array'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings'),
          frequencySettings: z.object({
            enabled: z.boolean().describe('Enable recurring estimates')
          }).describe('Frequency settings'),
          title: z.string().optional().describe('Customer-facing estimate title'),
          expiryDate: z.string().optional().describe('Expiration date (YYYY-MM-DD)'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'delete_estimate',
        description: `Delete an estimate permanently.

⚠️ WARNING: This action cannot be undone!

Use Cases:
- Remove draft estimates
- Delete incorrect estimates

Returns: Confirmation of deletion.

Related Tools: list_estimates`,
        inputSchema: {
          estimateId: z.string().describe('Estimate ID to delete'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'send_estimate',
        description: `Send estimate to customer.

Deliver quote with acceptance link.

USAGE EXAMPLE:
{
  "estimateId": "estimate123",
  "action": "email",
  "liveMode": false,
  "userId": "user123"
}

REQUIRED FIELDS:
- estimateId: The estimate ID to send
- action: Delivery method - "email", "sms", "sms_and_email", or "send_manually"
- liveMode: Set to false for test mode, true for production
- userId: The user ID sending the estimate

OPTIONAL FIELDS:
- estimateName: Custom name for the estimate

Returns: Confirmation of send.

Related Tools: create_estimate, create_invoice_from_estimate`,
        inputSchema: {
          estimateId: z.string().describe('Estimate ID to send'),
          altId: z.string().optional().describe('Location ID'),
          action: z.enum(['email', 'sms', 'sms_and_email', 'send_manually']).describe('Delivery method (REQUIRED)'),
          liveMode: z.boolean().describe('Set false for test, true for production (REQUIRED)'),
          userId: z.string().describe('User ID sending the estimate (REQUIRED)'),
          estimateName: z.string().optional().describe('Custom estimate name')
        }
      },
      {
        name: 'create_invoice_from_estimate',
        description: `Convert accepted estimate to invoice.

Turn approved quotes into billable invoices.

USAGE EXAMPLE:
{
  "estimateId": "estimate123",
  "markAsInvoiced": true
}

REQUIRED FIELDS:
- estimateId: The estimate ID to convert
- markAsInvoiced: Set to true to mark the estimate as invoiced

OPTIONAL FIELDS:
- version: API version ("v1" or "v2")

Returns: Created invoice from estimate.

Related Tools: send_estimate, create_invoice`,
        inputSchema: {
          estimateId: z.string().describe('Estimate ID to convert'),
          altId: z.string().optional().describe('Location ID'),
          markAsInvoiced: z.boolean().describe('Mark estimate as invoiced (REQUIRED) - usually true'),
          version: z.enum(['v1', 'v2']).optional().describe('API version')
        }
      },
      {
        name: 'generate_estimate_number',
        description: `Generate unique estimate number.

Create sequential estimate numbers.

Use Cases:
- Get next estimate number
- Maintain estimate numbering

Returns: Next available estimate number.

Related Tools: create_estimate`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID')
        }
      },

      // Estimate Template Tools
      {
        name: 'list_estimate_templates',
        description: `List all estimate templates.

View and manage estimate templates.

Use Cases:
- Browse all estimate templates
- Find template for quotes
- Audit template usage

Returns: Array of estimate templates.

Related Tools: create_estimate_template, get_estimate_template`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          limit: z.string().optional().describe('Templates per page (default: 10)'),
          offset: z.string().optional().describe('Pagination offset')
        }
      },
      {
        name: 'get_estimate_template',
        description: `Get complete details for an estimate template.

Retrieve full template configuration.

Use Cases:
- View template details
- Review template configuration
- Copy template settings

Returns: Complete estimate template object.

Related Tools: list_estimate_templates, update_estimate_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to retrieve'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'create_estimate_template',
        description: `Create a reusable estimate template.

Build professional estimate templates for quotes.

USAGE EXAMPLE:
{
  "name": "Standard Quote Template",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company",
    "phoneNo": "+1234567890",
    "website": "https://example.com"
  },
  "items": [
    {
      "name": "Consulting Service",
      "description": "1 hour consultation",
      "currency": "USD",
      "amount": 150.00,
      "qty": 1
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 0
  },
  "title": "Service Estimate"
}

REQUIRED FIELDS:
- name: Template name
- currency: Currency code (USD, EUR, etc.)
- businessDetails: Your business info (name, phone, website, address)
- items: Array of line items (name, amount in cents, qty, currency)
- discount: Discount settings (type: "percentage" or "fixed", value: number)

OPTIONAL FIELDS:
- title: Estimate title
- termsNotes: Terms and conditions text
- estimateNumberPrefix: Prefix for estimate numbers

Returns: Created estimate template with ID.

Related Tools: list_estimate_templates, update_estimate_template`,
        inputSchema: {
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Template name (REQUIRED)'),
          currency: z.string().describe('Currency code like USD, EUR (REQUIRED)'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details (REQUIRED)'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 150.00 = $150.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring" (REQUIRED)')
          })).describe('Line items array (REQUIRED)'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value (percentage or fixed amount in cents)')
          }).describe('Discount settings (REQUIRED)'),
          title: z.string().optional().describe('Estimate title'),
          termsNotes: z.string().optional().describe('Terms and conditions'),
          estimateNumberPrefix: z.string().optional().describe('Prefix for estimate numbers')
        }
      },
      {
        name: 'update_estimate_template',
        description: `Update an existing estimate template.

Modify template settings and configuration.

USAGE EXAMPLE:
{
  "templateId": "template123",
  "name": "Updated Quote Template",
  "currency": "USD",
  "businessDetails": {
    "name": "My Company Updated"
  },
  "items": [
    {
      "name": "Updated Service",
      "currency": "USD",
      "amount": 200.00,
      "qty": 1
    }
  ],
  "discount": {
    "type": "percentage",
    "value": 10
  }
}

NOTE: When updating, you must provide the complete template data including businessDetails, items, and discount.

Returns: Updated estimate template.

Related Tools: get_estimate_template, create_estimate_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to update'),
          altId: z.string().optional().describe('Location ID'),
          name: z.string().describe('Template name'),
          currency: z.string().describe('Currency code like USD, EUR'),
          businessDetails: z.object({
            name: z.string().optional().describe('Business name'),
            phoneNo: z.string().optional().describe('Business phone'),
            website: z.string().optional().describe('Business website'),
            logoUrl: z.string().optional().describe('Logo URL')
          }).describe('Business details'),
          items: z.array(z.object({
            name: z.string().describe('Item name'),
            description: z.string().optional().describe('Item description'),
            currency: z.string().describe('Currency code'),
            amount: z.number().describe('Amount as float with decimals (e.g., 99.00 = $99.00). NOT cents.'),
            qty: z.number().describe('Quantity'),
            type: z.enum(['one_time', 'recurring']).describe('Item type: "one_time" or "recurring"')
          })).describe('Line items array'),
          discount: z.object({
            type: z.enum(['percentage', 'fixed']).describe('Discount type'),
            value: z.number().optional().describe('Discount value')
          }).describe('Discount settings'),
          title: z.string().optional().describe('Estimate title'),
          termsNotes: z.string().optional().describe('Terms and conditions')
        }
      },
      {
        name: 'delete_estimate_template',
        description: `Delete an estimate template permanently.

⚠️ WARNING: This action cannot be undone!

Use Cases:
- Remove unused templates
- Clean up old templates

Returns: Confirmation of deletion.

Related Tools: list_estimate_templates`,
        inputSchema: {
          templateId: z.string().describe('Template ID to delete'),
          altId: z.string().optional().describe('Location ID')
        }
      },
      {
        name: 'preview_estimate_template',
        description: `Preview an estimate template.

View how template will appear to customers.

Use Cases:
- Review template before using
- Check formatting and layout
- Verify template content

Returns: Template preview/rendering.

Related Tools: create_estimate_template, update_estimate_template`,
        inputSchema: {
          templateId: z.string().describe('Template ID to preview'),
          altId: z.string().optional().describe('Location ID')
        }
      }
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      // Invoice Template Handlers
      case 'create_invoice_template':
        return this.client.createInvoiceTemplate(args as CreateInvoiceTemplateDto);

      case 'list_invoice_templates':
        return this.client.listInvoiceTemplates(args);

      case 'get_invoice_template':
        return this.client.getInvoiceTemplate(args.templateId, args);

      case 'update_invoice_template':
        const { templateId: updateTemplateId, ...updateTemplateData } = args;
        return this.client.updateInvoiceTemplate(updateTemplateId, updateTemplateData as UpdateInvoiceTemplateDto);

      case 'delete_invoice_template':
        return this.client.deleteInvoiceTemplate(args.templateId, args);

      case 'update_invoice_template_late_fees':
        const { templateId: lateFeesTemplateId, ...lateFeesData } = args;
        return this.client.updateInvoiceTemplateLateFeesConfiguration(lateFeesTemplateId, lateFeesData as UpdateInvoiceLateFeesConfigurationDto);

      case 'update_invoice_template_payment_methods':
        const { templateId: paymentMethodsTemplateId, ...paymentMethodsData } = args;
        return this.client.updateInvoiceTemplatePaymentMethodsConfiguration(paymentMethodsTemplateId, paymentMethodsData as UpdatePaymentMethodsConfigurationDto);

      // Invoice Schedule Handlers
      case 'create_invoice_schedule':
        return this.client.createInvoiceSchedule(args as CreateInvoiceScheduleDto);

      case 'list_invoice_schedules':
        return this.client.listInvoiceSchedules(args);

      case 'get_invoice_schedule':
        return this.client.getInvoiceSchedule(args.scheduleId, args);

      case 'update_invoice_schedule':
        const { scheduleId: updateScheduleId, ...updateScheduleData } = args;
        return this.client.updateInvoiceSchedule(updateScheduleId, updateScheduleData as UpdateInvoiceScheduleDto);

      case 'delete_invoice_schedule':
        return this.client.deleteInvoiceSchedule(args.scheduleId, args);

      case 'schedule_invoice_schedule':
        const { scheduleId: scheduleScheduleId, ...scheduleScheduleData } = args;
        return this.client.scheduleInvoiceSchedule(scheduleScheduleId, scheduleScheduleData as ScheduleInvoiceScheduleDto);

      case 'auto_payment_invoice_schedule':
        const { scheduleId: autoPaymentScheduleId, ...autoPaymentData } = args;
        return this.client.autoPaymentInvoiceSchedule(autoPaymentScheduleId, autoPaymentData as AutoPaymentScheduleDto);

      case 'cancel_invoice_schedule':
        const { scheduleId: cancelScheduleId, ...cancelScheduleData } = args;
        return this.client.cancelInvoiceSchedule(cancelScheduleId, cancelScheduleData as CancelInvoiceScheduleDto);

      // Invoice Management Handlers
      case 'create_invoice':
        return this.client.createInvoice(args as CreateInvoiceDto);

      case 'list_invoices':
        return this.client.listInvoices(args);

      case 'get_invoice':
        return this.client.getInvoice(args.invoiceId, args);

      case 'update_invoice':
        const { invoiceId: updateInvoiceId, ...updateInvoiceData } = args;
        return this.client.updateInvoice(updateInvoiceId, updateInvoiceData as UpdateInvoiceDto);

      case 'delete_invoice':
        return this.client.deleteInvoice(args.invoiceId, args);

      case 'void_invoice':
        const { invoiceId: voidInvoiceId, ...voidInvoiceData } = args;
        return this.client.voidInvoice(voidInvoiceId, voidInvoiceData as VoidInvoiceDto);

      case 'send_invoice':
        const { invoiceId: sendInvoiceId, ...sendInvoiceData } = args;
        return this.client.sendInvoice(sendInvoiceId, sendInvoiceData as SendInvoiceDto);

      case 'record_invoice_payment':
        const { invoiceId: recordPaymentInvoiceId, ...recordPaymentData } = args;
        return this.client.recordInvoicePayment(recordPaymentInvoiceId, recordPaymentData as RecordPaymentDto);

      case 'text2pay_invoice':
        return this.client.text2PayInvoice(args as Text2PayDto);

      // Estimate Handlers
      case 'create_estimate':
        return this.client.createEstimate(args as CreateEstimatesDto);

      case 'list_estimates':
        return this.client.listEstimates(args);

      case 'get_estimate':
        return this.client.getEstimate(args.estimateId, args.altId);

      case 'update_estimate':
        const { estimateId: updateEstimateId, ...updateEstimateData } = args;
        return this.client.updateEstimate(updateEstimateId, updateEstimateData as UpdateEstimateDto);

      case 'delete_estimate':
        const { estimateId: deleteEstimateId, ...deleteEstimateData } = args;
        return this.client.deleteEstimate(deleteEstimateId, deleteEstimateData as AltDto);

      case 'send_estimate':
        const { estimateId: sendEstimateId, ...sendEstimateData } = args;
        return this.client.sendEstimate(sendEstimateId, sendEstimateData as SendEstimateDto);

      case 'create_invoice_from_estimate':
        const { estimateId: invoiceFromEstimateId, ...invoiceFromEstimateData } = args;
        return this.client.createInvoiceFromEstimate(invoiceFromEstimateId, invoiceFromEstimateData as CreateInvoiceFromEstimateDto);

      // Utility Handlers
      case 'generate_invoice_number':
        return this.client.generateInvoiceNumber(args);

      case 'generate_estimate_number':
        return this.client.generateEstimateNumber(args);

      // Estimate Template Handlers
      case 'list_estimate_templates':
        return this.client.listEstimateTemplates(args);

      case 'get_estimate_template':
        return this.client.getEstimateTemplate(args.templateId, args.altId);

      case 'create_estimate_template':
        return this.client.createEstimateTemplate(args as EstimateTemplatesDto);

      case 'update_estimate_template':
        const { templateId: updateEstTemplateId, ...updateEstTemplateData } = args;
        return this.client.updateEstimateTemplate(updateEstTemplateId, updateEstTemplateData as EstimateTemplatesDto);

      case 'delete_estimate_template':
        const { templateId: deleteEstTemplateId, ...deleteEstTemplateData } = args;
        return this.client.deleteEstimateTemplate(deleteEstTemplateId, deleteEstTemplateData as AltDto);

      case 'preview_estimate_template':
        return this.client.previewEstimateTemplate({ templateId: args.templateId, altId: args.altId });

      default:
        throw new Error(`Unknown invoices tool: ${name}`);
    }
  }
} 