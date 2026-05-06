/**
 * Marketplace Integration Types
 *
 * API Status per platform:
 *
 * eBay        — Official REST Sell API (OAuth 2.0). Free developer account.
 *               Docs: https://developer.ebay.com/develop/guides-v2/get-started-with-ebay-apis
 *
 * Etsy        — Official Open API v3 (OAuth 2.0). Free API key on request.
 *               Docs: https://developers.etsy.com/documentation/tutorials/listings
 *
 * Depop       — Official Partner Sell API (OAuth 2.0). Apply for partner access.
 *               Docs: https://partnerapi.depop.com/api-docs/
 *
 * Poshmark    — No official public listing API. Credential fields provided for
 *               future use when/if Poshmark opens their API, or for use with
 *               approved third-party cross-listing partners (e.g. Vendoo, List Perfectly).
 *
 * Mercari     — No official public listing API as of 2025. Credential fields
 *               provided for future use or approved partner integrations.
 *
 * Facebook    — Marketplace has no public listing API. Fields provided for
 *               manual reference / future integration.
 */

export type MarketplaceId =
  | 'ebay'
  | 'etsy'
  | 'depop'
  | 'poshmark'
  | 'mercari'
  | 'facebook';

export interface MarketplaceMeta {
  id: MarketplaceId;
  name: string;
  color: string;
  apiStatus: 'official' | 'partner_only' | 'no_api';
  apiStatusLabel: string;
  docsUrl: string;
  credentialFields: CredentialField[];
}

export interface CredentialField {
  key: string;
  label: string;
  placeholder: string;
  secure: boolean;
  hint?: string;
}

export interface MarketplaceCredentials {
  [key: string]: string;
}

export interface AllMarketplaceCredentials {
  ebay: MarketplaceCredentials;
  etsy: MarketplaceCredentials;
  depop: MarketplaceCredentials;
  poshmark: MarketplaceCredentials;
  mercari: MarketplaceCredentials;
  facebook: MarketplaceCredentials;
}

export interface ListingResult {
  marketplace: MarketplaceId;
  success: boolean;
  listingId?: string;
  listingUrl?: string;
  error?: string;
}

// ── Marketplace Metadata ─────────────────────────────────────────────────────

export const MARKETPLACES: MarketplaceMeta[] = [
  {
    id: 'ebay',
    name: 'eBay',
    color: '#e53238',
    apiStatus: 'official',
    apiStatusLabel: 'Official REST API',
    docsUrl: 'https://developer.ebay.com/develop/guides-v2/get-started-with-ebay-apis',
    credentialFields: [
      {
        key: 'clientId',
        label: 'Client ID (App ID)',
        placeholder: 'YourApp-12345-Prod-abc...',
        secure: false,
        hint: 'From your eBay Developer account → Application Keys',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret (Cert ID)',
        placeholder: 'PRD-abc123...',
        secure: true,
        hint: 'From your eBay Developer account → Application Keys',
      },
      {
        key: 'userToken',
        label: 'OAuth User Token',
        placeholder: 'v^1.1#i^1#r^1#p^3...',
        secure: true,
        hint: 'Generated after completing the OAuth flow for your seller account',
      },
    ],
  },
  {
    id: 'etsy',
    name: 'Etsy',
    color: '#f56400',
    apiStatus: 'official',
    apiStatusLabel: 'Official Open API v3',
    docsUrl: 'https://developers.etsy.com/documentation/tutorials/listings',
    credentialFields: [
      {
        key: 'apiKey',
        label: 'API Key (Keystring)',
        placeholder: 'xxxxxxxxxxxxxxxxxxxxxxxx',
        secure: false,
        hint: 'From Etsy Developer portal → Your Apps → API Key',
      },
      {
        key: 'accessToken',
        label: 'OAuth Access Token',
        placeholder: 'xxxxxxxxxxxxxxxxxxx',
        secure: true,
        hint: 'Generated after completing the OAuth 2.0 flow with listings_w scope',
      },
      {
        key: 'shopId',
        label: 'Shop ID',
        placeholder: '12345678',
        secure: false,
        hint: 'Your numeric Etsy shop ID — found in your shop URL',
      },
    ],
  },
  {
    id: 'depop',
    name: 'Depop',
    color: '#ff2300',
    apiStatus: 'partner_only',
    apiStatusLabel: 'Partner API (Apply for Access)',
    docsUrl: 'https://partnerapi.depop.com/api-docs/',
    credentialFields: [
      {
        key: 'clientId',
        label: 'Client ID',
        placeholder: 'depop_client_id',
        secure: false,
        hint: 'Issued after Depop approves your partner API application',
      },
      {
        key: 'clientSecret',
        label: 'Client Secret',
        placeholder: 'depop_client_secret',
        secure: true,
        hint: 'Issued after Depop approves your partner API application',
      },
      {
        key: 'accessToken',
        label: 'OAuth Access Token',
        placeholder: 'Bearer ...',
        secure: true,
        hint: 'Generated after completing the OAuth flow for your seller account',
      },
    ],
  },
  {
    id: 'poshmark',
    name: 'Poshmark',
    color: '#7b2d8b',
    apiStatus: 'no_api',
    apiStatusLabel: 'No Public API — Use Cross-Lister',
    docsUrl: 'https://poshmark.com',
    credentialFields: [
      {
        key: 'email',
        label: 'Poshmark Email',
        placeholder: 'you@email.com',
        secure: false,
        hint: 'Used with approved cross-listing tools (Vendoo, List Perfectly, etc.)',
      },
      {
        key: 'partnerApiKey',
        label: 'Cross-Lister API Key (optional)',
        placeholder: 'vendoo_key or listperfectly_key',
        secure: true,
        hint: 'If using a third-party cross-listing service that supports Poshmark',
      },
    ],
  },
  {
    id: 'mercari',
    name: 'Mercari',
    color: '#ff0211',
    apiStatus: 'no_api',
    apiStatusLabel: 'No Public API — Use Cross-Lister',
    docsUrl: 'https://mercari.com',
    credentialFields: [
      {
        key: 'email',
        label: 'Mercari Email',
        placeholder: 'you@email.com',
        secure: false,
        hint: 'Used with approved cross-listing tools that support Mercari',
      },
      {
        key: 'partnerApiKey',
        label: 'Cross-Lister API Key (optional)',
        placeholder: 'vendoo_key or listperfectly_key',
        secure: true,
        hint: 'If using a third-party cross-listing service that supports Mercari',
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook Marketplace',
    color: '#1877f2',
    apiStatus: 'no_api',
    apiStatusLabel: 'No Public API',
    docsUrl: 'https://facebook.com/marketplace',
    credentialFields: [
      {
        key: 'pageId',
        label: 'Facebook Page ID (optional)',
        placeholder: '123456789',
        secure: false,
        hint: 'For future integration if Facebook opens Marketplace API access',
      },
    ],
  },
];
