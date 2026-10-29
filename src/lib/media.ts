/** Candy.ai's media prices: automatic (she sends on her own) vs asked for in chat. 15s videos. */
export const PRICES = { photo: 2, video: 18 } as const;
export const ASKED_PRICES = { photo: 4, video: 30 } as const;
export type MediaType = keyof typeof PRICES;

export type UserType = 'free' | 'premium';

export interface MediaSettings {
  photos: boolean;
  videos: boolean;
}

/** What the character sends at the next media moment, and in what state. */
export interface MediaDecision {
  type: MediaType;
  cost: number;
  /** true = arrives as a blurred placeholder with an "Unlock" button */
  locked: boolean;
}

/**
 * Decides what the character sends.
 *
 * - `request` = the user asked for a photo or video: it's always sent, at the asked-for price.
 * - No request = automatic media:
 *   - free users have none today; they get one blurred video (more value per unlock than a photo).
 *   - Premium users get what their settings allow, videos first. Nothing allowed → nothing sent.
 * - Free users always get it blurred. Premium users get it blurred only when the balance can't cover it;
 *   otherwise it arrives unlocked and is charged, as today.
 */
export function decideMedia(user: UserType, settings: MediaSettings, balance: number, request?: MediaType): MediaDecision | null {
  let type: MediaType | null;
  let cost: number;
  if (request) {
    type = request;
    cost = ASKED_PRICES[request];
  } else {
    type = user === 'free' ? 'video' : settings.videos ? 'video' : settings.photos ? 'photo' : null;
    if (!type) return null;
    cost = PRICES[type];
  }
  return { type, cost, locked: user === 'free' || balance < cost };
}

/** Media is only generated and revealed when the balance covers its price. */
export const canReveal = (balance: number, cost: number) => balance >= cost;

export interface Pack {
  tokens: number;
  price: number; // USD
  bonus?: number; // percent
}

/** Candy.ai's regular token store. */
export const PACKS: Pack[] = [
  { tokens: 100, price: 9.99 },
  { tokens: 350, price: 34.99 },
  { tokens: 550, price: 49.99, bonus: 10 },
  { tokens: 1150, price: 99.99, bonus: 15 },
  { tokens: 2400, price: 199.99, bonus: 20 },
  { tokens: 3750, price: 299.99, bonus: 25 },
];

/** The "Not Enough Tokens!" sheet shows three packs first, middle one preselected (as on Candy.ai). */
export const SHEET_PACKS = PACKS.slice(0, 3);
export const DEFAULT_PACK = SHEET_PACKS[1];

/** Premium monthly: what a free user gets after upgrading. */
export const PREMIUM = { price: 13.99, tokens: 100 } as const;

export const formatPrice = (usd: number) => `$${usd.toFixed(2)}`;
export const formatTokens = (n: number) => n.toLocaleString('en-US');
