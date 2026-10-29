import { describe, expect, it } from 'vitest';
import { canReveal, decideMedia, DEFAULT_PACK, PREMIUM, PRICES, SHEET_PACKS } from './media';

const both = { photos: true, videos: true };

describe('decideMedia', () => {
  it('free users always get one blurred photo', () => {
    expect(decideMedia('free', both, 0)).toEqual({ type: 'photo', cost: 2, locked: true });
    expect(decideMedia('free', { photos: false, videos: false }, 0)?.locked).toBe(true);
  });

  it('premium with videos allowed gets a video; blurred when the balance is short', () => {
    expect(decideMedia('premium', both, 7)).toEqual({ type: 'video', cost: 18, locked: true });
    expect(decideMedia('premium', both, 17)?.locked).toBe(true);
  });

  it('premium with enough tokens gets it unlocked, as today', () => {
    expect(decideMedia('premium', both, 18)).toEqual({ type: 'video', cost: 18, locked: false });
  });

  it('photos only → photo; blurred only below 2 tokens', () => {
    const photos = { photos: true, videos: false };
    expect(decideMedia('premium', photos, 1)).toEqual({ type: 'photo', cost: 2, locked: true });
    expect(decideMedia('premium', photos, 2)?.locked).toBe(false);
  });

  it('nothing allowed → nothing sent', () => {
    expect(decideMedia('premium', { photos: false, videos: false }, 0)).toBeNull();
  });
});

describe('reveal rules', () => {
  it('never reveals when the balance is short', () => {
    expect(canReveal(17, PRICES.video)).toBe(false);
    expect(canReveal(18, PRICES.video)).toBe(true);
  });

  it('every pack on the sheet, and Premium, covers any single item', () => {
    for (const p of SHEET_PACKS) expect(canReveal(p.tokens, PRICES.video)).toBe(true);
    expect(canReveal(PREMIUM.tokens, PRICES.photo)).toBe(true);
  });

  it('preselects the middle pack', () => {
    expect(DEFAULT_PACK.tokens).toBe(350);
  });
});
