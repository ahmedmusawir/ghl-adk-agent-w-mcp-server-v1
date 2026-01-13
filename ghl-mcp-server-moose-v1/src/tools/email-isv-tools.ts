/**
 * GoHighLevel Email Verification Tools
 * Implements email verification functionality for the MCP server
 * 
 * IMPORTANT: Follows lessons learned from calendar-tools fix:
 * - Always use this.ghlClient.getConfig().locationId as fallback (never empty string)
 * - Return response.data (unwrapped) not response
 * - Comprehensive error handling for all HTTP codes
 */

import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';

/**
 * Email ISV Tools class
 * Provides email verification capabilities
 */
export class EmailISVTools {
  constructor(private ghlClient: GHLApiClient) {}

  /**
   * Get tool definitions for all email verification operations
   */
  getToolDefinitions(): any[] {
    return [
      {
        name: 'verify_email',
        description: `Verify email address deliverability and get risk assessment.

⚠️ IMPORTANT: This operation has a cost - charges will be deducted from the location wallet.

Email verification checks deliverability, identifies risky addresses, and provides recommendations to improve email campaign success rates.

Use Cases:
- Verify email addresses before sending campaigns
- Clean email lists to improve deliverability
- Assess risk of bounces or spam complaints
- Validate contact email addresses

Required Parameters:
- locationId: Location ID (charges deducted from this wallet)
- type: Verification type ('email' or 'contact')
- verify: Email address or contact ID to verify

Verification Types:
- email: Direct email address verification (provide email address)
- contact: Verify email from contact record (provide contact ID)

Returns: Verification result with:
- result: Verification outcome (deliverable, undeliverable, risky, unknown)
- risk: Risk level (high, medium, low)
- reason: Specific reasons for the result
- recommendation: Whether to send emails to this address
- details: Technical verification details

Risk Levels:
- high: Do not send (invalid, disposable, spam trap)
- medium: Send with caution (catch-all, role-based)
- low: Safe to send (verified deliverable)

💰 Pricing:
- Charges apply per verification
- Check location wallet balance before bulk verification
- Failed verifications may still incur charges

Best Practices:
- Verify before sending to new contacts
- Re-verify bounced addresses
- Don't verify same address repeatedly
- Monitor wallet balance for bulk operations
- Use verification results to segment lists

Related Tools: Contact management tools for updating verified contacts`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided). Note: charges will be deducted from this location wallet'),
          type: z.enum(['email', 'contact']).describe('Verification type: "email" for direct email verification, "contact" for contact ID verification'),
          verify: z.string().describe('Email address to verify (if type=email) or contact ID (if type=contact)')
        }
      }
    ];
  }

  /**
   * Execute email verification tools
   */
  async executeTool(name: string, args: any): Promise<any> {
    switch (name) {
      case 'verify_email':
        return await this.verifyEmail(args);

      default:
        throw new Error(`Unknown email verification tool: ${name}`);
    }
  }

  /**
   * Verify email address or contact
   */
  private async verifyEmail(params: any): Promise<any> {
    try {
      const locationId = params.locationId || this.ghlClient.getConfig().locationId;
      const result = await this.ghlClient.verifyEmail(locationId, {
        type: params.type,
        verify: params.verify
      });

      if (!result.success || !result.data) {
        return {
          success: false,
          verification: { verified: false, message: 'Verification failed', address: params.verify } as any,
          message: result.error?.message || 'Email verification failed'
        };
      }

      const verification = result.data;
      
      // Determine if this is a successful verification response
      const isVerified = 'result' in verification;
      let message: string;

      if (isVerified) {
        const verifiedResult = verification as any;
        message = `Email verification completed. Result: ${verifiedResult.result}, Risk: ${verifiedResult.risk}`;
        
        if (verifiedResult.reason && verifiedResult.reason.length > 0) {
          message += `, Reasons: ${verifiedResult.reason.join(', ')}`;
        }
        
        if (verifiedResult.leadconnectorRecomendation?.isEmailValid !== undefined) {
          message += `, Recommended: ${verifiedResult.leadconnectorRecomendation.isEmailValid ? 'Valid' : 'Invalid'}`;
        }
      } else {
        const notVerifiedResult = verification as any;
        message = `Email verification not processed: ${notVerifiedResult.message}`;
      }

      return {
        success: true,
        verification,
        message
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        verification: { verified: false, message: errorMessage, address: params.verify } as any,
        message: `Failed to verify email: ${errorMessage}`
      };
    }
  }
} 