/**
 * GoHighLevel Store API Tools for MCP Server
 * Provides comprehensive tools for managing store shipping zones, rates, carriers, and settings
 */

import { z } from "zod";
import {
  // API Client Types
  GHLCreateShippingZoneRequest,
  GHLUpdateShippingZoneRequest,
  GHLGetShippingZonesRequest,
  GHLDeleteShippingZoneRequest,
  GHLCreateShippingRateRequest,
  GHLUpdateShippingRateRequest,
  GHLGetShippingRatesRequest,
  GHLDeleteShippingRateRequest,
  GHLGetAvailableShippingRatesRequest,
  GHLCreateShippingCarrierRequest,
  GHLUpdateShippingCarrierRequest,
  GHLGetShippingCarriersRequest,
  GHLDeleteShippingCarrierRequest,
  GHLCreateStoreSettingRequest,
  GHLGetStoreSettingRequest,
  GHLCountryCode,
  GHLStateCode
} from '../types/ghl-types.js';

import { GHLApiClient } from '../clients/ghl-api-client.js';

export interface StoreToolResult {
  [x: string]: unknown;
  content: {
    type: 'text';
    text: string;
  }[];
}

export class StoreTools {
  constructor(private apiClient: GHLApiClient) {}

  /**
   * SHIPPING ZONES TOOLS
   */

  /**
   * Create a new shipping zone
   */
  async createShippingZone(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLCreateShippingZoneRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        name: params.name,
        countries: params.countries
      };

      const response = await this.apiClient.createShippingZone(request);

      const zoneInfo = response.data?.data;
      if (!zoneInfo) {
        throw new Error('No shipping zone data returned from API');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Zone Created Successfully**

**Zone Details:**
- **ID:** ${zoneInfo._id}
- **Name:** ${zoneInfo.name}
- **Countries:** ${zoneInfo.countries.length} country(ies) configured
- **Created:** ${new Date(zoneInfo.createdAt).toLocaleString()}

**Countries Configured:**
${zoneInfo.countries.map(country => {
  const states = country.states && country.states.length > 0 
    ? ` (${country.states.length} states)` 
    : ' (All states)';
  return `• ${country.code}${states}`;
}).join('\n')}

The shipping zone is now active and ready to use with shipping rates.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Creating Shipping Zone**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * List all shipping zones
   */
  async listShippingZones(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetShippingZonesRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        limit: params.limit,
        offset: params.offset,
        withShippingRate: params.withShippingRate
      };

      const response = await this.apiClient.listShippingZones(request);

      const zones = response.data?.data || [];

      if (zones.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📦 **No Shipping Zones Found**

No shipping zones are currently configured for this location. Create your first shipping zone to start managing shipping rates.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `📦 **Shipping Zones (${response.data?.total || zones.length} total)**

${zones.map((zone, index) => `**${index + 1}. ${zone.name}**
- **ID:** ${zone._id}
- **Countries:** ${zone.countries.length} configured
- **Shipping Rates:** ${zone.shippingRates?.length || 0}
- **Created:** ${new Date(zone.createdAt).toLocaleString()}

${zone.countries.map(country => {
  const states = country.states && country.states.length > 0 
    ? ` (${country.states.length} states)` 
    : ' (All states)';
  return `  • ${country.code}${states}`;
}).join('\n')}
`).join('\n')}

💡 Use the shipping zone IDs to manage specific zones or create shipping rates.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Listing Shipping Zones**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Get a specific shipping zone
   */
  async getShippingZone(params: any): Promise<StoreToolResult> {
    try {
      const request: Omit<GHLGetShippingZonesRequest, 'limit' | 'offset'> = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        withShippingRate: params.withShippingRate
      };

      const response = await this.apiClient.getShippingZone(params.shippingZoneId, request);

      const zone = response.data?.data;
      if (!zone) {
        throw new Error('Shipping zone not found');
      }

      return {
        content: [{
          type: 'text',
          text: `📦 **Shipping Zone Details**

**Zone Information:**
- **ID:** ${zone._id}
- **Name:** ${zone.name}
- **Created:** ${new Date(zone.createdAt).toLocaleString()}
- **Updated:** ${new Date(zone.updatedAt).toLocaleString()}

**Countries & Regions (${zone.countries.length}):**
${zone.countries.map(country => {
  const states = country.states && country.states.length > 0 
    ? `\n  States: ${country.states.map(s => s.code).join(', ')}` 
    : '\n  States: All states included';
  return `• **${country.code}**${states}`;
}).join('\n')}

${zone.shippingRates ? `**Shipping Rates (${zone.shippingRates.length}):**
${zone.shippingRates.map((rate, index) => `${index + 1}. **${rate.name}**
   - Rate: ${rate.currency} ${rate.amount}
   - Condition: ${rate.conditionType}
   - Carrier Rate: ${rate.isCarrierRate ? 'Yes' : 'No'}
`).join('\n')}` : ''}

Use this zone ID to create shipping rates or update zone configuration.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Getting Shipping Zone**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Update a shipping zone
   */
  async updateShippingZone(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLUpdateShippingZoneRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      if (params.name) request.name = params.name;
      if (params.countries) request.countries = params.countries;

      const response = await this.apiClient.updateShippingZone(params.shippingZoneId, request);

      const zone = response.data?.data;
      if (!zone) {
        throw new Error('No shipping zone data returned from update');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Zone Updated Successfully**

**Updated Zone:**
- **ID:** ${zone._id}
- **Name:** ${zone.name}
- **Countries:** ${zone.countries.length} configured
- **Last Updated:** ${new Date(zone.updatedAt).toLocaleString()}

**Current Countries:**
${zone.countries.map(country => {
  const states = country.states && country.states.length > 0 
    ? ` (${country.states.length} states)` 
    : ' (All states)';
  return `• ${country.code}${states}`;
}).join('\n')}

The shipping zone configuration has been updated successfully.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Updating Shipping Zone**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Delete a shipping zone
   */
  async deleteShippingZone(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLDeleteShippingZoneRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.deleteShippingZone(params.shippingZoneId, request);

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Zone Deleted Successfully**

**Zone ID:** ${params.shippingZoneId}

The shipping zone and all associated shipping rates have been permanently deleted. This action cannot be undone.

⚠️ **Note:** Any existing orders using this shipping zone may be affected. Please ensure you have alternative shipping options configured.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Deleting Shipping Zone**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * SHIPPING RATES TOOLS
   */

  /**
   * Get available shipping rates for an order
   */
  async getAvailableShippingRates(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetAvailableShippingRatesRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        country: params.country,
        address: params.address,
        totalOrderAmount: params.totalOrderAmount,
        totalOrderWeight: params.totalOrderWeight,
        source: params.source,
        products: params.products,
        couponCode: params.couponCode
      };

      const response = await this.apiClient.getAvailableShippingRates(request);

      const rates = response.data?.data || [];

      if (rates.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📦 **No Shipping Rates Available**

No shipping rates are available for the specified order criteria:
- **Country:** ${params.country}
- **Order Amount:** $${params.totalOrderAmount}
- **Order Weight:** ${params.totalOrderWeight} kg
- **Products:** ${params.products.length} item(s)

Please check your shipping zone configuration or contact support.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `📦 **Available Shipping Rates (${rates.length})**

**Order Summary:**
- **Country:** ${params.country}
- **Order Amount:** $${params.totalOrderAmount}
- **Order Weight:** ${params.totalOrderWeight} kg
- **Products:** ${params.products.length} item(s)

**Available Shipping Options:**

${rates.map((rate, index) => `**${index + 1}. ${rate.name}**
- **Cost:** ${rate.currency} ${rate.amount}${rate.isCarrierRate ? ' (+ carrier fees)' : ''}
- **Type:** ${rate.isCarrierRate ? 'Carrier Rate' : 'Fixed Rate'}
- **Zone ID:** ${rate.shippingZoneId}
- **Rate ID:** ${rate._id}
${rate.description ? `- **Description:** ${rate.description}` : ''}
${rate.shippingCarrierServices && rate.shippingCarrierServices.length > 0 ? `- **Services:** ${rate.shippingCarrierServices.map(s => s.name).join(', ')}` : ''}
`).join('\n')}

Select the appropriate shipping rate for checkout.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Getting Available Shipping Rates**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Create a shipping rate
   */
  async createShippingRate(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLCreateShippingRateRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        name: params.name,
        description: params.description,
        currency: params.currency,
        amount: params.amount,
        conditionType: params.conditionType,
        minCondition: params.minCondition,
        maxCondition: params.maxCondition,
        isCarrierRate: params.isCarrierRate,
        shippingCarrierId: params.shippingCarrierId,
        percentageOfRateFee: params.percentageOfRateFee,
        shippingCarrierServices: params.shippingCarrierServices
      };

      const response = await this.apiClient.createShippingRate(params.shippingZoneId, request);

      const rate = response.data?.data;
      if (!rate) {
        throw new Error('No shipping rate data returned from API');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Rate Created Successfully**

**Rate Details:**
- **ID:** ${rate._id}
- **Name:** ${rate.name}
- **Zone ID:** ${rate.shippingZoneId}
- **Cost:** ${rate.currency} ${rate.amount}
- **Condition Type:** ${rate.conditionType}
${rate.minCondition ? `- **Min Condition:** ${rate.minCondition}` : ''}
${rate.maxCondition ? `- **Max Condition:** ${rate.maxCondition}` : ''}
- **Carrier Rate:** ${rate.isCarrierRate ? 'Yes' : 'No'}
${rate.description ? `- **Description:** ${rate.description}` : ''}
- **Created:** ${new Date(rate.createdAt).toLocaleString()}

${rate.shippingCarrierServices && rate.shippingCarrierServices.length > 0 ? `**Carrier Services:**
${rate.shippingCarrierServices.map(service => `• ${service.name} (${service.value})`).join('\n')}` : ''}

The shipping rate is now active and available for orders.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Creating Shipping Rate**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * List shipping rates for a zone
   */
  async listShippingRates(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetShippingRatesRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        limit: params.limit,
        offset: params.offset
      };

      const response = await this.apiClient.listShippingRates(params.shippingZoneId, request);

      const rates = response.data?.data || [];

      if (rates.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📦 **No Shipping Rates Found**

No shipping rates are configured for zone: ${params.shippingZoneId}

Create shipping rates to enable shipping options for this zone.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `📦 **Shipping Rates for Zone ${params.shippingZoneId} (${response.data?.total || rates.length} total)**

${rates.map((rate, index) => `**${index + 1}. ${rate.name}**
- **ID:** ${rate._id}
- **Cost:** ${rate.currency} ${rate.amount}
- **Condition:** ${rate.conditionType}${rate.minCondition ? ` (min: ${rate.minCondition})` : ''}${rate.maxCondition ? ` (max: ${rate.maxCondition})` : ''}
- **Type:** ${rate.isCarrierRate ? 'Carrier Rate' : 'Fixed Rate'}
- **Created:** ${new Date(rate.createdAt).toLocaleString()}
${rate.description ? `- **Description:** ${rate.description}` : ''}
`).join('\n')}

Use rate IDs to update or delete specific shipping rates.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Listing Shipping Rates**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Get a specific shipping rate
   */
  async getShippingRate(params: any): Promise<StoreToolResult> {
    try {
      const request: Omit<GHLGetShippingRatesRequest, 'limit' | 'offset'> = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.getShippingRate(
        params.shippingZoneId, 
        params.shippingRateId, 
        request
      );

      const rate = response.data?.data;
      if (!rate) {
        throw new Error('Shipping rate not found');
      }

      return {
        content: [{
          type: 'text',
          text: `📦 **Shipping Rate Details**

**Rate Information:**
- **ID:** ${rate._id}
- **Name:** ${rate.name}
- **Zone ID:** ${rate.shippingZoneId}
- **Cost:** ${rate.currency} ${rate.amount}
- **Condition Type:** ${rate.conditionType}
${rate.minCondition ? `- **Min Condition:** ${rate.minCondition}` : ''}
${rate.maxCondition ? `- **Max Condition:** ${rate.maxCondition}` : ''}
- **Carrier Rate:** ${rate.isCarrierRate ? 'Yes' : 'No'}
${rate.percentageOfRateFee ? `- **Carrier Fee %:** ${rate.percentageOfRateFee}%` : ''}
${rate.description ? `- **Description:** ${rate.description}` : ''}
- **Created:** ${new Date(rate.createdAt).toLocaleString()}
- **Updated:** ${new Date(rate.updatedAt).toLocaleString()}

${rate.shippingCarrierServices && rate.shippingCarrierServices.length > 0 ? `**Carrier Services:**
${rate.shippingCarrierServices.map(service => `• **${service.name}** (${service.value})`).join('\n')}` : ''}

Use this rate information to manage shipping configurations.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Getting Shipping Rate**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Update a shipping rate
   */
  async updateShippingRate(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLUpdateShippingRateRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      // Only include provided parameters
      if (params.name !== undefined) request.name = params.name;
      if (params.description !== undefined) request.description = params.description;
      if (params.currency !== undefined) request.currency = params.currency;
      if (params.amount !== undefined) request.amount = params.amount;
      if (params.conditionType !== undefined) request.conditionType = params.conditionType;
      if (params.minCondition !== undefined) request.minCondition = params.minCondition;
      if (params.maxCondition !== undefined) request.maxCondition = params.maxCondition;
      if (params.isCarrierRate !== undefined) request.isCarrierRate = params.isCarrierRate;
      if (params.shippingCarrierId !== undefined) request.shippingCarrierId = params.shippingCarrierId;
      if (params.percentageOfRateFee !== undefined) request.percentageOfRateFee = params.percentageOfRateFee;
      if (params.shippingCarrierServices !== undefined) request.shippingCarrierServices = params.shippingCarrierServices;

      const response = await this.apiClient.updateShippingRate(
        params.shippingZoneId,
        params.shippingRateId,
        request
      );

      const rate = response.data?.data;
      if (!rate) {
        throw new Error('No shipping rate data returned from update');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Rate Updated Successfully**

**Updated Rate:**
- **ID:** ${rate._id}
- **Name:** ${rate.name}
- **Zone ID:** ${rate.shippingZoneId}
- **Cost:** ${rate.currency} ${rate.amount}
- **Condition Type:** ${rate.conditionType}
${rate.minCondition ? `- **Min Condition:** ${rate.minCondition}` : ''}
${rate.maxCondition ? `- **Max Condition:** ${rate.maxCondition}` : ''}
- **Carrier Rate:** ${rate.isCarrierRate ? 'Yes' : 'No'}
${rate.description ? `- **Description:** ${rate.description}` : ''}
- **Last Updated:** ${new Date(rate.updatedAt).toLocaleString()}

The shipping rate configuration has been updated successfully.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Updating Shipping Rate**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Delete a shipping rate
   */
  async deleteShippingRate(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLDeleteShippingRateRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.deleteShippingRate(
        params.shippingZoneId,
        params.shippingRateId,
        request
      );

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Rate Deleted Successfully**

**Deleted Rate:**
- **Zone ID:** ${params.shippingZoneId}
- **Rate ID:** ${params.shippingRateId}

The shipping rate has been permanently deleted. This action cannot be undone.

⚠️ **Note:** This shipping option will no longer be available for new orders.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Deleting Shipping Rate**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * SHIPPING CARRIERS TOOLS
   */

  /**
   * Create a shipping carrier
   */
  async createShippingCarrier(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLCreateShippingCarrierRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        name: params.name,
        callbackUrl: params.callbackUrl,
        services: params.services,
        allowsMultipleServiceSelection: params.allowsMultipleServiceSelection
      };

      const response = await this.apiClient.createShippingCarrier(request);

      const carrier = response.data?.data;
      if (!carrier) {
        throw new Error('No shipping carrier data returned from API');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Carrier Created Successfully**

**Carrier Details:**
- **ID:** ${carrier._id}
- **Name:** ${carrier.name}
- **Callback URL:** ${carrier.callbackUrl}
- **Multiple Services:** ${carrier.allowsMultipleServiceSelection ? 'Allowed' : 'Single Service Only'}
- **Marketplace App ID:** ${carrier.marketplaceAppId}
- **Created:** ${new Date(carrier.createdAt).toLocaleString()}

${carrier.services && carrier.services.length > 0 ? `**Available Services (${carrier.services.length}):**
${carrier.services.map(service => `• **${service.name}** (${service.value})`).join('\n')}` : '**No services configured**'}

The shipping carrier is now available for creating carrier-based shipping rates.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Creating Shipping Carrier**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * List all shipping carriers
   */
  async listShippingCarriers(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetShippingCarriersRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.listShippingCarriers(request);

      const carriers = response.data?.data || [];

      if (carriers.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `🚚 **No Shipping Carriers Found**

No shipping carriers are currently configured for this location. Create shipping carriers to enable carrier-based shipping rates.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `🚚 **Shipping Carriers (${carriers.length})**

${carriers.map((carrier, index) => `**${index + 1}. ${carrier.name}**
- **ID:** ${carrier._id}
- **Callback URL:** ${carrier.callbackUrl}
- **Multiple Services:** ${carrier.allowsMultipleServiceSelection ? 'Yes' : 'No'}
- **Services:** ${carrier.services?.length || 0} configured
- **Created:** ${new Date(carrier.createdAt).toLocaleString()}
${carrier.services && carrier.services.length > 0 ? `
  **Services:**
  ${carrier.services.map(s => `  • ${s.name} (${s.value})`).join('\n')}` : ''}
`).join('\n')}

Use carrier IDs to create carrier-based shipping rates or manage carrier configurations.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Listing Shipping Carriers**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Get a specific shipping carrier
   */
  async getShippingCarrier(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetShippingCarriersRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.getShippingCarrier(params.shippingCarrierId, request);

      const carrier = response.data?.data;
      if (!carrier) {
        throw new Error('Shipping carrier not found');
      }

      return {
        content: [{
          type: 'text',
          text: `🚚 **Shipping Carrier Details**

**Carrier Information:**
- **ID:** ${carrier._id}
- **Name:** ${carrier.name}
- **Callback URL:** ${carrier.callbackUrl}
- **Multiple Service Selection:** ${carrier.allowsMultipleServiceSelection ? 'Allowed' : 'Single Service Only'}
- **Marketplace App ID:** ${carrier.marketplaceAppId}
- **Created:** ${new Date(carrier.createdAt).toLocaleString()}
- **Updated:** ${new Date(carrier.updatedAt).toLocaleString()}

${carrier.services && carrier.services.length > 0 ? `**Available Services (${carrier.services.length}):**
${carrier.services.map(service => `• **${service.name}**
  - Value: ${service.value}
`).join('\n')}` : '**No services configured**'}

Use this carrier to create dynamic shipping rates based on real-time carrier pricing.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Getting Shipping Carrier**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Update a shipping carrier
   */
  async updateShippingCarrier(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLUpdateShippingCarrierRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      // Only include provided parameters
      if (params.name !== undefined) request.name = params.name;
      if (params.callbackUrl !== undefined) request.callbackUrl = params.callbackUrl;
      if (params.services !== undefined) request.services = params.services;
      if (params.allowsMultipleServiceSelection !== undefined) request.allowsMultipleServiceSelection = params.allowsMultipleServiceSelection;

      const response = await this.apiClient.updateShippingCarrier(params.shippingCarrierId, request);

      const carrier = response.data?.data;
      if (!carrier) {
        throw new Error('No shipping carrier data returned from update');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Carrier Updated Successfully**

**Updated Carrier:**
- **ID:** ${carrier._id}
- **Name:** ${carrier.name}
- **Callback URL:** ${carrier.callbackUrl}
- **Multiple Services:** ${carrier.allowsMultipleServiceSelection ? 'Allowed' : 'Single Service Only'}
- **Last Updated:** ${new Date(carrier.updatedAt).toLocaleString()}

${carrier.services && carrier.services.length > 0 ? `**Services (${carrier.services.length}):**
${carrier.services.map(service => `• ${service.name} (${service.value})`).join('\n')}` : ''}

The shipping carrier configuration has been updated successfully.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Updating Shipping Carrier**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Delete a shipping carrier
   */
  async deleteShippingCarrier(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLDeleteShippingCarrierRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.deleteShippingCarrier(params.shippingCarrierId, request);

      return {
        content: [{
          type: 'text',
          text: `✅ **Shipping Carrier Deleted Successfully**

**Carrier ID:** ${params.shippingCarrierId}

The shipping carrier has been permanently deleted. This action cannot be undone.

⚠️ **Important:** Any shipping rates using this carrier will no longer function properly. Please update or remove associated shipping rates.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Deleting Shipping Carrier**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * STORE SETTINGS TOOLS
   */

  /**
   * Create or update store settings
   */
  async createStoreSetting(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLCreateStoreSettingRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location',
        shippingOrigin: params.shippingOrigin,
        storeOrderNotification: params.storeOrderNotification,
        storeOrderFulfillmentNotification: params.storeOrderFulfillmentNotification
      };

      const response = await this.apiClient.createStoreSetting(request);

      const settings = response.data?.data;
      if (!settings) {
        throw new Error('No store settings data returned from API');
      }

      return {
        content: [{
          type: 'text',
          text: `✅ **Store Settings Created/Updated Successfully**

**Settings ID:** ${settings._id}

**Shipping Origin:**
- **Name:** ${settings.shippingOrigin.name}
- **Address:** ${settings.shippingOrigin.street1}${settings.shippingOrigin.street2 ? `, ${settings.shippingOrigin.street2}` : ''}
- **City:** ${settings.shippingOrigin.city}, ${settings.shippingOrigin.state || ''} ${settings.shippingOrigin.zip}
- **Country:** ${settings.shippingOrigin.country}
${settings.shippingOrigin.phone ? `- **Phone:** ${settings.shippingOrigin.phone}` : ''}
${settings.shippingOrigin.email ? `- **Email:** ${settings.shippingOrigin.email}` : ''}

${settings.storeOrderNotification ? `**Order Notifications:**
- **Enabled:** ${settings.storeOrderNotification.enabled ? 'Yes' : 'No'}
- **Subject:** ${settings.storeOrderNotification.subject}
- **Template ID:** ${settings.storeOrderNotification.emailTemplateId}` : ''}

${settings.storeOrderFulfillmentNotification ? `**Fulfillment Notifications:**
- **Enabled:** ${settings.storeOrderFulfillmentNotification.enabled ? 'Yes' : 'No'}
- **Subject:** ${settings.storeOrderFulfillmentNotification.subject}
- **Template ID:** ${settings.storeOrderFulfillmentNotification.emailTemplateId}` : ''}

**Last Updated:** ${new Date(settings.updatedAt).toLocaleString()}

Your store settings have been configured successfully.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Creating/Updating Store Settings**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Get store settings
   */
  async getStoreSetting(params: any): Promise<StoreToolResult> {
    try {
      const request: GHLGetStoreSettingRequest = {
        altId: params.locationId || this.apiClient.getConfig().locationId,
        altType: 'location'
      };

      const response = await this.apiClient.getStoreSetting(request);

      const settings = response.data?.data;
      if (!settings) {
        return {
          content: [{
            type: 'text',
            text: `⚙️ **No Store Settings Found**

No store settings are currently configured for this location. Create store settings to configure shipping origin and notification preferences.`
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `⚙️ **Store Settings**

**Settings ID:** ${settings._id}

**📍 Shipping Origin:**
- **Business Name:** ${settings.shippingOrigin.name}
- **Address:** ${settings.shippingOrigin.street1}${settings.shippingOrigin.street2 ? `, ${settings.shippingOrigin.street2}` : ''}
- **City:** ${settings.shippingOrigin.city}, ${settings.shippingOrigin.state || ''} ${settings.shippingOrigin.zip}
- **Country:** ${settings.shippingOrigin.country}
${settings.shippingOrigin.phone ? `- **Phone:** ${settings.shippingOrigin.phone}` : ''}
${settings.shippingOrigin.email ? `- **Email:** ${settings.shippingOrigin.email}` : ''}

${settings.storeOrderNotification ? `**📧 Order Notifications:**
- **Status:** ${settings.storeOrderNotification.enabled ? '✅ Enabled' : '❌ Disabled'}
- **Subject Line:** "${settings.storeOrderNotification.subject}"
- **Email Template ID:** ${settings.storeOrderNotification.emailTemplateId}
- **Default Template ID:** ${settings.storeOrderNotification.defaultEmailTemplateId}` : '**📧 Order Notifications:** Not configured'}

${settings.storeOrderFulfillmentNotification ? `**📦 Fulfillment Notifications:**
- **Status:** ${settings.storeOrderFulfillmentNotification.enabled ? '✅ Enabled' : '❌ Disabled'}
- **Subject Line:** "${settings.storeOrderFulfillmentNotification.subject}"
- **Email Template ID:** ${settings.storeOrderFulfillmentNotification.emailTemplateId}
- **Default Template ID:** ${settings.storeOrderFulfillmentNotification.defaultEmailTemplateId}` : '**📦 Fulfillment Notifications:** Not configured'}

**Created:** ${new Date(settings.createdAt).toLocaleString()}
**Last Updated:** ${new Date(settings.updatedAt).toLocaleString()}

These settings control your store's shipping origin and email notification preferences.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `❌ **Error Getting Store Settings**\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}`
        }]
      };
    }
  }

  /**
   * Get all Store API tool definitions
   */
  getToolDefinitions(): any[] {
    return [
      // Shipping Zones Tools
      {
        name: 'create_shipping_zone',
        description: `Create a new shipping zone with specific countries and states.

Define geographic regions where you ship products and set up location-based shipping rules.

Use Cases:
- Create "Domestic US" zone for all US states
- Set up "California Only" zone for CA-specific shipping
- Define "North America" zone for US, Canada, Mexico
- Create "EU Countries" zone for European shipping
- Set up "International" zone for worldwide shipping

How It Works:
1. Name your shipping zone (e.g., "US Mainland", "West Coast")
2. Add countries by 2-letter code (US, CA, GB, etc.)
3. Optionally restrict to specific states within countries
4. Zone can include multiple countries and state combinations

Examples:
- US only: countries=[{code:"US"}]
- California only: countries=[{code:"US", states:[{code:"CA"}]}]
- US + Canada: countries=[{code:"US"}, {code:"CA"}]
- Multiple states: countries=[{code:"US", states:[{code:"CA"},{code:"NY"},{code:"TX"}]}]

⚠️ Important:
- Country codes must be valid 2-letter ISO codes (US, CA, GB, etc.)
- State codes must be valid for the country (CA, NY, TX for US)
- Empty states array means ALL states in that country
- Zones are used to calculate shipping rates for orders

Returns: Created zone with ID, name, and configured countries/states.

Related Tools: list_shipping_zones, update_shipping_zone, create_shipping_rate`,
        inputSchema: {
          name: z.string().describe('Name of the shipping zone (e.g., "US Mainland", "West Coast", "International")'),
          countries: z.array(z.object({
            code: z.string().describe('2-letter country code (e.g., "US", "CA", "GB", "AU")'),
            states: z.array(z.object({
              code: z.string().describe('State/province code (e.g., "CA", "NY", "TX", "ON", "BC")')
            })).optional().describe('Optional: Specific states/provinces. Omit for all states in country')
          })).describe('Array of countries with optional state restrictions'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_shipping_zones',
        description: `List all shipping zones for a location.

View all configured shipping zones to understand your shipping coverage.

Use Cases:
- Audit all shipping zones in your store
- Review geographic coverage before adding rates
- Find zone IDs for updating or deleting
- Check which countries/states are configured
- Display shipping options to customers

Pagination:
- Use limit/offset for large zone lists
- Default returns all zones if no limit specified

withShippingRate Option:
- Set to true to include associated shipping rates
- Useful for seeing complete shipping configuration
- Helps identify zones without rates configured

Returns: Array of zones with names, countries, states, and optionally rates.

Related Tools: get_shipping_zone, create_shipping_zone, list_shipping_rates`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          limit: z.number().min(1).optional().describe('Maximum zones to return (for pagination)'),
          offset: z.number().min(0).optional().describe('Number of zones to skip (for pagination)'),
          withShippingRate: z.boolean().optional().describe('Include associated shipping rates in response (default: false)')
        }
      },
      {
        name: 'get_shipping_zone',
        description: `Get details of a specific shipping zone.

Retrieve complete configuration for a single shipping zone.

Use Cases:
- View zone details before updating
- Check which countries/states are in a zone
- Verify zone configuration is correct
- Get zone info for customer support
- Review shipping rates for a zone

What You Get:
- Zone ID and name
- All configured countries
- State restrictions per country
- Associated shipping rates (if withShippingRate=true)
- Creation and update timestamps

Common Workflow:
1. List zones to find the zone ID
2. Get specific zone to see full details
3. Update zone if changes needed

Returns: Complete zone configuration with countries, states, and optionally rates.

Related Tools: list_shipping_zones, update_shipping_zone, list_shipping_rates`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone to retrieve'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)'),
          withShippingRate: z.boolean().optional().describe('Include shipping rates in response (default: false)')
        }
      },
      {
        name: 'update_shipping_zone',
        description: `Update a shipping zone's name or countries.

Modify existing shipping zones to adjust geographic coverage.

Use Cases:
- Rename zone for clarity ("West Coast" → "CA/OR/WA")
- Add new countries to existing zone
- Remove countries from zone
- Adjust state restrictions
- Expand or reduce shipping coverage

What You Can Update:
- name: Change zone display name
- countries: Replace entire country/state configuration

⚠️ Important:
- Provide name, countries, or both
- Countries update REPLACES all existing countries
- Include ALL countries you want to keep
- Cannot update zone ID
- Existing shipping rates remain attached to zone

Examples:
- Rename only: {shippingZoneId, name: "New Name"}
- Add country: Get current countries, add new one, update
- Remove state: Get current config, remove state, update

Best Practice:
1. Get current zone configuration first
2. Modify the configuration
3. Send complete updated configuration

Returns: Updated zone with new name and/or countries.

Related Tools: get_shipping_zone, list_shipping_zones, delete_shipping_zone`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone to update'),
          name: z.string().optional().describe('New name for the zone (optional)'),
          countries: z.array(z.object({
            code: z.string().describe('2-letter country code (e.g., "US", "CA", "GB")'),
            states: z.array(z.object({
              code: z.string().describe('State/province code (e.g., "CA", "NY", "TX")')
            })).optional().describe('Optional: Specific states. Omit for all states')
          })).optional().describe('Updated countries array (REPLACES all existing countries)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_shipping_zone',
        description: `Delete a shipping zone and all its associated shipping rates.

⚠️ WARNING: This is PERMANENT and cannot be undone!
⚠️ All shipping rates in this zone will also be deleted!

Use Cases:
- Remove zones no longer needed
- Clean up test/duplicate zones
- Reorganize shipping structure
- Remove zones with incorrect configuration

What Gets Deleted:
- The shipping zone itself
- ALL shipping rates associated with this zone
- Zone configuration (countries, states)
- Zone name and metadata

⚠️ Before Deleting:
1. Verify this is the correct zone (use get_shipping_zone)
2. Check if zone has active shipping rates
3. Ensure no orders are pending with these rates
4. Consider updating instead of deleting
5. Have backup of zone configuration if needed

⚠️ Impact:
- Customers in this zone won't see shipping options
- Existing orders with these rates are NOT affected
- Zone cannot be recovered after deletion
- Must recreate zone and rates if deleted by mistake

Safer Alternative:
- Update zone to remove countries instead of deleting
- Keeps shipping rate history intact

Returns: Confirmation of deletion.

Related Tools: get_shipping_zone, update_shipping_zone, list_shipping_zones`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone to permanently delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Shipping Rates Tools
      {
        name: 'get_available_shipping_rates',
        description: `Get available shipping rates for an order based on destination.

Calculate which shipping options are available for a customer's order based on their location and order details.

Use Cases:
- Display shipping options at checkout
- Calculate shipping costs for quotes
- Determine delivery options for customer
- Show estimated shipping costs
- Filter rates by order weight/amount

How It Works:
1. Provide destination country and address
2. Include order total amount and weight
3. List all products with quantities
4. System matches to configured shipping zones
5. Returns applicable rates with costs

Rate Calculation:
- Matches destination to shipping zones
- Applies zone-specific rates
- Considers order amount/weight conditions
- Returns only rates that match criteria

Examples:
- US order: country="US", address with city/state
- International: country="CA", totalOrderAmount=5000 (cents)
- Heavy order: totalOrderWeight=2500 (grams)

💡 Best Practices:
- Always provide complete address for accuracy
- Amount in cents (5000 = $50.00)
- Weight in grams (1000 = 1kg)
- Include all products for accurate calculation

Returns: Array of available shipping rates with names, costs, and delivery estimates.

Related Tools: list_shipping_zones, list_shipping_rates, create_shipping_rate`,
        inputSchema: {
          country: z.string().describe('Destination country code (2-letter ISO: "US", "CA", "GB")'),
          address: z.object({
            street1: z.string().describe('Street address line 1'),
            city: z.string().describe('City name'),
            country: z.string().describe('Country code (must match outer country parameter)')
          }).describe('Complete shipping address for rate calculation'),
          totalOrderAmount: z.number().describe('Total order amount in cents (e.g., 5000 = $50.00)'),
          totalOrderWeight: z.number().describe('Total order weight in grams (e.g., 1000 = 1kg)'),
          products: z.array(z.object({
            id: z.string().describe('Product ID'),
            quantity: z.number().min(1).describe('Product quantity')
          })).describe('Array of products in the order'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'create_shipping_rate',
        description: `Create a new shipping rate for a shipping zone.

Define shipping costs and conditions for a specific geographic zone.

Use Cases:
- Set up "Standard Shipping" for $5.99
- Create "Express Shipping" for $15.99
- Add "Free Shipping" for orders over $50
- Define weight-based shipping rates
- Set up flat rate shipping

Condition Types:
- **PRICE**: Rate based on order amount (e.g., free over $50)
- **WEIGHT**: Rate based on order weight (e.g., $5 per kg)
- **FLAT**: Fixed rate regardless of order (e.g., $9.99 always)

How It Works:
1. Select the shipping zone (e.g., "US Mainland")
2. Name your rate (e.g., "Standard Ground")
3. Set currency (USD, CAD, EUR, etc.)
4. Define amount in cents (999 = $9.99)
5. Choose condition type for when rate applies

Examples:
- Flat rate: name="Standard", amount=999, conditionType="FLAT"
- Free shipping: name="Free", amount=0, conditionType="PRICE", minCondition=5000
- Weight-based: name="Heavy", amount=1500, conditionType="WEIGHT"

💡 Best Practices:
- Use clear, customer-friendly names
- Amount always in cents (999 = $9.99)
- Create multiple rates per zone for options
- Test rates with get_available_shipping_rates

Returns: Created rate with ID, name, amount, and conditions.

Related Tools: list_shipping_rates, update_shipping_rate, create_shipping_zone`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone for this rate'),
          name: z.string().describe('Customer-facing rate name (e.g., "Standard Ground", "Express")'),
          currency: z.string().describe('Currency code ("USD", "CAD", "EUR", "GBP")'),
          amount: z.number().min(0).describe('Shipping cost in cents (999 = $9.99, 0 = free)'),
          conditionType: z.enum(['PRICE', 'WEIGHT', 'FLAT']).describe('When rate applies: PRICE (order amount), WEIGHT (order weight), FLAT (always)'),
          minCondition: z.number().optional().describe('Minimum value for PRICE/WEIGHT conditions (in cents or grams)'),
          maxCondition: z.number().optional().describe('Maximum value for PRICE/WEIGHT conditions (in cents or grams)'),
          description: z.string().optional().describe('Optional description shown to customers'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_shipping_rates',
        description: `List all shipping rates for a specific shipping zone.

View all configured shipping options for a geographic zone.

Use Cases:
- Review all rates for a zone
- Audit shipping configuration
- Find rate IDs for updates/deletes
- Check rate pricing and conditions
- Verify customer shipping options

What You Get:
- All rates for the specified zone
- Rate names and amounts
- Condition types and values
- Currency information
- Rate IDs for management

Common Workflow:
1. List zones to find zone ID
2. List rates for that zone
3. Review or modify rates as needed

Example Response:
- "Standard Ground" - $9.99 (FLAT)
- "Express" - $19.99 (FLAT)
- "Free Shipping" - $0 (PRICE > $50)

Returns: Array of all shipping rates configured for the zone.

Related Tools: get_shipping_rate, create_shipping_rate, list_shipping_zones`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone to get rates for'),
          limit: z.number().min(1).optional().describe('Maximum rates to return (for pagination)'),
          offset: z.number().min(0).optional().describe('Number of rates to skip (for pagination)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_shipping_rate',
        description: `Get details of a specific shipping rate.

Retrieve complete configuration for a single shipping rate.

Use Cases:
- View rate details before updating
- Check rate pricing and conditions
- Verify rate configuration
- Get rate info for customer support
- Review condition settings

What You Get:
- Rate ID, name, and description
- Amount and currency
- Condition type (PRICE/WEIGHT/FLAT)
- Min/max condition values
- Associated shipping zone
- Creation and update timestamps

Common Workflow:
1. List rates to find the rate ID
2. Get specific rate to see full details
3. Update rate if changes needed

Returns: Complete rate configuration with all settings.

Related Tools: list_shipping_rates, update_shipping_rate, delete_shipping_rate`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone'),
          shippingRateId: z.string().describe('ID of the shipping rate to retrieve'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'update_shipping_rate',
        description: `Update a shipping rate's properties.

Modify existing shipping rates to adjust pricing or conditions.

Use Cases:
- Change shipping price ($9.99 → $12.99)
- Update rate name for clarity
- Adjust free shipping threshold ($50 → $75)
- Change condition type (FLAT → PRICE)
- Update rate description

What You Can Update:
- name: Change display name
- amount: Adjust shipping cost (in cents)
- currency: Change currency code
- conditionType: Modify when rate applies
- minCondition/maxCondition: Adjust thresholds
- description: Update customer-facing text

Examples:
- Price increase: {amount: 1299} (was 999)
- Free shipping change: {minCondition: 7500} (was 5000)
- Rename: {name: "Priority Mail"} (was "Express")

💡 Best Practices:
1. Get current rate configuration first
2. Modify only the fields you want to change
3. Test with get_available_shipping_rates
4. Communicate changes to customers

⚠️ Important:
- Provide only fields you want to update
- Amount always in cents
- Changes affect future orders immediately
- Existing orders keep original rates

Returns: Updated rate with new configuration.

Related Tools: get_shipping_rate, list_shipping_rates, delete_shipping_rate`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone'),
          shippingRateId: z.string().describe('ID of the shipping rate to update'),
          name: z.string().optional().describe('New rate name (optional)'),
          amount: z.number().min(0).optional().describe('New amount in cents (optional)'),
          currency: z.string().optional().describe('New currency code (optional)'),
          conditionType: z.enum(['PRICE', 'WEIGHT', 'FLAT']).optional().describe('New condition type (optional)'),
          minCondition: z.number().optional().describe('New minimum condition value (optional)'),
          maxCondition: z.number().optional().describe('New maximum condition value (optional)'),
          description: z.string().optional().describe('New description (optional)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_shipping_rate',
        description: `Delete a shipping rate.

⚠️ WARNING: This is PERMANENT and cannot be undone!

Use Cases:
- Remove discontinued shipping options
- Clean up test/duplicate rates
- Simplify shipping options
- Remove outdated pricing

What Gets Deleted:
- The shipping rate itself
- Rate name and pricing
- All condition settings
- Rate configuration

⚠️ Before Deleting:
1. Verify this is the correct rate (use get_shipping_rate)
2. Check if customers are using this rate
3. Ensure other rates are available for the zone
4. Consider updating instead of deleting
5. Have backup of rate configuration if needed

⚠️ Impact:
- Rate no longer available at checkout
- Customers in this zone need other rate options
- Existing orders with this rate are NOT affected
- Rate cannot be recovered after deletion
- Must recreate rate if deleted by mistake

Safer Alternative:
- Update rate to $0 and rename to "Discontinued"
- Keeps rate history intact
- Can be reactivated if needed

💡 Best Practice:
- Always have at least one rate per active zone
- Verify zone has other rates before deleting
- Communicate shipping changes to customers

Returns: Confirmation of deletion.

Related Tools: get_shipping_rate, list_shipping_rates, update_shipping_rate`,
        inputSchema: {
          shippingZoneId: z.string().describe('ID of the shipping zone'),
          shippingRateId: z.string().describe('ID of the shipping rate to permanently delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Shipping Carriers Tools
      {
        name: 'create_shipping_carrier',
        description: `Create a new shipping carrier for dynamic rate calculation.

⚠️ ADVANCED FEATURE: Integrates external shipping APIs for real-time rates.

Use Cases:
- Integrate with UPS, FedEx, USPS APIs
- Connect to custom shipping providers
- Calculate real-time shipping costs
- Offer live carrier rates at checkout
- Support multiple shipping services

How It Works:
1. Create carrier with callback URL
2. Define available services (Ground, Express, etc.)
3. GHL calls your URL with order details
4. Your API returns available rates
5. Rates displayed to customer at checkout

Callback URL Requirements:
- Must accept POST requests
- Receives order details (weight, destination, products)
- Returns JSON with available rates and costs
- Must respond within 5 seconds
- Should handle errors gracefully

Services Array:
- Each service represents a shipping option
- name: Customer-facing name ("Ground Shipping")
- value: Internal identifier ("ups_ground")
- Multiple services = multiple checkout options

Examples:
- UPS Integration: name="UPS", services=[{name:"Ground", value:"ups_ground"}, {name:"2-Day", value:"ups_2day"}]
- Custom API: name="My Carrier", callbackUrl="https://api.mysite.com/shipping"

💡 Best Practices:
- Test callback URL before creating carrier
- Implement caching to improve response times
- Handle API failures with fallback rates
- Log all requests for debugging
- Use HTTPS for security

Returns: Created carrier with ID and configuration.

Related Tools: list_shipping_carriers, update_shipping_carrier, get_available_shipping_rates`,
        inputSchema: {
          name: z.string().describe('Carrier name (e.g., "UPS", "FedEx", "Custom Carrier")'),
          callbackUrl: z.string().url().describe('HTTPS URL that receives rate requests and returns shipping options'),
          services: z.array(z.object({
            name: z.string().describe('Service display name (e.g., "Ground Shipping", "Express 2-Day")'),
            value: z.string().describe('Service identifier (e.g., "ups_ground", "fedex_express")')
          })).min(1).describe('Array of shipping services this carrier offers'),
          allowsMultipleServiceSelection: z.boolean().optional().describe('Allow customers to select multiple services (default: false)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'list_shipping_carriers',
        description: `List all shipping carriers for a location.

View all configured carrier integrations.

Use Cases:
- Audit carrier integrations
- Review callback URLs
- Check available services
- Find carrier IDs for updates
- Verify carrier configuration

What You Get:
- All configured carriers
- Carrier names and IDs
- Callback URLs
- Available services per carrier
- Service selection settings

Common Workflow:
1. List carriers to see all integrations
2. Test each carrier's callback URL
3. Update or remove non-working carriers

Returns: Array of all shipping carriers with their configurations.

Related Tools: get_shipping_carrier, create_shipping_carrier, update_shipping_carrier`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_shipping_carrier',
        description: `Get details of a specific shipping carrier.

Retrieve complete configuration for a carrier integration.

Use Cases:
- View carrier details before updating
- Check callback URL configuration
- Review available services
- Verify carrier settings
- Debug carrier integration issues

What You Get:
- Carrier ID and name
- Callback URL
- All configured services
- Service selection settings
- Creation and update timestamps

Common Workflow:
1. List carriers to find carrier ID
2. Get specific carrier to see full details
3. Test callback URL
4. Update carrier if needed

Returns: Complete carrier configuration with all services.

Related Tools: list_shipping_carriers, update_shipping_carrier, delete_shipping_carrier`,
        inputSchema: {
          shippingCarrierId: z.string().describe('ID of the shipping carrier to retrieve'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'update_shipping_carrier',
        description: `Update a shipping carrier's properties.

Modify existing carrier integrations.

Use Cases:
- Update callback URL
- Change carrier name
- Add/remove services
- Modify service selection settings
- Fix broken integrations

What You Can Update:
- name: Change carrier display name
- callbackUrl: Update API endpoint
- services: Add, remove, or modify services
- allowsMultipleServiceSelection: Change selection behavior

Examples:
- Update URL: {callbackUrl: "https://new-api.com/rates"}
- Add service: Get current services, add new one, update
- Rename: {name: "UPS Express"} (was "UPS")

💡 Best Practices:
1. Get current carrier configuration first
2. Test new callback URL before updating
3. Verify services still work after update
4. Update one property at a time for safety

⚠️ Important:
- Provide only fields you want to update
- Changes affect future rate calculations immediately
- Test thoroughly after updates
- Existing orders not affected

Returns: Updated carrier with new configuration.

Related Tools: get_shipping_carrier, list_shipping_carriers, delete_shipping_carrier`,
        inputSchema: {
          shippingCarrierId: z.string().describe('ID of the shipping carrier to update'),
          name: z.string().optional().describe('New carrier name (optional)'),
          callbackUrl: z.string().url().optional().describe('New callback URL (optional)'),
          services: z.array(z.object({
            name: z.string().describe('Service display name'),
            value: z.string().describe('Service identifier')
          })).min(1).optional().describe('Updated services array (REPLACES all existing services)'),
          allowsMultipleServiceSelection: z.boolean().optional().describe('Update service selection behavior (optional)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'delete_shipping_carrier',
        description: `Delete a shipping carrier.

⚠️ WARNING: This is PERMANENT and cannot be undone!

Use Cases:
- Remove discontinued carrier integrations
- Clean up broken/unused carriers
- Remove test carriers
- Simplify shipping options

What Gets Deleted:
- The carrier integration
- All configured services
- Callback URL configuration
- Carrier settings

⚠️ Before Deleting:
1. Verify this is the correct carrier (use get_shipping_carrier)
2. Check if carrier is actively used
3. Ensure other shipping options are available
4. Test checkout without this carrier
5. Have backup of carrier configuration

⚠️ Impact:
- Carrier rates no longer available at checkout
- Callback URL no longer called
- Customers won't see this carrier's services
- Existing orders with these rates NOT affected
- Cannot be recovered after deletion

Safer Alternative:
- Update carrier with disabled flag (if supported)
- Keep carrier but remove services temporarily
- Allows reactivation if needed

💡 Best Practice:
- Always have at least one shipping option available
- Test checkout after deletion
- Document why carrier was removed

Returns: Confirmation of deletion.

Related Tools: get_shipping_carrier, list_shipping_carriers, update_shipping_carrier`,
        inputSchema: {
          shippingCarrierId: z.string().describe('ID of the shipping carrier to permanently delete'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },

      // Store Settings Tools
      {
        name: 'create_store_setting',
        description: `Create or update store settings including shipping origin and notifications.

Configure essential store settings for e-commerce operations.

Use Cases:
- Set up shipping origin address
- Configure order notifications
- Update fulfillment notifications
- Set business address for shipping calculations
- Configure store contact information

Shipping Origin:
- Required for accurate shipping rate calculations
- Used as "ship from" address
- Affects carrier rate quotes
- Must be complete and accurate
- Should match your warehouse/business location

Notification Settings:
- storeOrderNotification: Email for new orders
- storeOrderFulfillmentNotification: Email for fulfillment updates
- Helps track orders and fulfillment
- Keeps team informed of store activity

Examples:
- Basic setup: shippingOrigin with complete address
- With notifications: Add email addresses for alerts
- Update address: Provide new shippingOrigin object

💡 Best Practices:
- Use accurate address for shipping calculations
- Verify address with carrier before setting
- Keep notification emails up to date
- Test with real orders after setup
- Update when warehouse/business moves

⚠️ Important:
- Shipping origin affects all rate calculations
- Inaccurate address = incorrect shipping costs
- Changes affect future orders immediately
- Existing orders not affected

Returns: Created/updated store settings.

Related Tools: get_store_setting, create_shipping_zone, create_shipping_rate`,
        inputSchema: {
          shippingOrigin: z.object({
            name: z.string().describe('Business/warehouse name'),
            street1: z.string().describe('Street address line 1'),
            street2: z.string().optional().describe('Street address line 2 (optional)'),
            city: z.string().describe('City name'),
            state: z.string().optional().describe('State/province code (e.g., "CA", "NY")'),
            zip: z.string().describe('Postal/ZIP code'),
            country: z.string().describe('Country code (2-letter ISO: "US", "CA", "GB")')
          }).describe('Shipping origin address (where orders ship from)'),
          storeOrderNotification: z.string().email().optional().describe('Email address for new order notifications (optional)'),
          storeOrderFulfillmentNotification: z.string().email().optional().describe('Email address for fulfillment notifications (optional)'),
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      },
      {
        name: 'get_store_setting',
        description: `Get current store settings.

Retrieve all configured store settings.

Use Cases:
- View shipping origin address
- Check notification email addresses
- Verify store configuration
- Audit store settings
- Get settings before updating

What You Get:
- Shipping origin address (complete)
- Order notification email
- Fulfillment notification email
- Store configuration details
- Creation and update timestamps

Common Workflow:
1. Get current settings
2. Review configuration
3. Update if needed
4. Verify changes

💡 Use Cases:
- Before creating shipping zones (need origin)
- Troubleshooting shipping rate issues
- Verifying notification setup
- Documenting store configuration

Returns: Complete store settings including shipping origin and notifications.

Related Tools: create_store_setting, create_shipping_zone, list_shipping_zones`,
        inputSchema: {
          locationId: z.string().optional().describe('Location ID (uses default if not provided)')
        }
      }
    ];
  }

  /**
   * Execute Store API tools
   */
  async executeStoreTool(toolName: string, params: any): Promise<StoreToolResult> {
    switch (toolName) {
      // Shipping Zones
      case 'create_shipping_zone':
        return this.createShippingZone(params);
      case 'list_shipping_zones':
        return this.listShippingZones(params);
      case 'get_shipping_zone':
        return this.getShippingZone(params);
      case 'update_shipping_zone':
        return this.updateShippingZone(params);
      case 'delete_shipping_zone':
        return this.deleteShippingZone(params);

      // Shipping Rates
      case 'get_available_shipping_rates':
        return this.getAvailableShippingRates(params);
      case 'create_shipping_rate':
        return this.createShippingRate(params);
      case 'list_shipping_rates':
        return this.listShippingRates(params);
      case 'get_shipping_rate':
        return this.getShippingRate(params);
      case 'update_shipping_rate':
        return this.updateShippingRate(params);
      case 'delete_shipping_rate':
        return this.deleteShippingRate(params);

      // Shipping Carriers
      case 'create_shipping_carrier':
        return this.createShippingCarrier(params);
      case 'list_shipping_carriers':
        return this.listShippingCarriers(params);
      case 'get_shipping_carrier':
        return this.getShippingCarrier(params);
      case 'update_shipping_carrier':
        return this.updateShippingCarrier(params);
      case 'delete_shipping_carrier':
        return this.deleteShippingCarrier(params);

      // Store Settings
      case 'create_store_setting':
        return this.createStoreSetting(params);
      case 'get_store_setting':
        return this.getStoreSetting(params);

      default:
        throw new Error(`Unknown Store tool: ${toolName}`);
    }
  }
} 