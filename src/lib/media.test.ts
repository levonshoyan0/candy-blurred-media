import { describe, expect, it } from 'vitest';
import { ASKED_PRICES, canReveal, decideMedia, DEFAULT_PACK, PREMIUM, PRICES, SHEET_PACKS } from './media';

const both = { photos: true, videos: true };
const none = { photos: false, videos: false };

describe('automatic media', () => {
  it('free users get one blurred video', () => {
    expect(decideMedia('free', none, 0)).toEqual({ type: 'video', cost: 18, locked: true });
  });

  it('premium with videos allowed gets a video; blurred when the balance is short', () => {
    expect(decideMedia('premium', both, 7)).toEqual({ type: 'video', cost: 18, locked: true });
    expect(decideMedia('premium', both, 18)).toEqual({ type: 'video', cost: 18, locked: false });
  });

  it('photos only → photo; blurred only below 2 tokens', () => {
    const photos = { photos: true, videos: false };
    expect(decideMedia('premium', photos, 1)).toEqual({ type: 'photo', cost: 2, locked: true });
    expect(decideMedia('premium', photos, 2)?.locked).toBe(false);
  });

  it('nothing allowed → nothing sent', () => {
    expect(decideMedia('premium', none, 0)).toBeNull();
  });
});

describe('requested media', () => {
  it('is always sent at the asked-for price, even with nothing allowed', () => {
    expect(decideMedia('premium', none, 100, 'photo')).toEqual({ type: 'photo', cost: 4, locked: false });
    expect(decideMedia('premium', none, 100, 'video')).toEqual({ type: 'video', cost: 30, locked: false });
  });

  it('is blurred for free users and for short balances', () => {
    expect(decideMedia('free', none, 0, 'photo')?.locked).toBe(true);
    expect(decideMedia('premium', both, 29, 'video')?.locked).toBe(true);
  });
});

describe('reveal rules', () => {
  it('never reveals when the balance is short', () => {
    expect(canReveal(17, PRICES.video)).toBe(false);
    expect(canReveal(18, PRICES.video)).toBe(true);
  });

  it('every pack on the sheet, and Premium, covers any single item', () => {
    for (const p of SHEET_PACKS) expect(canReveal(p.tokens, ASKED_PRICES.video)).toBe(true);
    expect(canReveal(PREMIUM.tokens, ASKED_PRICES.video)).toBe(true);
  });

  it('preselects the middle pack', () => {
    expect(DEFAULT_PACK.tokens).toBe(350);
  });
});
