import type { Character } from '../characters';
import { PREMIUM } from '../lib/media';
import * as I from './Icons';

/** Candy.ai's Premium paywall (same layout as "Upgrade to Unlock AI Phone Call"), reworded for media. */
export function PaywallModal({ character, onUpgrade, onClose }: { character: Character; onUpgrade: () => void; onClose: () => void }) {
  const perks = [
    `${character.name} sends you photos & videos on her own`,
    `${PREMIUM.tokens} tokens every month`,
    'Unlimited text messages',
    'AI Live Phone Call',
    'and more…',
  ];
  return (
    <div className="overlay center blur">
      <div className="paywall" role="dialog" aria-label="Upgrade to Premium">
        <button className="pw-x" onClick={onClose} aria-label="Close">
          <I.Close />
        </button>
        <div className="pw-cards">
          <span className="pw-back" />
          <img src={character.paywall} alt="" />
        </div>
        <div className="pw-t1">Upgrade to Unlock</div>
        <div className="pw-t2">Photos, videos &amp; voice notes from {character.name}</div>
        <div className="pw-sub">With subscription you get access to:</div>
        <ul className="pw-list">
          {perks.map((p) => (
            <li key={p}>
              <span className="chk">✓</span>
              {p}
            </li>
          ))}
        </ul>
        <button className="pw-btn" onClick={onUpgrade}>
          <I.Diamond /> Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
