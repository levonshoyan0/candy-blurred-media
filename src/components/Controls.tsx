import { useEffect, useState } from 'react';
import type { MediaSettings, UserType } from '../lib/media';
import { PRICES } from '../lib/media';

export type Flow = 'new' | 'legacy';

interface Props {
  user: UserType;
  flow: Flow;
  isPremiumNow: boolean; // a free user who upgraded during the demo
  balance: number;
  settings: MediaSettings;
  onUser: (u: UserType) => void;
  onFlow: (f: Flow) => void;
  onBalance: (n: number) => void;
  onSettings: (s: MediaSettings) => void;
  onReset: () => void;
}

const LEDE: Record<UserType, Record<Flow, string>> = {
  free: {
    new: 'Megan sends a blurred photo. "Unlock" opens the Premium paywall; after upgrading, the photo is generated and revealed.',
    legacy: "Free users get no automatic media. Ask Megan for a photo and see today's reply.",
  },
  premium: {
    new: "Megan's automatic video arrives blurred when the balance can't cover it. \"Unlock\" opens the token packs; after paying, the video is generated and revealed.",
    legacy: "With too few tokens, Megan sends nothing. Ask her for a video and see today's reply.",
  },
};

export function Controls({ user, flow, isPremiumNow, balance, settings, onUser, onFlow, onBalance, onSettings, onReset }: Props) {
  // Local text state so the field can be cleared while typing; valid numbers apply immediately.
  const [text, setText] = useState(String(balance));
  useEffect(() => setText(String(balance)), [balance]);

  return (
    <section className="panel controls">
      <div className="eyebrow">Prototype · Candy.ai</div>
      <h1>Blurred media in chats</h1>
      <p className="lede">{LEDE[user][flow]}</p>

      <div className="group">
        <div className="gl">Flow</div>
        <div className="seg">
          <button className={flow === 'new' ? 'on' : ''} onClick={() => onFlow('new')}>
            Suggested
          </button>
          <button className={flow === 'legacy' ? 'on' : ''} onClick={() => onFlow('legacy')}>
            Current
          </button>
        </div>
      </div>

      <div className="group">
        <div className="gl">User</div>
        <div className="seg">
          <button className={user === 'free' ? 'on' : ''} onClick={() => onUser('free')}>
            Free user
            <small>No tokens</small>
          </button>
          <button className={user === 'premium' ? 'on' : ''} onClick={() => onUser('premium')}>
            Premium user
            <small>Low balance</small>
          </button>
        </div>
      </div>

      {isPremiumNow ? (
        <div className="group">
          <label className="balance-card">
            <span>User's token balance</span>
            <span className="balance-edit">
              <span className="coin s" />
              <input
                className="balance-val"
                inputMode="numeric"
                value={text}
                aria-label="User's token balance"
                onChange={(e) => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                  setText(v);
                  if (v !== '') onBalance(Number(v));
                }}
                onBlur={() => setText(String(balance))}
              />
            </span>
          </label>
          {user === 'premium' && (
            <>
              <div className="gl" style={{ marginTop: 14 }}>
                What can Megan send you?
              </div>
              <div className="toggles">
                <label className="tgl">
                  <span>
                    Photos <small>{PRICES.photo} tk</small>
                  </span>
                  <input type="checkbox" checked={settings.photos} onChange={(e) => onSettings({ ...settings, photos: e.target.checked })} />
                  <i />
                </label>
                <label className="tgl">
                  <span>
                    Videos <small>{PRICES.video} tk · 15s</small>
                  </span>
                  <input type="checkbox" checked={settings.videos} onChange={(e) => onSettings({ ...settings, videos: e.target.checked })} />
                  <i />
                </label>
              </div>
              <div className="hint">
                Videos are sent first when allowed. With {PRICES.video}+ tokens the video arrives unlocked and is charged, as today.
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="group">
          <div className="balance-card">
            <span>User's token balance</span>
            <span className="q">0 · free user</span>
          </div>
        </div>
      )}

      <button className="reset" onClick={onReset}>
        ↺ Reset demo
      </button>
    </section>
  );
}
