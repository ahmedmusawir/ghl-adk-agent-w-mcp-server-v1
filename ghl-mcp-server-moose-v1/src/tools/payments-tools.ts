import { z } from "zod";
import { GHLApiClient } from '../clients/ghl-api-client.js';
import {
  CreateWhiteLabelIntegrationProviderDto,
  ListIntegrationProvidersResponse,
  IntegrationProvider,
  ListOrdersResponse,
  Order,
  CreateFulfillmentDto,
  CreateFulfillmentResponse,
  ListFulfillmentResponse,
  ListTransactionsResponse,
  Transaction,
  ListSubscriptionsResponse,
  Subscription,
  ListCouponsResponse,
  CreateCouponParams,
  UpdateCouponParams,
  DeleteCouponParams,
  CreateCouponResponse,
  DeleteCouponResponse,
  Coupon,
  CreateCustomProviderDto,
  CustomProvider,
  ConnectCustomProviderConfigDto,
  DeleteCustomProviderConfigDto,
  DeleteCustomProviderResponse,
  DisconnectCustomProviderResponse
} from '../types/ghl-types.js';

export class PaymentsTools {
  constructor(private client: GHLApiClient) {}

  getToolDefinitions(): any[] {
    return [
      // Integration Provider Tools
      {
        name: 'create_whitelabel_integration_provider',
        description: `Create a white-label payment integration provider.

Set up custom-branded payment processing for your agency or location.

Use Cases:
- White-label Authorize.Net for your agency
- Brand NMI gateway with your company name
- Create custom payment provider for clients
- Multi-location payment processing
- Agency-level payment management

Supported Providers:
- **authorize-net**: Authorize.Net payment gateway
- **nmi**: Network Merchants Inc (NMI) gateway

How It Works:
1. Choose provider (Authorize.Net or NMI)
2. Set unique name (lowercase-with-hyphens)
3. Add branding (title, description, logo)
4. Provider appears in location payment settings
5. Clients can connect using your branded gateway

Examples:
- Agency gateway: uniqueName="my-agency-payments", title="My Agency Payments", provider="authorize-net"
- Custom NMI: uniqueName="custom-nmi-gateway", title="Custom Gateway", provider="nmi"

💡 Best Practices:
- Use descriptive, professional titles
- Provide clear descriptions for clients
- Use high-quality logo images (200x200px recommended)
- uniqueName must be lowercase with hyphens only
- Test integration before rolling out to clients

Returns: Created integration provider with ID and configuration.

Related Tools: list_whitelabel_integration_providers, create_custom_provider_config`,
        inputSchema: {
          altId: z.string().describe('Location ID or company ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          uniqueName: z.string().regex(/^[a-z0-9-]+$/).describe('Unique identifier (lowercase, hyphens only, e.g., "my-agency-payments")'),
          title: z.string().describe('Display name for the payment provider'),
          provider: z.enum(['authorize-net', 'nmi']).describe('Payment gateway type: authorize-net or nmi'),
          description: z.string().describe('Description of the payment provider'),
          imageUrl: z.string().url().describe('Logo image URL (recommended: 200x200px)')
        }
      },
      {
        name: 'list_whitelabel_integration_providers',
        description: `List all white-label payment integration providers.

View configured payment gateways for your agency or location.

Use Cases:
- Audit payment provider configurations
- Find provider IDs for updates
- Review client payment options
- Check provider branding
- Verify integration settings

What You Get:
- All configured providers
- Provider names and IDs
- Gateway types (Authorize.Net, NMI)
- Branding information
- Configuration details

Pagination:
- limit: How many providers per page
- offset: Skip N providers (for page 2, offset=limit)

Examples:
- All providers: {altId, altType: "location"}
- First 10: {altId, altType: "location", limit: 10}
- Page 2: {altId, altType: "location", limit: 10, offset: 10}

Returns: Array of integration providers with configuration details.

Related Tools: create_whitelabel_integration_provider, get_custom_provider_config`,
        inputSchema: {
          altId: z.string().describe('Location ID or company ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          limit: z.number().min(0).optional().describe('Maximum providers to return (0 = all)'),
          offset: z.number().min(0).optional().describe('Number of providers to skip (for pagination)')
        }
      },

      // Order Tools
      {
        name: 'list_orders',
        description: `List orders with filtering and pagination.

View and search customer orders with powerful filtering options.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from order responses:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")
- Example: amount: 99, currency: "USD" → display as "99.00 USD"

Use Cases:
- View all orders for a location
- Filter by order status (pending, paid, refunded)
- Search orders by customer or product
- Track orders by date range
- Monitor test vs live payments
- Find orders for specific contacts

Filtering Options:
- **status**: Filter by order status
- **paymentMode**: live or test transactions
- **startAt/endAt**: Date range (YYYY-MM-DD)
- **search**: Search order names
- **contactId**: Orders for specific customer
- **funnelProductIds**: Orders with specific products

Pagination:
- limit: Orders per page (default: 10)
- offset: Skip N orders (for page 2, offset=10)

Examples:
- All orders: {altId, altType: "location"}
- Paid orders: {altId, altType: "location", status: "paid"}
- Date range: {altId, altType: "location", startAt: "2024-01-01", endAt: "2024-01-31"}
- Customer orders: {altId, altType: "location", contactId: "abc123"}

Returns: Array of orders with customer, product, and payment details.

Related Tools: get_order_by_id, create_order_fulfillment, list_transactions`,
        inputSchema: {
          altId: z.string().describe('Location ID or company ID'),
          altType: z.string().describe('Type of identifier'),
          locationId: z.string().optional().describe('Location ID (sub-account ID)'),
          status: z.string().optional().describe('Order status filter (e.g., "pending", "paid", "refunded")'),
          paymentMode: z.string().optional().describe('Payment mode: "live" or "test"'),
          startAt: z.string().optional().describe('Start date for orders (YYYY-MM-DD)'),
          endAt: z.string().optional().describe('End date for orders (YYYY-MM-DD)'),
          search: z.string().optional().describe('Search term for order name'),
          contactId: z.string().optional().describe('Filter by contact ID'),
          funnelProductIds: z.string().optional().describe('Comma-separated product IDs'),
          limit: z.number().min(1).optional().describe('Maximum orders per page (default: 10)'),
          offset: z.number().min(0).optional().describe('Number of orders to skip (for pagination)')
        }
      },
      {
        name: 'get_order_by_id',
        description: `Get complete details for a specific order.

Retrieve full order information including customer, products, and payment status.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from this response:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Use Cases:
- View order details for customer support
- Check order status and payment info
- Get shipping address for fulfillment
- Review order items and pricing
- Verify payment and transaction details

What You Get:
- Order ID and status
- Customer information
- All order items with prices
- Payment details and method
- Shipping address
- Order totals and taxes
- Timestamps (created, updated)

Common Workflow:
1. List orders to find order ID
2. Get specific order for full details
3. Create fulfillment if needed

Returns: Complete order object with all details.

Related Tools: list_orders, create_order_fulfillment, get_transaction_by_id`,
        inputSchema: {
          orderId: z.string().describe('Order ID to retrieve'),
          altId: z.string().describe('Location ID or company ID'),
          altType: z.string().describe('Type of identifier'),
          locationId: z.string().optional().describe('Location ID (sub-account ID)')
        }
      },

      // Order Fulfillment Tools
      {
        name: 'create_order_fulfillment',
        description: `Create a fulfillment record for an order.

Mark orders as shipped and provide tracking information to customers.

Use Cases:
- Mark order as shipped
- Provide tracking numbers to customers
- Record shipping carrier information
- Partial fulfillments (ship some items now, rest later)
- Notify customers of shipment

How It Works:
1. Get order details
2. Prepare items for shipment
3. Get tracking number from carrier
4. Create fulfillment with tracking info
5. Customer receives notification (if enabled)

Tracking Information:
- trackingNumber: Carrier tracking number
- shippingCarrier: Carrier name (USPS, UPS, FedEx, etc.)
- trackingUrl: Direct link to track package

Items Array:
- priceId: ID of the product price being fulfilled
- qty: Quantity being shipped

Examples:
- Full fulfillment: All items with tracking
- Partial fulfillment: Some items now, rest later
- Multiple packages: Multiple tracking numbers

💡 Best Practices:
- Always provide tracking numbers when available
- Use correct carrier names for tracking links
- Enable customer notifications for transparency
- Create separate fulfillments for split shipments

Returns: Created fulfillment with tracking details.

Related Tools: list_order_fulfillments, get_order_by_id, list_orders`,
        inputSchema: {
          orderId: z.string().describe('Order ID to fulfill'),
          altId: z.string().describe('Location ID or Agency ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          trackings: z.array(z.object({
            trackingNumber: z.string().describe('Tracking number from shipping carrier'),
            shippingCarrier: z.string().describe('Carrier name (USPS, UPS, FedEx, DHL, etc.)'),
            trackingUrl: z.string().url().optional().describe('Direct tracking URL')
          })).describe('Array of tracking information (one per package)'),
          items: z.array(z.object({
            priceId: z.string().describe('Product price ID being fulfilled'),
            qty: z.number().min(1).describe('Quantity being shipped')
          })).describe('Items included in this fulfillment'),
          notifyCustomer: z.boolean().describe('Send shipment notification to customer (true/false)')
        }
      },
      {
        name: 'list_order_fulfillments',
        description: `List all fulfillments for an order.

View shipping history and tracking information for an order.

Use Cases:
- Check fulfillment status
- Get tracking numbers for customer support
- View shipping history
- Verify all items have been shipped
- Track partial fulfillments

What You Get:
- All fulfillments for the order
- Tracking numbers and carriers
- Items shipped in each fulfillment
- Fulfillment timestamps
- Customer notification status

Common Workflow:
1. Get order details
2. List fulfillments to see shipping status
3. Provide tracking info to customer

Returns: Array of fulfillments with tracking and item details.

Related Tools: create_order_fulfillment, get_order_by_id, list_orders`,
        inputSchema: {
          orderId: z.string().describe('Order ID to get fulfillments for'),
          altId: z.string().describe('Location ID or Agency ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)')
        }
      },

      // Transaction Tools
      {
        name: 'list_transactions',
        description: `List payment transactions with filtering.

View and track all payment transactions with powerful filtering options.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from transaction responses:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Use Cases:
- View all transactions for accounting
- Filter by payment mode (live vs test)
- Track transactions by date range
- Find transactions for specific customers
- Monitor subscription payments
- Search transactions by name
- Filter by transaction source

Filtering Options:
- **paymentMode**: live or test transactions
- **startAt/endAt**: Date range (YYYY-MM-DD)
- **contactId**: Transactions for specific customer
- **subscriptionId**: Recurring subscription payments
- **entityId**: Transactions for specific entity
- **entitySourceType**: Source of transaction (order, invoice, etc.)
- **search**: Search transaction names

Pagination:
- limit: Transactions per page (default: 10)
- offset: Skip N transactions (for page 2, offset=10)

Examples:
- All transactions: {altId, altType: "location"}
- Live payments: {altId, altType: "location", paymentMode: "live"}
- Date range: {altId, altType: "location", startAt: "2024-01-01", endAt: "2024-01-31"}
- Customer payments: {altId, altType: "location", contactId: "abc123"}
- Subscription payments: {altId, altType: "location", subscriptionId: "sub_123"}

Returns: Array of transactions with payment details, amounts, and status.

Related Tools: get_transaction_by_id, list_orders, list_subscriptions`,
        inputSchema: {
          altId: z.string().describe('Location ID or company ID'),
          altType: z.string().describe('Type of identifier'),
          locationId: z.string().optional().describe('Location ID (sub-account ID)'),
          paymentMode: z.string().optional().describe('Payment mode: "live" or "test"'),
          startAt: z.string().optional().describe('Start date for transactions (YYYY-MM-DD)'),
          endAt: z.string().optional().describe('End date for transactions (YYYY-MM-DD)'),
          entitySourceType: z.string().optional().describe('Source type (order, invoice, subscription, etc.)'),
          entitySourceSubType: z.string().optional().describe('Source sub-type'),
          search: z.string().optional().describe('Search term for transaction name'),
          subscriptionId: z.string().optional().describe('Filter by subscription ID'),
          entityId: z.string().optional().describe('Filter by entity ID'),
          contactId: z.string().optional().describe('Filter by contact ID'),
          limit: z.number().min(1).optional().describe('Maximum transactions per page (default: 10)'),
          offset: z.number().min(0).optional().describe('Number of transactions to skip (for pagination)')
        }
      },
      {
        name: 'get_transaction_by_id',
        description: `Get complete details for a specific transaction.

Retrieve full transaction information including payment details and status.

**AI/AGENT DISPLAY RULE:** When displaying monetary values from this response:
- Always show with 2 decimal places (e.g., 1500 → 1500.00)
- Append currency code with space (e.g., "1500.00 USD")

Use Cases:
- View transaction details for accounting
- Verify payment status
- Get payment method information
- Check transaction amounts and fees
- Review refund or chargeback details
- Customer support inquiries

What You Get:
- Transaction ID and status
- Payment amount and currency
- Payment method details
- Customer information
- Associated order/subscription
- Transaction fees
- Timestamps (created, processed)
- Refund/chargeback status

Common Workflow:
1. List transactions to find transaction ID
2. Get specific transaction for full details
3. Verify payment status
4. Process refund if needed

Returns: Complete transaction object with all payment details.

Related Tools: list_transactions, get_order_by_id, get_subscription_by_id`,
        inputSchema: {
          transactionId: z.string().describe('Transaction ID to retrieve'),
          altId: z.string().describe('Location ID or company ID'),
          altType: z.string().describe('Type of identifier'),
          locationId: z.string().optional().describe('Location ID (sub-account ID)')
        }
      },

      // Subscription Tools
      {
        name: 'list_subscriptions',
        description: `List recurring subscriptions with filtering.

View and manage all recurring payment subscriptions.

Use Cases:
- View all active subscriptions
- Monitor recurring revenue
- Filter by payment mode (live vs test)
- Track subscriptions by date range
- Find subscriptions for specific customers
- Search subscriptions by name
- Filter by subscription source

Subscription Status:
- Active: Currently billing
- Paused: Temporarily stopped
- Canceled: Permanently stopped
- Past due: Payment failed

Filtering Options:
- **paymentMode**: live or test subscriptions
- **startAt/endAt**: Date range (YYYY-MM-DD)
- **contactId**: Subscriptions for specific customer
- **entityId**: Subscriptions for specific entity
- **entitySourceType**: Source of subscription
- **search**: Search subscription names
- **id**: Specific subscription ID

Pagination:
- limit: Subscriptions per page (default: 10)
- offset: Skip N subscriptions (for page 2, offset=10)

Examples:
- All subscriptions: {altId, altType: "location"}
- Live subscriptions: {altId, altType: "location", paymentMode: "live"}
- Customer subscriptions: {altId, altType: "location", contactId: "abc123"}
- Date range: {altId, altType: "location", startAt: "2024-01-01", endAt: "2024-01-31"}

Returns: Array of subscriptions with billing details and status.

Related Tools: get_subscription_by_id, list_transactions`,
        inputSchema: {
          altId: z.string().describe('Location ID or company ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          entityId: z.string().optional().describe('Filter by entity ID'),
          paymentMode: z.string().optional().describe('Payment mode: "live" or "test"'),
          startAt: z.string().optional().describe('Start date for subscriptions (YYYY-MM-DD)'),
          endAt: z.string().optional().describe('End date for subscriptions (YYYY-MM-DD)'),
          entitySourceType: z.string().optional().describe('Source type of subscriptions'),
          search: z.string().optional().describe('Search term for subscription name'),
          contactId: z.string().optional().describe('Filter by contact ID'),
          id: z.string().optional().describe('Specific subscription ID'),
          limit: z.number().min(1).optional().describe('Maximum subscriptions per page (default: 10)'),
          offset: z.number().min(0).optional().describe('Number of subscriptions to skip (for pagination)')
        }
      },
      {
        name: 'get_subscription_by_id',
        description: `Get complete details for a specific subscription.

Retrieve full subscription information including billing and status.

Use Cases:
- View subscription details
- Check billing cycle and next payment
- Verify subscription status
- Review pricing and plan details
- Get customer information
- Monitor subscription health

What You Get:
- Subscription ID and status
- Customer information
- Product/plan details
- Billing amount and frequency
- Next billing date
- Payment method
- Subscription start/end dates
- Transaction history

Subscription Statuses:
- **active**: Currently billing
- **paused**: Temporarily stopped
- **canceled**: Permanently stopped
- **past_due**: Payment failed, needs attention

Common Workflow:
1. List subscriptions to find subscription ID
2. Get specific subscription for full details
3. Check next billing date
4. Review transaction history

Returns: Complete subscription object with all billing details.

Related Tools: list_subscriptions, list_transactions`,
        inputSchema: {
          subscriptionId: z.string().describe('Subscription ID to retrieve'),
          altId: z.string().describe('Location ID or company ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)')
        }
      },

      // Coupon Tools
      {
        name: 'list_coupons',
        description: `List all promotional coupons with filtering.

View and manage discount coupons for your products and services.

Use Cases:
- View all active coupons
- Find expired or scheduled coupons
- Search coupons by name or code
- Audit coupon usage
- Manage promotional campaigns

Coupon Statuses:
- **scheduled**: Not yet active, waiting for start date
- **active**: Currently available for use
- **expired**: Past end date or usage limit reached

Filtering Options:
- **status**: Filter by coupon status
- **search**: Search by coupon name or code
- **limit**: How many coupons per page
- **offset**: Skip N coupons (for pagination)

Examples:
- All coupons: {altId, altType: "location"}
- Active coupons: {altId, altType: "location", status: "active"}
- Search: {altId, altType: "location", search: "SUMMER"}
- Paginated: {altId, altType: "location", limit: 50, offset: 50}

Returns: Array of coupons with codes, discounts, and usage stats.

Related Tools: create_coupon, update_coupon, get_coupon, delete_coupon`,
        inputSchema: {
          altId: z.string().describe('Location ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          limit: z.number().min(1).optional().describe('Maximum coupons to return (default: 100)'),
          offset: z.number().min(0).optional().describe('Number of coupons to skip (for pagination)'),
          status: z.enum(['scheduled', 'active', 'expired']).optional().describe('Filter by coupon status'),
          search: z.string().optional().describe('Search by coupon name or code')
        }
      },
      {
        name: 'create_coupon',
        description: `Create a new promotional discount coupon.

Set up discount codes for products, subscriptions, and promotional campaigns.

Use Cases:
- Create percentage discounts (e.g., 20% off)
- Create fixed amount discounts (e.g., $10 off)
- Set up limited-time promotions
- Create product-specific coupons
- Configure subscription discounts
- Limit usage per customer

⚠️ MONETARY VALUE FORMAT (for amount type):
When discountType is "amount", use float with decimals:
- For $10 off, use: 10.00 (NOT 1000)
- For $25.50 off, use: 25.50

Discount Types:
- **percentage**: Discount as percentage (e.g., 20 for 20% off)
- **amount**: Fixed dollar amount as float (e.g., 10.00 for $10 off)

Subscription Discounts:
- **applyToFuturePayments**: Apply to recurring payments
- **forever**: Discount applies to all future payments
- **fixed**: Discount applies for N months only

Examples:
- 20% off: {discountType: "percentage", discountValue: 20}
- $10 off: {discountType: "amount", discountValue: 10}
- Limited use: {usageLimit: 100}
- One per customer: {limitPerCustomer: true}
- Product-specific: {productIds: ["prod_123", "prod_456"]}
- 3 months discount: {applyToFuturePayments: true, applyToFuturePaymentsConfig: {type: "fixed", duration: 3, durationType: "months"}}

💡 Best Practices:
- Use clear, memorable coupon codes (e.g., SUMMER2024)
- Set realistic usage limits
- Always set end dates for promotions
- Test coupons before launching campaigns
- Monitor coupon usage regularly

Returns: Created coupon with ID and configuration.

Related Tools: list_coupons, update_coupon, get_coupon, delete_coupon`,
        inputSchema: {
          altId: z.string().describe('Location ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          name: z.string().describe('Coupon display name'),
          code: z.string().describe('Coupon code (e.g., "SUMMER2024")'),
          discountType: z.enum(['percentage', 'amount']).describe('Discount type: percentage or fixed amount'),
          discountValue: z.number().min(0).describe('Discount value: for percentage use whole number (20 = 20%), for amount use float (20.00 = $20 off)'),
          startDate: z.string().describe('Start date/time (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)'),
          endDate: z.string().optional().describe('End date/time (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)'),
          usageLimit: z.number().min(1).optional().describe('Maximum total uses (e.g., 100)'),
          productIds: z.array(z.string()).optional().describe('Product IDs this coupon applies to (empty = all products)'),
          applyToFuturePayments: z.boolean().optional().describe('Apply discount to recurring subscription payments (default: true)'),
          applyToFuturePaymentsConfig: z.object({
            type: z.enum(['forever', 'fixed']).describe('Duration type: forever or fixed months'),
            duration: z.number().min(1).optional().describe('Number of months (required if type=fixed)'),
            durationType: z.enum(['months']).optional().describe('Duration unit (months)')
          }).optional().describe('Configuration for subscription discounts'),
          limitPerCustomer: z.boolean().optional().describe('Limit to one use per customer (default: false)')
        }
      },
      {
        name: 'update_coupon',
        description: `Update an existing promotional coupon.

Modify coupon settings, extend dates, or adjust discount values.

Use Cases:
- Extend coupon expiration date
- Increase usage limits
- Change discount amount
- Update product restrictions
- Modify subscription settings
- Rename coupon

What You Can Update:
- Coupon name and code
- Discount type and value
- Start and end dates
- Usage limits
- Product restrictions
- Subscription payment settings
- Per-customer limits

⚠️ Important Notes:
- Cannot change coupon code if already used
- Existing uses count toward new usage limit
- Date changes don't affect past transactions
- Product changes apply to future uses only

Examples:
- Extend date: {id, altId, altType, endDate: "2024-12-31T23:59:59Z"}
- Increase limit: {id, altId, altType, usageLimit: 500}
- Change discount: {id, altId, altType, discountValue: 25}

Returns: Updated coupon with new configuration.

Related Tools: create_coupon, get_coupon, list_coupons, delete_coupon`,
        inputSchema: {
          id: z.string().describe('Coupon ID to update'),
          altId: z.string().describe('Location ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          name: z.string().describe('Coupon display name'),
          code: z.string().describe('Coupon code'),
          discountType: z.enum(['percentage', 'amount']).describe('Discount type: percentage or fixed amount'),
          discountValue: z.number().min(0).describe('Discount value: for percentage use whole number (20 = 20%), for amount use float (20.00 = $20 off)'),
          startDate: z.string().describe('Start date/time (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)'),
          endDate: z.string().optional().describe('End date/time (ISO 8601: YYYY-MM-DDTHH:mm:ssZ)'),
          usageLimit: z.number().min(1).optional().describe('Maximum total uses'),
          productIds: z.array(z.string()).optional().describe('Product IDs this coupon applies to'),
          applyToFuturePayments: z.boolean().optional().describe('Apply discount to recurring subscription payments'),
          applyToFuturePaymentsConfig: z.object({
            type: z.enum(['forever', 'fixed']).describe('Duration type: forever or fixed months'),
            duration: z.number().min(1).optional().describe('Number of months (required if type=fixed)'),
            durationType: z.enum(['months']).optional().describe('Duration unit (months)')
          }).optional().describe('Configuration for subscription discounts'),
          limitPerCustomer: z.boolean().optional().describe('Limit to one use per customer')
        }
      },
      {
        name: 'delete_coupon',
        description: `Delete a promotional coupon permanently.

⚠️ WARNING: This action cannot be undone!

Use Cases:
- Remove expired promotions
- Delete unused coupons
- Clean up test coupons
- Remove invalid coupon codes

What Happens:
- Coupon is permanently deleted
- Code becomes available for reuse
- Past usage data is preserved
- Active uses are not affected
- Cannot be recovered after deletion

⚠️ Important:
- Customers with active subscriptions using this coupon will lose the discount on next billing
- Consider expiring instead of deleting if you want to preserve history
- Deletion is immediate and cannot be undone

💡 Best Practices:
- Export coupon data before deleting
- Verify coupon ID before deletion
- Consider setting end date instead of deleting
- Notify customers if coupon is actively used

Returns: Confirmation of deletion.

Related Tools: list_coupons, get_coupon, update_coupon`,
        inputSchema: {
          altId: z.string().describe('Location ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          id: z.string().describe('Coupon ID to delete')
        }
      },
      {
        name: 'get_coupon',
        description: `Get complete details for a specific coupon.

Retrieve full coupon information including usage statistics.

Use Cases:
- View coupon configuration
- Check usage statistics
- Verify discount settings
- Get coupon status
- Review product restrictions
- Monitor coupon performance

What You Get:
- Coupon ID and code
- Discount type and value
- Start and end dates
- Usage statistics (used/limit)
- Product restrictions
- Subscription settings
- Current status (scheduled/active/expired)
- Customer limits

Lookup Methods:
- By ID: Unique coupon identifier
- By Code: Customer-facing coupon code

Common Workflow:
1. List coupons to find coupon ID
2. Get specific coupon for full details
3. Review usage and settings
4. Update if needed

Returns: Complete coupon object with all details and statistics.

Related Tools: list_coupons, create_coupon, update_coupon, delete_coupon`,
        inputSchema: {
          altId: z.string().describe('Location ID'),
          altType: z.enum(['location']).describe('Type of identifier (location)'),
          id: z.string().describe('Coupon ID'),
          code: z.string().describe('Coupon code')
        }
      },

      // Custom Provider Tools
      {
        name: 'create_custom_provider_integration',
        description: `Create a custom payment provider integration.

Integrate your own payment gateway with GoHighLevel.

Use Cases:
- Integrate proprietary payment systems
- Connect regional payment gateways
- Use custom payment processors
- Build white-label payment solutions
- Integrate specialized payment methods

How It Works:
1. Create integration with your gateway details
2. Provide payment URL (iframe for checkout)
3. Provide query URL (for payment status)
4. Add branding (name, description, logo)
5. Gateway appears in location payment options

Required URLs:
- **paymentsUrl**: Your checkout page (loaded in iframe)
- **queryUrl**: Endpoint to check payment status
- **imageUrl**: Logo for your payment gateway

Examples:
- Regional gateway: name="Local Payment Gateway", paymentsUrl="https://pay.example.com/checkout"
- Custom processor: name="My Payment System", queryUrl="https://api.example.com/status"

💡 Best Practices:
- Use HTTPS URLs only
- Test integration thoroughly before going live
- Provide clear gateway descriptions
- Use high-quality logos (200x200px recommended)
- Ensure payment URLs are always accessible
- Implement proper error handling

Returns: Created custom provider integration with ID.

Related Tools: delete_custom_provider_integration, create_custom_provider_config, get_custom_provider_config`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided)'),
          name: z.string().describe('Payment gateway name'),
          description: z.string().describe('Description of the payment gateway'),
          paymentsUrl: z.string().url().describe('Payment checkout URL (loaded in iframe)'),
          queryUrl: z.string().url().describe('URL to query payment status'),
          imageUrl: z.string().url().describe('Logo image URL (recommended: 200x200px)')
        }
      },
      {
        name: 'delete_custom_provider_integration',
        description: `Delete a custom payment provider integration.

⚠️ WARNING: This removes the payment gateway integration!

Use Cases:
- Remove unused payment gateways
- Clean up test integrations
- Decommission old payment systems
- Switch to different payment provider

What Happens:
- Integration is permanently removed
- Gateway disappears from payment options
- Existing transactions are preserved
- Active subscriptions may be affected
- Configuration is deleted

⚠️ Important:
- Customers cannot use this gateway after deletion
- Active subscriptions using this gateway will fail on next billing
- Deletion is immediate and cannot be undone
- Consider disconnecting config first to test impact

💡 Best Practices:
- Notify customers before removing gateway
- Migrate active subscriptions to another gateway
- Export transaction data before deletion
- Verify no active uses before deleting

Returns: Confirmation of deletion.

Related Tools: create_custom_provider_integration, disconnect_custom_provider_config`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided)')
        }
      },
      {
        name: 'get_custom_provider_config',
        description: `Get custom payment provider configuration.

Retrieve API keys and configuration for custom payment gateway.

Use Cases:
- View current payment configuration
- Verify API keys are set
- Check live vs test mode settings
- Audit payment gateway setup
- Troubleshoot payment issues

What You Get:
- Live mode configuration (API keys)
- Test mode configuration (API keys)
- Gateway connection status
- Configuration timestamps

Configuration Modes:
- **Live**: Production payment processing
- **Test**: Sandbox/testing environment

💡 Security Note:
- API keys may be partially masked
- Publishable keys are safe to expose
- Private keys should remain secret

Common Workflow:
1. Get config to verify setup
2. Check if keys are configured
3. Update if needed
4. Test connection

Returns: Payment configuration with API keys (may be masked).

Related Tools: create_custom_provider_config, disconnect_custom_provider_config`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided)')
        }
      },
      {
        name: 'create_custom_provider_config',
        description: `Configure custom payment provider with API keys.

Connect your custom payment gateway by providing API credentials.

Use Cases:
- Set up payment gateway credentials
- Configure live and test environments
- Update API keys
- Enable payment processing
- Switch between test and live modes

Configuration Requirements:
- **Live mode**: Production API keys for real transactions
- **Test mode**: Sandbox API keys for testing

API Key Types:
- **apiKey**: Private/secret key (server-side only)
- **publishableKey**: Public key (client-side safe)

How It Works:
1. Get API keys from your payment provider
2. Configure test mode first
3. Test thoroughly with test keys
4. Add live mode keys when ready
5. Gateway is ready for transactions

⚠️ Security:
- Never expose private API keys
- Store keys securely
- Use test mode for development
- Rotate keys periodically
- Monitor for unauthorized access

💡 Best Practices:
- Always configure both live and test modes
- Test thoroughly before going live
- Keep keys confidential
- Use environment variables
- Enable logging for troubleshooting

Examples:
- Test setup: {test: {apiKey: "sk_test_...", publishableKey: "pk_test_..."}}
- Live setup: {live: {apiKey: "sk_live_...", publishableKey: "pk_live_..."}}

Returns: Confirmation of configuration.

Related Tools: get_custom_provider_config, disconnect_custom_provider_config, create_custom_provider_integration`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided)'),
          live: z.object({
            apiKey: z.string().describe('Private API key for live payments (keep secret!)'),
            publishableKey: z.string().describe('Public key for live payments (client-side safe)')
          }).describe('Live/production payment configuration'),
          test: z.object({
            apiKey: z.string().describe('Private API key for test payments (keep secret!)'),
            publishableKey: z.string().describe('Public key for test payments (client-side safe)')
          }).describe('Test/sandbox payment configuration')
        }
      },
      {
        name: 'disconnect_custom_provider_config',
        description: `Disconnect custom payment provider configuration.

Remove API keys and disable payment processing for a specific mode.

Use Cases:
- Disable live mode temporarily
- Remove test configuration
- Rotate API keys securely
- Troubleshoot payment issues
- Switch payment providers

What Happens:
- Selected mode (live/test) is disconnected
- API keys are removed
- Payments in that mode stop working
- Other mode remains unaffected
- Can be reconnected anytime

Disconnect Modes:
- **liveMode: true**: Disconnect live/production config
- **liveMode: false**: Disconnect test/sandbox config

⚠️ Important:
- Live mode disconnect stops real payments
- Test mode disconnect stops test transactions
- Active subscriptions may fail if live mode disconnected
- Disconnection is immediate
- Can reconnect by creating new config

💡 Best Practices:
- Notify customers before disconnecting live mode
- Test in sandbox before disconnecting live
- Have backup payment method ready
- Export transaction data first
- Monitor for failed payments after disconnect

Examples:
- Disconnect live: {locationId, liveMode: true}
- Disconnect test: {locationId, liveMode: false}

Returns: Confirmation of disconnection.

Related Tools: create_custom_provider_config, get_custom_provider_config, delete_custom_provider_integration`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (optional - uses configured location if not provided)'),
          liveMode: z.boolean().describe('true = disconnect live mode, false = disconnect test mode')
        }
      }
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    switch (name) {
      // Integration Provider Handlers
      case 'create_whitelabel_integration_provider':
        return this.client.createWhiteLabelIntegrationProvider(args as CreateWhiteLabelIntegrationProviderDto);

      case 'list_whitelabel_integration_providers':
        return this.client.listWhiteLabelIntegrationProviders(args);

      // Order Handlers
      case 'list_orders':
        return this.client.listOrders(args);

      case 'get_order_by_id':
        return this.client.getOrderById(args.orderId, args);

      // Order Fulfillment Handlers
      case 'create_order_fulfillment':
        const { orderId, ...fulfillmentData } = args;
        return this.client.createOrderFulfillment(orderId, fulfillmentData as CreateFulfillmentDto);

      case 'list_order_fulfillments':
        return this.client.listOrderFulfillments(args.orderId, args);

      // Transaction Handlers
      case 'list_transactions':
        return this.client.listTransactions(args);

      case 'get_transaction_by_id':
        return this.client.getTransactionById(args.transactionId, args);

      // Subscription Handlers
      case 'list_subscriptions':
        return this.client.listSubscriptions(args);

      case 'get_subscription_by_id':
        return this.client.getSubscriptionById(args.subscriptionId, args);

      // Coupon Handlers
      case 'list_coupons':
        return this.client.listCoupons(args);

      case 'create_coupon':
        return this.client.createCoupon(args as CreateCouponParams);

      case 'update_coupon':
        return this.client.updateCoupon(args as UpdateCouponParams);

      case 'delete_coupon':
        return this.client.deleteCoupon(args as DeleteCouponParams);

      case 'get_coupon':
        return this.client.getCoupon(args);

      // Custom Provider Handlers
      case 'create_custom_provider_integration':
        const createLocationId = args.locationId || this.client.getConfig().locationId;
        const { locationId: _createLocId, ...createProviderData } = args;
        return this.client.createCustomProviderIntegration(createLocationId, createProviderData as CreateCustomProviderDto);

      case 'delete_custom_provider_integration':
        const deleteProviderLocationId = args.locationId || this.client.getConfig().locationId;
        return this.client.deleteCustomProviderIntegration(deleteProviderLocationId);

      case 'get_custom_provider_config':
        const getConfigLocationId = args.locationId || this.client.getConfig().locationId;
        return this.client.getCustomProviderConfig(getConfigLocationId);

      case 'create_custom_provider_config':
        const configLocationId = args.locationId || this.client.getConfig().locationId;
        const { locationId: _configLocId, ...configData } = args;
        return this.client.createCustomProviderConfig(configLocationId, configData as ConnectCustomProviderConfigDto);

      case 'disconnect_custom_provider_config':
        const disconnectLocationId = args.locationId || this.client.getConfig().locationId;
        const { locationId: _disconnectLocId, ...disconnectData } = args;
        return this.client.disconnectCustomProviderConfig(disconnectLocationId, disconnectData as DeleteCustomProviderConfigDto);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }
} 