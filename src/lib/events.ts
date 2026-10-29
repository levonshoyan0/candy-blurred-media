/**
 * Analytics events the prototype emits (logged to the console as [analytics]).
 * They map to the 1-pager's metrics:
 * - Primary: locked-item conversion = upgrade_completed / paywall_shown (free)
 *                                     purchase_completed / packs_shown (Premium)
 * - Secondary: tap rate = locked_media_tapped / locked_media_shown
 * - North star: tokens spent = media_revealed.cost (+ automatic media sent unlocked)
 */
export type EventName =
  | 'locked_media_shown'
  | 'locked_media_tapped'
  | 'paywall_shown'
  | 'paywall_dismissed'
  | 'packs_shown'
  | 'packs_dismissed'
  | 'pack_selected'
  | 'checkout_started'
  | 'checkout_cancelled'
  | 'upgrade_completed'
  | 'purchase_completed'
  | 'media_generated'
  | 'media_revealed'
  | 'media_sent_unlocked'
  | 'legacy_deflection';

export const track = (name: EventName, props: Record<string, string | number | boolean> = {}) => {
  // eslint-disable-next-line no-console
  console.info('[analytics]', name, props);
};
