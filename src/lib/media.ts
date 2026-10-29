/** Candy.ai's automatic-media prices (chat → "What can she send you?"). */
export const PRICES = { photo: 2, video: 18 } as const; // video = 15s automatic
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
 * Decides the next automatic media item.
 *
 * - Free users have no automatic media today; they get one blurred photo (at most once a session).
 * - Premium users get what their settings allow, videos first (more value per unlock).
 *   If the balance covers it, it arrives unlocked and is charged, as today.
 *   If not, it arrives blurred instead of not at all.
 * - Nothing allowed → nothing is sent.
 */
export function decideMedia(user: UserType, settings: MediaSettings, balance: number): MediaDecision | null {
  if (user === 'free') return { type: 'photo', cost: PRICES.photo, locked: true };
  const type: MediaType | null = settings.videos ? 'video' : settings.photos ? 'photo' : null;
  if (!type) return null;
  const cost = PRICES[type];
  return { type, cost, locked: balance < cost };
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
