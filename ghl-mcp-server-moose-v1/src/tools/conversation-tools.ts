/**
 * GoHighLevel Conversation Tools
 * Implements all conversation and messaging functionality for the MCP server
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  MCPSendSMSParams,
  MCPSendEmailParams,
  MCPSearchConversationsParams,
  MCPGetConversationParams,
  MCPCreateConversationParams,
  MCPUpdateConversationParams,
  MCPDeleteConversationParams,
  MCPGetEmailMessageParams,
  MCPGetMessageParams,
  MCPUploadMessageAttachmentsParams,
  MCPUpdateMessageStatusParams,
  MCPAddInboundMessageParams,
  MCPAddOutboundCallParams,
  MCPGetMessageRecordingParams,
  MCPGetMessageTranscriptionParams,
  MCPDownloadTranscriptionParams,
  MCPCancelScheduledMessageParams,
  MCPCancelScheduledEmailParams,
  MCPLiveChatTypingParams,
  GHLConversation,
  GHLMessage,
  GHLEmailMessage,
  GHLSendMessageResponse,
  GHLSearchConversationsResponse,
  GHLGetMessagesResponse,
  GHLProcessMessageResponse,
  GHLCancelScheduledResponse,
  GHLMessageRecordingResponse,
  GHLMessageTranscriptionResponse,
  GHLLiveChatTypingResponse,
  GHLUploadFilesResponse
} from '../types/ghl-types.js';

/**
 * Conversation Tools Class
 * Implements MCP tools for messaging and conversation management
 */
export class ConversationTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all conversation operations
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'send_sms',
        description: 'Send an SMS message to a contact in GoHighLevel',
        inputSchema: {
          contactId: z.string().describe('The unique ID of the contact to send SMS to'),
          message: z.string().max(1600).describe('The SMS message content to send'),
          fromNumber: z.string().optional().describe('Optional: Phone number to send from (must be configured in GHL)')
        }
      },
      {
        name: 'send_email',
        description: `Send an email message to a contact in GoHighLevel.
        
IMPORTANT: Use the 'html' parameter for all email content (works for both plain text and HTML).
The GHL API requires the 'html' parameter for email bodies - the 'message' parameter is not reliably processed.

Examples:
- Plain text: { html: "Hello, this is a plain text email" }
- HTML: { html: "<p>Hello, this is <strong>HTML</strong> email</p>" }

Parameters:
- contactId: The GHL contact ID to send email to
- subject: Email subject line
- html: Email body content (plain text or HTML) - REQUIRED`,
        inputSchema: {
          contactId: z.string().describe('The unique ID of the contact to send email to'),
          subject: z.string().describe('Email subject line'),
          html: z.string().describe('Email body (can be plain text or HTML - this parameter is required by GHL API)'),
          message: z.string().optional().describe('Plain text fallback (optional, not reliably processed by GHL API)'),
          emailFrom: z.string().email().optional().describe('Optional: Email address to send from (must be configured in GHL)'),
          attachments: z.array(z.string()).optional().describe('Optional: Array of attachment URLs'),
          emailCc: z.array(z.string()).optional().describe('Optional: Array of CC email addresses'),
          emailBcc: z.array(z.string()).optional().describe('Optional: Array of BCC email addresses')
        }
      },
      {
        name: 'search_conversations',
        description: 'Search conversations in GoHighLevel with various filters',
        inputSchema: {
          contactId: z.string().optional().describe('Filter conversations for a specific contact'),
          query: z.string().optional().describe('Search query to filter conversations'),
          status: z.enum(['all', 'read', 'unread', 'starred', 'recents']).optional().describe('Filter conversations by read status (default: all)'),
          limit: z.number().min(1).max(100).optional().describe('Maximum number of conversations to return (default: 20, max: 100)'),
          assignedTo: z.string().optional().describe('Filter by user ID assigned to conversations')
        }
      },
      {
        name: 'get_conversation',
        description: 'Get detailed conversation information including message history',
        inputSchema: {
          conversationId: z.string().describe('The unique ID of the conversation to retrieve'),
          limit: z.number().min(1).max(100).optional().describe('Maximum number of messages to return (default: 20)'),
          messageTypes: z.array(z.enum(['TYPE_SMS', 'TYPE_EMAIL', 'TYPE_CALL', 'TYPE_FACEBOOK', 'TYPE_INSTAGRAM', 'TYPE_WHATSAPP', 'TYPE_LIVE_CHAT'])).optional().describe('Filter messages by type (optional)')
        }
      },
      {
        name: 'create_conversation',
        description: 'Create a new conversation with a contact',
        inputSchema: {
          contactId: z.string().describe('The unique ID of the contact to create conversation with')
        }
      },
      {
        name: 'update_conversation',
        description: 'Update conversation properties (star, mark read, etc.)',
        inputSchema: {
          conversationId: z.string().describe('The unique ID of the conversation to update'),
          starred: z.boolean().optional().describe('Star or unstar the conversation'),
          unreadCount: z.number().min(0).optional().describe('Set the unread message count (0 to mark as read)')
        }
      },
      {
        name: 'get_recent_messages',
        description: 'Get recent messages across all conversations for monitoring',
        inputSchema: {
          limit: z.number().min(1).max(50).optional().describe('Maximum number of conversations to check (default: 10)'),
          status: z.enum(['all', 'unread']).optional().describe('Filter by conversation status (default: unread)')
        }
      },
      {
        name: 'delete_conversation',
        description: 'Delete a conversation permanently',
        inputSchema: {
          conversationId: z.string().describe('The unique ID of the conversation to delete')
        }
      },
      
      // MESSAGE MANAGEMENT TOOLS
      {
        name: 'get_email_message',
        description: 'Get detailed email message information by email message ID',
        inputSchema: {
          emailMessageId: z.string().describe('The unique ID of the email message to retrieve')
        }
      },
      {
        name: 'get_message',
        description: 'Get detailed message information by message ID',
        inputSchema: {
          messageId: z.string().describe('The unique ID of the message to retrieve')
        }
      },
      {
        name: 'upload_message_attachments',
        description: 'Upload file attachments for use in messages',
        inputSchema: {
          conversationId: z.string().describe('The conversation ID to upload attachments for'),
          attachmentUrls: z.array(z.string()).describe('Array of file URLs to upload as attachments')
        }
      },
      {
        name: 'update_message_status',
        description: `Update the status of a message in GoHighLevel.

IMPORTANT REQUIREMENTS & LIMITATIONS:

Configuration Requirements:
- Requires an active conversation provider (SMS service like Twilio, Bandwidth)
- Provider must be properly configured in GHL account
- API key needs write permissions for messages

Message Type Limitations:
- Email messages: Status is typically read-only (cannot be updated)
- SMS messages: Requires active SMS provider configuration
- Call logs: May work if provider is configured

Common Errors:
- "No conversation provider found" (403): SMS provider not configured
- "No message found" (401): Message type doesn't support status updates (usually emails)

Best Practice: Use get_message first to verify the message exists and check its type before attempting status updates.`,
        inputSchema: {
          messageId: z.string().describe('The unique ID of the message to update'),
          status: z.enum(['delivered', 'failed', 'pending', 'read']).describe('New status for the message'),
          error: z.object({
            code: z.string().optional(),
            type: z.string().optional(),
            message: z.string().optional()
          }).optional().describe('Error details if status is failed'),
          emailMessageId: z.string().optional().describe('Email message ID if updating email status'),
          recipients: z.array(z.string()).optional().describe('Email delivery status for additional recipients')
        }
      },
      
      // MANUAL MESSAGE CREATION TOOLS
      {
        name: 'add_inbound_message',
        description: 'Manually add an inbound message to a conversation',
        inputSchema: {
          type: z.enum(['SMS', 'Email', 'WhatsApp', 'GMB', 'IG', 'FB', 'Custom', 'WebChat', 'Live_Chat', 'Call']).describe('Type of inbound message to add'),
          conversationId: z.string().describe('The conversation to add the message to'),
          conversationProviderId: z.string().describe('Conversation provider ID for the message'),
          message: z.string().optional().describe('Message content (for text-based messages)'),
          attachments: z.array(z.string()).optional().describe('Array of attachment URLs'),
          html: z.string().optional().describe('HTML content for email messages'),
          subject: z.string().optional().describe('Subject line for email messages'),
          emailFrom: z.string().optional().describe('From email address'),
          emailTo: z.string().optional().describe('To email address'),
          emailCc: z.array(z.string()).optional().describe('CC email addresses'),
          emailBcc: z.array(z.string()).optional().describe('BCC email addresses'),
          emailMessageId: z.string().optional().describe('Email message ID for threading'),
          altId: z.string().optional().describe('External provider message ID'),
          date: z.string().optional().describe('Date of the message (ISO format)'),
          call: z.object({
            to: z.string().optional().describe('Called number'),
            from: z.string().optional().describe('Caller number'),
            status: z.enum(['pending', 'completed', 'answered', 'busy', 'no-answer', 'failed', 'canceled', 'voicemail']).optional().describe('Call status')
          }).optional().describe('Call details for call-type messages')
        }
      },
      {
        name: 'add_outbound_call',
        description: 'Manually add an outbound call record to a conversation',
        inputSchema: {
          conversationId: z.string().describe('The conversation to add the call to'),
          conversationProviderId: z.string().describe('Conversation provider ID for the call'),
          to: z.string().describe('Called phone number'),
          from: z.string().describe('Caller phone number'),
          status: z.enum(['pending', 'completed', 'answered', 'busy', 'no-answer', 'failed', 'canceled', 'voicemail']).describe('Call completion status'),
          attachments: z.array(z.string()).optional().describe('Array of attachment URLs'),
          altId: z.string().optional().describe('External provider call ID'),
          date: z.string().optional().describe('Date of the call (ISO format)')
        }
      },
      
      // CALL RECORDING & TRANSCRIPTION TOOLS
      {
        name: 'get_message_recording',
        description: 'Get call recording audio for a message',
        inputSchema: {
          messageId: z.string().describe('The unique ID of the call message to get recording for')
        }
      },
      {
        name: 'get_message_transcription',
        description: 'Get call transcription text for a message',
        inputSchema: {
          messageId: z.string().describe('The unique ID of the call message to get transcription for')
        }
      },
      {
        name: 'download_transcription',
        description: 'Download call transcription as a text file',
        inputSchema: {
          messageId: z.string().describe('The unique ID of the call message to download transcription for')
        }
      },
      
      // SCHEDULING MANAGEMENT TOOLS
      {
        name: 'cancel_scheduled_message',
        description: 'Cancel a scheduled message before it is sent',
        inputSchema: {
          messageId: z.string().describe('The unique ID of the scheduled message to cancel')
        }
      },
      {
        name: 'cancel_scheduled_email',
        description: 'Cancel a scheduled email before it is sent',
        inputSchema: {
          emailMessageId: z.string().describe('The unique ID of the scheduled email to cancel')
        }
      },
      
      // LIVE CHAT TOOLS
      {
        name: 'live_chat_typing',
        description: 'Send typing indicator for live chat conversations',
        inputSchema: {
          visitorId: z.string().describe('Unique visitor ID for the live chat session'),
          conversationId: z.string().describe('The conversation ID for the live chat'),
          isTyping: z.boolean().describe('Whether the agent is currently typing')
        }
      }
    ];
  }

  /**
   * Execute conversation tool based on tool name and arguments
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'send_sms':
        return this.sendSMS(args as MCPSendSMSParams);
      
      case 'send_email':
        return this.sendEmail(args as MCPSendEmailParams);
      
      case 'search_conversations':
        return this.searchConversations(args as MCPSearchConversationsParams);
      
      case 'get_conversation':
        return this.getConversation(args as MCPGetConversationParams);
      
      case 'create_conversation':
        return this.createConversation(args as MCPCreateConversationParams);
      
      case 'update_conversation':
        return this.updateConversation(args as MCPUpdateConversationParams);
      
      case 'get_recent_messages':
        return this.getRecentMessages(args);
      
      case 'delete_conversation':
        return this.deleteConversation(args as MCPDeleteConversationParams);
      
      case 'get_email_message':
        return this.getEmailMessage(args as MCPGetEmailMessageParams);
      
      case 'get_message':
        return this.getMessage(args as MCPGetMessageParams);
      
      case 'upload_message_attachments':
        return this.uploadMessageAttachments(args as MCPUploadMessageAttachmentsParams);
      
      case 'update_message_status':
        return this.updateMessageStatus(args as MCPUpdateMessageStatusParams);
      
      case 'add_inbound_message':
        return this.addInboundMessage(args as MCPAddInboundMessageParams);
      
      case 'add_outbound_call':
        return this.addOutboundCall(args as MCPAddOutboundCallParams);
      
      case 'get_message_recording':
        return this.getMessageRecording(args as MCPGetMessageRecordingParams);
      
      case 'get_message_transcription':
        return this.getMessageTranscription(args as MCPGetMessageTranscriptionParams);
      
      case 'download_transcription':
        return this.downloadTranscription(args as MCPDownloadTranscriptionParams);
      
      case 'cancel_scheduled_message':
        return this.cancelScheduledMessage(args as MCPCancelScheduledMessageParams);
      
      case 'cancel_scheduled_email':
        return this.cancelScheduledEmail(args as MCPCancelScheduledEmailParams);
      
      case 'live_chat_typing':
        return this.liveChatTyping(args as MCPLiveChatTypingParams);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  /**
   * SEND SMS
   */
  private async sendSMS(params: MCPSendSMSParams): Promise<{ success: boolean; messageId: string; conversationId: string; message: string }> {
    try {
      const response = await this.ghlClient.sendSMS(
        params.contactId,
        params.message,
        params.fromNumber
      );

      const result = response.data as GHLSendMessageResponse;
      
      return {
        success: true,
        messageId: result.messageId,
        conversationId: result.conversationId,
        message: `SMS sent successfully to contact ${params.contactId}`
      };
    } catch (error) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
  }

  /**
   * SEND EMAIL
   */
  private async sendEmail(params: MCPSendEmailParams): Promise<{ success: boolean; messageId: string; conversationId: string; emailMessageId?: string; message: string }> {
    try {
      const response = await this.ghlClient.sendEmail(
        params.contactId,
        params.subject,
        params.message,
        params.html,
        {
          emailFrom: params.emailFrom,
          emailCc: params.emailCc,
          emailBcc: params.emailBcc,
          attachments: params.attachments
        }
      );

      const result = response.data as GHLSendMessageResponse;
      
      return {
        success: true,
        messageId: result.messageId,
        conversationId: result.conversationId,
        emailMessageId: result.emailMessageId,
        message: `Email sent successfully to contact ${params.contactId}`
      };
    } catch (error) {
      throw new Error(`Failed to send email: ${error}`);
    }
  }

  /**
   * SEARCH CONVERSATIONS
   */
  private async searchConversations(params: MCPSearchConversationsParams): Promise<{ success: boolean; conversations: GHLConversation[]; total: number; message: string }> {
    try {
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        contactId: params.contactId,
        query: params.query,
        status: params.status || 'all',
        limit: params.limit || 20,
        assignedTo: params.assignedTo
      };

      const response = await this.ghlClient.searchConversations(searchParams);
      const data = response.data as GHLSearchConversationsResponse;
      
      return {
        success: true,
        conversations: data.conversations,
        total: data.total,
        message: `Found ${data.conversations.length} conversations (${data.total} total)`
      };
    } catch (error) {
      throw new Error(`Failed to search conversations: ${error}`);
    }
  }

  /**
   * GET CONVERSATION
   */
  private async getConversation(params: MCPGetConversationParams): Promise<{ success: boolean; conversation: GHLConversation; messages: GHLMessage[]; hasMoreMessages: boolean; message: string }> {
    try {
      // Get conversation details
      const conversationResponse = await this.ghlClient.getConversation(params.conversationId);
      const conversation = conversationResponse.data as GHLConversation;

      // Get messages
      const messagesResponse = await this.ghlClient.getConversationMessages(
        params.conversationId,
        {
          limit: params.limit || 20,
          type: params.messageTypes?.join(',')
        }
      );
      const messagesData = messagesResponse.data as GHLGetMessagesResponse;
      
      return {
        success: true,
        conversation,
        messages: messagesData.messages,
        hasMoreMessages: messagesData.nextPage,
        message: `Retrieved conversation with ${messagesData.messages.length} messages`
      };
    } catch (error) {
      throw new Error(`Failed to get conversation: ${error}`);
    }
  }

  /**
   * CREATE CONVERSATION
   */
  private async createConversation(params: MCPCreateConversationParams): Promise<{ success: boolean; conversationId: string; message: string }> {
    try {
      const response = await this.ghlClient.createConversation({
        locationId: this.ghlClient.getConfig().locationId,
        contactId: params.contactId
      });

      const result = response.data;
      
      return {
        success: true,
        conversationId: result!.id,
        message: `Conversation created successfully with contact ${params.contactId}`
      };
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error}`);
    }
  }

  /**
   * UPDATE CONVERSATION
   */
  private async updateConversation(params: MCPUpdateConversationParams): Promise<{ success: boolean; conversation: GHLConversation; message: string }> {
    try {
      const updateData = {
        locationId: this.ghlClient.getConfig().locationId,
        starred: params.starred,
        unreadCount: params.unreadCount
      };

      const response = await this.ghlClient.updateConversation(params.conversationId, updateData);
      
      return {
        success: true,
        conversation: response.data!,
        message: `Conversation updated successfully`
      };
    } catch (error) {
      throw new Error(`Failed to update conversation: ${error}`);
    }
  }

  /**
   * GET RECENT MESSAGES
   */
  private async getRecentMessages(params: { limit?: number; status?: string }): Promise<{ success: boolean; conversations: any[]; message: string }> {
    try {
      const status: 'all' | 'read' | 'unread' | 'starred' | 'recents' = 
        (params.status === 'all' || params.status === 'unread') ? params.status : 'unread';
      const searchParams = {
        locationId: this.ghlClient.getConfig().locationId,
        limit: params.limit || 10,
        status,
        sortBy: 'last_message_date' as const,
        sort: 'desc' as const
      };

      const response = await this.ghlClient.searchConversations(searchParams);
      const data = response.data as GHLSearchConversationsResponse;

      // Enhance with recent message details
      const enhancedConversations = data.conversations.map(conv => ({
        conversationId: conv.id,
        contactName: conv.fullName || conv.contactName,
        contactEmail: conv.email,
        contactPhone: conv.phone,
        lastMessageBody: conv.lastMessageBody,
        lastMessageType: conv.lastMessageType,
        unreadCount: conv.unreadCount,
        starred: conv.starred
      }));
      
      return {
        success: true,
        conversations: enhancedConversations,
        message: `Retrieved ${enhancedConversations.length} recent conversations`
      };
    } catch (error) {
      throw new Error(`Failed to get recent messages: ${error}`);
    }
  }

  private async deleteConversation(params: MCPDeleteConversationParams): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.ghlClient.deleteConversation(params.conversationId);
      
      return {
        success: true,
        message: `Conversation deleted successfully`
      };
    } catch (error) {
      throw new Error(`Failed to delete conversation: ${error}`);
    }
  }

  private async getEmailMessage(params: MCPGetEmailMessageParams): Promise<{ success: boolean; emailMessage: GHLEmailMessage; message: string }> {
    try {
      const response = await this.ghlClient.getEmailMessage(params.emailMessageId);
      const emailMessage = response.data as GHLEmailMessage;
      
      return {
        success: true,
        emailMessage,
        message: `Retrieved email message with ID ${params.emailMessageId}`
      };
    } catch (error) {
      throw new Error(`Failed to get email message: ${error}`);
    }
  }

  private async getMessage(params: MCPGetMessageParams): Promise<{ success: boolean; messageData: GHLMessage; message: string }> {
    try {
      const response = await this.ghlClient.getMessage(params.messageId);
      const messageData = response.data as GHLMessage;
      
      return {
        success: true,
        messageData,
        message: `Retrieved message with ID ${params.messageId}`
      };
    } catch (error) {
      throw new Error(`Failed to get message: ${error}`);
    }
  }

  private async uploadMessageAttachments(params: MCPUploadMessageAttachmentsParams): Promise<{ success: boolean; uploadedFiles: any; message: string }> {
    try {
      const uploadData = {
        conversationId: params.conversationId,
        locationId: this.ghlClient.getConfig().locationId,
        attachmentUrls: params.attachmentUrls
      };

      const response = await this.ghlClient.uploadMessageAttachments(uploadData);
      const result = response.data as GHLUploadFilesResponse;
      
      return {
        success: true,
        uploadedFiles: result.uploadedFiles,
        message: `Attachments uploaded successfully to conversation ${params.conversationId}`
      };
    } catch (error) {
      throw new Error(`Failed to upload message attachments: ${error}`);
    }
  }

  private async updateMessageStatus(params: MCPUpdateMessageStatusParams): Promise<{ success: boolean; message: string }> {
    try {
      const statusData = {
        status: params.status as 'delivered' | 'failed' | 'pending' | 'read',
        error: params.error,
        emailMessageId: params.emailMessageId,
        recipients: params.recipients
      };

      const response = await this.ghlClient.updateMessageStatus(params.messageId, statusData);
      
      return {
        success: true,
        message: `Message status updated to ${params.status} successfully`
      };
    } catch (error: any) {
      const messageId = params.messageId || 'unknown';
      
      // Handle "No conversation provider" error (403)
      if (
        error.message?.includes('(403)') &&
        error.message?.includes('No conversation provider found')
      ) {
        throw new Error(`Cannot update message status: No conversation provider configured.

This message exists but requires an active SMS/messaging provider to update its status.

Possible reasons:
1. No SMS provider (Twilio, Bandwidth, etc.) is configured in GHL
2. The provider that sent this message is no longer active
3. Account doesn't have messaging provider permissions

To fix this:
- Go to GHL Settings > Phone Numbers or Integrations
- Configure an SMS provider (Twilio, Bandwidth, etc.)
- Ensure the provider is active and properly connected

Message ID: ${messageId}
Attempted status: ${params.status}

Note: You can retrieve this message using get_message, but status updates require an active messaging provider.

Original error: ${error.message}`);
      }
      
      // Handle "No message found" error for emails (401)
      if (
        error.message?.includes('(401)') &&
        error.message?.includes('No message found')
      ) {
        throw new Error(`Cannot update message status: Message exists but status updates are not supported.

This typically happens with email messages, which have read-only status via the GHL API.

Possible reasons:
1. Email message status cannot be modified via API
2. This message type doesn't support status updates
3. Status updates only work for SMS/call messages with active providers

Message ID: ${messageId}
Attempted status: ${params.status}

Note: You can retrieve this message using get_email_message or get_message, but status modification is restricted.

Original error: ${error.message}`);
      }
      
      // Handle general 403 (permission denied)
      if (error.message?.includes('(403)')) {
        throw new Error(`Permission denied: Cannot update message status.

Your API key or account may lack permission to modify message status.

Please check:
- API key has write permissions for messages
- Account has messaging/conversation permissions
- Provider configuration is active

Message ID: ${messageId}

Original error: ${error.message}`);
      }
      
      // Handle 401 (unauthorized)
      if (error.message?.includes('(401)')) {
        throw new Error(`Authentication error: Unable to update message status.

Please verify:
- API key is valid and not expired
- API key has correct permissions
- Message ID is correct: ${messageId}

Original error: ${error.message}`);
      }
      
      // Handle 404 (message truly doesn't exist)
      if (error.message?.includes('(404)')) {
        throw new Error(`Message not found: ${messageId}

The message may have been deleted or the ID is incorrect.

Original error: ${error.message}`);
      }
      
      // Generic fallback
      throw new Error(`Failed to update message status for message ${messageId}: ${error.message || error}

Attempted status: ${params.status}`);
    }
  }

  private async addInboundMessage(params: MCPAddInboundMessageParams): Promise<{ success: boolean; messageId: string; conversationId: string; message: string }> {
    try {
      const messageData = {
        type: params.type as 'SMS' | 'Email' | 'WhatsApp' | 'GMB' | 'IG' | 'FB' | 'Custom' | 'WebChat' | 'Live_Chat' | 'Call',
        conversationId: params.conversationId,
        conversationProviderId: params.conversationProviderId,
        message: params.message,
        attachments: params.attachments,
        html: params.html,
        subject: params.subject,
        emailFrom: params.emailFrom,
        emailTo: params.emailTo,
        emailCc: params.emailCc,
        emailBcc: params.emailBcc,
        emailMessageId: params.emailMessageId,
        altId: params.altId,
        date: params.date,
        call: params.call
      };

      const response = await this.ghlClient.addInboundMessage(messageData);
      const result = response.data as GHLProcessMessageResponse;
      
      return {
        success: true,
        messageId: result.messageId,
        conversationId: result.conversationId,
        message: `Inbound message added successfully to conversation ${params.conversationId}`
      };
    } catch (error: any) {
      // Check if it's a 500 error related to call configuration (when type is 'Call')
      if (params.type === 'Call' && (error.message?.includes('(500)') || error.message?.includes('Internal server error'))) {
        throw new Error(`Call functionality is not configured for this GHL account.

Possible reasons:
1. No phone number is set up in GHL
2. Call provider not configured
3. Account doesn't have calling permissions

To fix this:
- Go to GHL Settings > Phone Numbers
- Set up a phone number or calling provider
- Ensure your account has calling capabilities enabled

Original error: ${error.message || 'Internal server error'}`);
      }
      
      throw new Error(`Failed to add inbound message: ${error}`);
    }
  }

  private async addOutboundCall(params: MCPAddOutboundCallParams): Promise<{ success: boolean; messageId: string; conversationId: string; message: string }> {
    try {
      const callData = {
        type: 'Call' as const,
        conversationId: params.conversationId,
        conversationProviderId: params.conversationProviderId,
        attachments: params.attachments,
        altId: params.altId,
        date: params.date,
        call: {
          to: params.to,
          from: params.from,
          status: params.status as 'pending' | 'completed' | 'answered' | 'busy' | 'no-answer' | 'failed' | 'canceled' | 'voicemail'
        }
      };

      const response = await this.ghlClient.addOutboundCall(callData);
      const result = response.data as GHLProcessMessageResponse;
      
      return {
        success: true,
        messageId: result.messageId,
        conversationId: result.conversationId,
        message: `Outbound call added successfully to conversation ${params.conversationId}`
      };
    } catch (error: any) {
      // Check if it's a 500 error related to call configuration
      if (error.message?.includes('(500)') || error.message?.includes('Internal server error')) {
        throw new Error(`Call functionality is not configured for this GHL account.

Possible reasons:
1. No phone number is set up in GHL
2. Call provider not configured
3. Account doesn't have calling permissions

To fix this:
- Go to GHL Settings > Phone Numbers
- Set up a phone number or calling provider
- Ensure your account has calling capabilities enabled

Original error: ${error.message || 'Internal server error'}`);
      }
      
      throw new Error(`Failed to add outbound call: ${error}`);
    }
  }

  private async getMessageRecording(params: MCPGetMessageRecordingParams): Promise<{ success: boolean; recording: any; contentType: string; message: string }> {
    try {
      const response = await this.ghlClient.getMessageRecording(params.messageId);
      const recording = response.data as GHLMessageRecordingResponse;
      
      return {
        success: true,
        recording: recording.audioData,
        contentType: recording.contentType,
        message: `Retrieved call recording for message ${params.messageId}`
      };
    } catch (error: any) {
      // Check if it's a 500 error related to call configuration
      if (error.message?.includes('(500)') || error.message?.includes('Internal server error')) {
        throw new Error(`Call functionality is not configured for this GHL account.

Possible reasons:
1. No phone number is set up in GHL
2. Call provider not configured
3. Account doesn't have calling permissions
4. The message ID provided is not a call message

To fix this:
- Go to GHL Settings > Phone Numbers
- Set up a phone number or calling provider
- Ensure your account has calling capabilities enabled
- Verify the message ID is for a call (not SMS/Email)

Original error: ${error.message || 'Internal server error'}`);
      }
      
      throw new Error(`Failed to get message recording: ${error}`);
    }
  }

  private async getMessageTranscription(params: MCPGetMessageTranscriptionParams): Promise<{ success: boolean; transcriptions: any[]; message: string }> {
    try {
      const response = await this.ghlClient.getMessageTranscription(params.messageId);
      const transcriptionData = response.data as GHLMessageTranscriptionResponse;
      
      return {
        success: true,
        transcriptions: transcriptionData.transcriptions,
        message: `Retrieved call transcription for message ${params.messageId}`
      };
    } catch (error: any) {
      // Check if it's a 500 error related to call configuration
      if (error.message?.includes('(500)') || error.message?.includes('Internal server error')) {
        throw new Error(`Call functionality is not configured for this GHL account.

Possible reasons:
1. No phone number is set up in GHL
2. Call provider not configured
3. Account doesn't have calling permissions
4. The message ID provided is not a call message
5. Call transcription not enabled for this account

To fix this:
- Go to GHL Settings > Phone Numbers
- Set up a phone number or calling provider
- Ensure your account has calling capabilities enabled
- Enable call transcription in your GHL account settings
- Verify the message ID is for a call (not SMS/Email)

Original error: ${error.message || 'Internal server error'}`);
      }
      
      throw new Error(`Failed to get message transcription: ${error}`);
    }
  }

  private async downloadTranscription(params: MCPDownloadTranscriptionParams): Promise<{ success: boolean; transcription: string; message: string }> {
    try {
      const response = await this.ghlClient.downloadMessageTranscription(params.messageId);
      const transcription = response.data as string;
      
      return {
        success: true,
        transcription,
        message: `Downloaded call transcription for message ${params.messageId}`
      };
    } catch (error) {
      throw new Error(`Failed to download transcription: ${error}`);
    }
  }

  private async cancelScheduledMessage(params: MCPCancelScheduledMessageParams): Promise<{ success: boolean; status: number; message: string }> {
    try {
      const response = await this.ghlClient.cancelScheduledMessage(params.messageId);
      const result = response.data as GHLCancelScheduledResponse;
      
      return {
        success: true,
        status: result.status,
        message: result.message || `Scheduled message cancelled successfully`
      };
    } catch (error) {
      throw new Error(`Failed to cancel scheduled message: ${error}`);
    }
  }

  private async cancelScheduledEmail(params: MCPCancelScheduledEmailParams): Promise<{ success: boolean; status: number; message: string }> {
    try {
      const response = await this.ghlClient.cancelScheduledEmail(params.emailMessageId);
      const result = response.data as GHLCancelScheduledResponse;
      
      return {
        success: true,
        status: result.status,
        message: result.message || `Scheduled email cancelled successfully`
      };
    } catch (error) {
      throw new Error(`Failed to cancel scheduled email: ${error}`);
    }
  }

  private async liveChatTyping(params: MCPLiveChatTypingParams): Promise<{ success: boolean; message: string }> {
    try {
      const typingData = {
        locationId: this.ghlClient.getConfig().locationId,
        isTyping: params.isTyping,
        visitorId: params.visitorId,
        conversationId: params.conversationId
      };

      const response = await this.ghlClient.liveChatTyping(typingData);
      const result = response.data as GHLLiveChatTypingResponse;
      
      return {
        success: result.success,
        message: `Live chat typing indicator ${params.isTyping ? 'enabled' : 'disabled'} successfully`
      };
    } catch (error) {
      throw new Error(`Failed to send live chat typing indicator: ${error}`);
    }
  }
} 