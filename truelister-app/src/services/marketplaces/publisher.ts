import { CatalogItem } from '../../types';
import { MarketplaceId, ListingResult, MarketplaceCredentials } from './types';
import { loadCredentials } from './credentialsStore';

// ── Shared Helpers ───────────────────────────────────────────────────────────

function buildTitle(item: CatalogItem): string {
  const parts = [
    item.designerBrand,
    item.title,
    item.size ? `Size ${item.size}` : '',
    item.color,
  ].filter(Boolean);
  return parts.join(' ').slice(0, 80); // Most platforms cap at 80 chars
}

function buildDescription(item: CatalogItem): string {
  const lines: string[] = [];
  if (item.title) lines.push(item.title);
  if (item.designerBrand) lines.push(`Brand: ${item.designerBrand}`);
  if (item.size) lines.push(`Size: ${item.size}`);
  if (item.color) lines.push(`Color: ${item.color}`);
  if (item.fabricMaterial) lines.push(`Material: ${item.fabricMaterial}`);
  if (item.condition) lines.push(`Condition: ${item.condition}`);
  if (item.measurements) lines.push(`Measurements: ${item.measurements}`);
  if (item.notes) lines.push(`\nNotes: ${item.notes}`);
  lines.push('\nListed with TrueLister');
  return lines.join('\n');
}

// ── eBay Publisher ───────────────────────────────────────────────────────────

async function publishToEbay(
  item: CatalogItem,
  creds: MarketplaceCredentials
): Promise<ListingResult> {
  if (!creds.userToken || !creds.clientId) {
    return {
      marketplace: 'ebay',
      success: false,
      error: 'eBay credentials not configured. Add your Client ID and User Token in Settings → Marketplaces.',
    };
  }

  try {
    const body = {
      product: {
        title: buildTitle(item),
        description: buildDescription(item),
        aspects: {
          Brand: [item.designerBrand ?? 'Unbranded'],
          Size: [item.size ?? 'One Size'],
          Color: [item.color ?? 'See Photos'],
          Material: [item.fabricMaterial ?? 'See Label'],
          Condition: [item.condition ?? 'Pre-owned'],
        },
      },
      condition: 'USED_EXCELLENT',
      categoryId: '11450', // Women's Clothing — update as needed
      listingPolicies: {
        fulfillmentPolicyId: '',
        paymentPolicyId: '',
        returnPolicyId: '',
      },
      pricingSummary: {
        price: {
          value: item.price?.toString() ?? '0.00',
          currency: 'USD',
        },
      },
      merchantLocationKey: 'default',
    };

    const response = await fetch(
      'https://api.ebay.com/sell/inventory/v1/inventory_item/' + (item.itemNumber ?? Date.now()),
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${creds.userToken}`,
          'Content-Type': 'application/json',
          'Content-Language': 'en-US',
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok || response.status === 204) {
      return {
        marketplace: 'ebay',
        success: true,
        listingId: item.itemNumber?.toString(),
        listingUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(buildTitle(item))}`,
      };
    }

    const error = await response.json().catch(() => ({ message: response.statusText }));
    return {
      marketplace: 'ebay',
      success: false,
      error: `eBay API error ${response.status}: ${error?.errors?.[0]?.message ?? response.statusText}`,
    };
  } catch (err: any) {
    return { marketplace: 'ebay', success: false, error: err.message };
  }
}

// ── Etsy Publisher ───────────────────────────────────────────────────────────

async function publishToEtsy(
  item: CatalogItem,
  creds: MarketplaceCredentials
): Promise<ListingResult> {
  if (!creds.accessToken || !creds.shopId) {
    return {
      marketplace: 'etsy',
      success: false,
      error: 'Etsy credentials not configured. Add your Access Token and Shop ID in Settings → Marketplaces.',
    };
  }

  try {
    const body = {
      title: buildTitle(item),
      description: buildDescription(item),
      price: parseFloat(item.price?.toString() ?? '0'),
      quantity: 1,
      who_made: 'someone_else',
      when_made: 'made_to_order',
      is_supply: false,
      state: 'draft', // Creates as draft — seller reviews before activating
      taxonomy_id: 69150731, // Women's Clothing
      tags: [
        item.designerBrand,
        item.size,
        item.color,
        item.fabricMaterial,
        'vintage',
        'secondhand',
      ].filter(Boolean).slice(0, 13) as string[],
    };

    const response = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${creds.shopId}/listings`,
      {
        method: 'POST',
        headers: {
          'x-api-key': creds.apiKey ?? '',
          'Authorization': `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();

    if (response.ok && result.listing_id) {
      return {
        marketplace: 'etsy',
        success: true,
        listingId: result.listing_id.toString(),
        listingUrl: `https://www.etsy.com/listing/${result.listing_id}`,
      };
    }

    return {
      marketplace: 'etsy',
      success: false,
      error: `Etsy API error ${response.status}: ${result?.error ?? response.statusText}`,
    };
  } catch (err: any) {
    return { marketplace: 'etsy', success: false, error: err.message };
  }
}

// ── Depop Publisher ──────────────────────────────────────────────────────────

async function publishToDepop(
  item: CatalogItem,
  creds: MarketplaceCredentials
): Promise<ListingResult> {
  if (!creds.accessToken) {
    return {
      marketplace: 'depop',
      success: false,
      error: 'Depop credentials not configured. Add your Access Token in Settings → Marketplaces.',
    };
  }

  try {
    const body = {
      description: buildDescription(item),
      price: parseFloat(item.price?.toString() ?? '0'),
      quantity: 1,
      status: 'draft',
      brand: item.designerBrand ?? '',
      size: item.size ?? '',
      colour: item.color ?? '',
    };

    const response = await fetch('https://api.depop.com/v1/products/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${creds.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok && result.id) {
      return {
        marketplace: 'depop',
        success: true,
        listingId: result.id.toString(),
        listingUrl: `https://www.depop.com/products/${result.id}`,
      };
    }

    return {
      marketplace: 'depop',
      success: false,
      error: `Depop API error ${response.status}: ${result?.message ?? response.statusText}`,
    };
  } catch (err: any) {
    return { marketplace: 'depop', success: false, error: err.message };
  }
}

// ── No-API Platforms ─────────────────────────────────────────────────────────

function noApiResult(marketplace: MarketplaceId, name: string): ListingResult {
  return {
    marketplace,
    success: false,
    error: `${name} does not have a public listing API. Use a cross-listing service (Vendoo, List Perfectly) or list manually. Your item data is ready to copy from the form.`,
  };
}

// ── Main Publisher ───────────────────────────────────────────────────────────

/**
 * Publish a catalog item to one or more marketplaces.
 * Returns a result for each selected marketplace.
 */
export async function publishToMarketplaces(
  item: CatalogItem,
  selectedMarketplaces: MarketplaceId[]
): Promise<ListingResult[]> {
  const results: ListingResult[] = [];

  for (const id of selectedMarketplaces) {
    switch (id) {
      case 'ebay': {
        const creds = await loadCredentials('ebay', ['clientId', 'clientSecret', 'userToken']);
        results.push(await publishToEbay(item, creds));
        break;
      }
      case 'etsy': {
        const creds = await loadCredentials('etsy', ['apiKey', 'accessToken', 'shopId']);
        results.push(await publishToEtsy(item, creds));
        break;
      }
      case 'depop': {
        const creds = await loadCredentials('depop', ['clientId', 'clientSecret', 'accessToken']);
        results.push(await publishToDepop(item, creds));
        break;
      }
      case 'poshmark':
        results.push(noApiResult('poshmark', 'Poshmark'));
        break;
      case 'mercari':
        results.push(noApiResult('mercari', 'Mercari'));
        break;
      case 'facebook':
        results.push(noApiResult('facebook', 'Facebook Marketplace'));
        break;
    }
  }

  return results;
}
