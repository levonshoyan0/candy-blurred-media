import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './characters';
import { ChatScreen, type Message } from './components/ChatScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { Controls, type Flow } from './components/Controls';
import { PacksSheet } from './components/PacksSheet';
import { PaywallModal } from './components/PaywallModal';
import { track } from './lib/events';
import { canReveal, decideMedia, formatTokens, PREMIUM, type MediaSettings, type Pack, type UserType } from './lib/media';

const START_BALANCE = 7; // as in the reference screenshots
const GEN_MS = 1400; // media is generated only after payment

type Overlay = null | { kind: 'paywall'; id: number } | { kind: 'packs'; id: number };
type Checkout = null | { kind: 'premium'; id: number } | { kind: 'pack'; id: number; pack: Pack };

let nextId = 1;
const id = () => nextId++;

const HISTORY: Record<UserType, Message[]> = {
  free: [{ id: id(), kind: 'text', from: 'her', text: 'I noticed you checking me out. Mind if I join you for a bit?', time: 'Fri, Oct 16, 3:52PM' }],
  premium: [
    { id: id(), kind: 'text', from: 'her', text: 'hey you, I was just thinking about you 😊', time: '9:53AM' },
    { id: id(), kind: 'text', from: 'me', text: 'oh yeah? what about me?', time: '9:54AM' },
    { id: id(), kind: 'text', from: 'her', text: 'that’s a secret… for now 😏', time: '9:54AM' },
  ],
};

/** The one message the reviewer sends, and the character's reply, per user and flow. */
const SCRIPT: Record<UserType, Record<Flow, { ask: string; reply: string[] }>> = {
  free: {
    new: { ask: 'what are you up to tonight?', reply: ['lying in bed, kinda bored…', 'took something just for you 😏'] },
    legacy: { ask: 'Hiii, can you send me a photo?', reply: ['ugh i wish i could!', 'my camera is acting up though', 'so tell me about yourself instead?'] },
  },
  premium: {
    new: { ask: 'what are you up to tonight?', reply: ['just got out of the shower…', 'made something just for you 😏'] },
    legacy: { ask: 'send me a video', reply: ['i literally cannot', 'it’s just not an option here'] },
  },
};
const NOTHING_ALLOWED = ['mmm, nothing much… tell me about your day?'];

const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');

export default function App() {
  const [user, setUser] = useState<UserType>('free');
  const [flow, setFlow] = useState<Flow>('new');
  const [manualBalance, setManualBalance] = useState(START_BALANCE);
  const [settings, setSettings] = useState<MediaSettings>({ photos: true, videos: true });

  const [isPremium, setIsPremium] = useState(false); // runtime: a free user can upgrade during the demo
  const [balance, setBalance] = useState(0);
  const [messages, setMessages] = useState<Message[]>(HISTORY.free);
  const [sent, setSent] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [checkout, setCheckout] = useState<Checkout>(null);

  // Timers are cleared on reset so a stale reply never lands in a new scenario.
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  const balanceRef = useRef(balance);
  balanceRef.current = balance;

  const reset = useCallback(
    (next: { user?: UserType; flow?: Flow; balance?: number } = {}) => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
      const u = next.user ?? user;
      setUser(u);
      if (next.flow) setFlow(next.flow);
      setIsPremium(u === 'premium');
      setBalance(u === 'premium' ? (next.balance ?? manualBalance) : 0);
      setMessages(HISTORY[u]);
      setSent(false);
      setOverlay(null);
      setCheckout(null);
    },
    [user, manualBalance],
  );
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const character = CHARACTERS[user];
  const script = SCRIPT[user][flow];

  const patchMedia = (mid: number, patch: Partial<Extract<Message, { kind: 'media' }>>) =>
    setMessages((ms) => ms.map((m) => (m.id === mid && m.kind === 'media' ? { ...m, ...patch } : m)));

  const send = () => {
    if (sent) return;
    setSent(true);
    setMessages((ms) => [...ms, { id: id(), kind: 'text', from: 'me', text: script.ask, time: now() }]);
    const typing = id();
    later(() => setMessages((ms) => [...ms, { id: typing, kind: 'typing' }]), 400);

    // What the character sends after the text replies.
    const decision = flow === 'new' || user === 'premium' ? decideMedia(isPremium ? 'premium' : 'free', settings, balanceRef.current) : null;
    let reply = script.reply;
    let media = decision;
    if (flow === 'legacy') {
      // Today: free users get nothing; Premium users get the video only if the balance covers it.
      media = decision && !decision.locked && user === 'premium' ? decision : null;
      if (media) reply = ['here you go 😘'];
      else track('legacy_deflection', { user });
    } else if (!decision) reply = NOTHING_ALLOWED;

    reply.forEach((text, i) =>
      later(() => {
        setMessages((ms) => {
          const rest = ms.filter((m) => m.id !== typing);
          const out: Message[] = [...rest, { id: id(), kind: 'text', from: 'her', text, time: now() }];
          if (i < reply.length - 1 || media) out.push({ id: typing, kind: 'typing' });
          return out;
        });
      }, 1300 + i * 900),
    );

    if (media) {
      const m = media;
      const mid = id();
      later(() => {
        setMessages((ms) => [
          ...ms.filter((x) => x.id !== typing),
          { id: mid, kind: 'media', media: m.type, cost: m.cost, state: m.locked ? 'locked' : 'generating' },
        ]);
        if (m.locked) track('locked_media_shown', { user: isPremium ? 'premium' : 'free', media: m.type, cost: m.cost, balance: balanceRef.current });
        else later(() => reveal(mid, m.cost, true), GEN_MS);
      }, 1300 + reply.length * 900);
    }
  };

  /** Generates and reveals the media, charging its tokens. Guarded: nothing is revealed unless the balance covers it. */
  const reveal = (mid: number, cost: number, auto = false) => {
    if (!canReveal(balanceRef.current, cost)) return false;
    setBalance((b) => b - cost);
    balanceRef.current -= cost;
    patchMedia(mid, { state: 'revealed' });
    track(auto ? 'media_sent_unlocked' : 'media_revealed', { cost, balance: balanceRef.current });
    return true;
  };

  const generateThenReveal = (mid: number) => {
    const m = messages.find((x) => x.id === mid);
    const cost = m && m.kind === 'media' ? m.cost : 0;
    patchMedia(mid, { state: 'generating' });
    track('media_generated', { cost });
    later(() => {
      if (!reveal(mid, cost)) patchMedia(mid, { state: 'locked' });
    }, GEN_MS);
  };

  const unlock = (mid: number) => {
    const m = messages.find((x) => x.id === mid);
    if (!m || m.kind !== 'media') return;
    track('locked_media_tapped', { media: m.media, cost: m.cost });
    if (isPremium && canReveal(balanceRef.current, m.cost)) return generateThenReveal(mid); // topped up elsewhere
    if (!isPremium) {
      track('paywall_shown', { media: m.media });
      setOverlay({ kind: 'paywall', id: mid });
    } else {
      track('packs_shown', { media: m.media, balance: balanceRef.current, cost: m.cost });
      setOverlay({ kind: 'packs', id: mid });
    }
  };

  const pay = () => {
    if (!checkout) return;
    if (checkout.kind === 'premium') {
      setIsPremium(true);
      setBalance((b) => b + PREMIUM.tokens);
      balanceRef.current += PREMIUM.tokens;
      track('upgrade_completed', { price: PREMIUM.price, tokens: PREMIUM.tokens });
    } else {
      setBalance((b) => b + checkout.pack.tokens);
      balanceRef.current += checkout.pack.tokens;
      track('purchase_completed', { tokens: checkout.pack.tokens, price: checkout.pack.price });
    }
    const mid = checkout.id;
    setCheckout(null);
    setOverlay(null);
    generateThenReveal(mid);
  };

  const lockedItem = overlay ? messages.find((m) => m.id === overlay.id) : undefined;
  const what = lockedItem && lockedItem.kind === 'media' && lockedItem.media === 'video' ? `${character.name}'s video` : `${character.name}'s photo`;

  return (
    <div className="layout">
      <aside className="sidebar">
        <Controls
          user={user}
          flow={flow}
          isPremiumNow={isPremium}
          balance={balance}
          settings={settings}
          onUser={(u) => reset({ user: u })}
          onFlow={(f) => reset({ flow: f })}
          onBalance={(n) => {
            setBalance(n);
            balanceRef.current = n;
            if (user === 'premium') setManualBalance(n);
          }}
          onSettings={setSettings}
          onReset={() => reset()}
        />
      </aside>
      <main className="stage">
        <div className="phone">
          {checkout ? (
            <CheckoutScreen
              item={checkout.kind === 'premium' ? `Premium · monthly (${PREMIUM.tokens} tokens)` : `${formatTokens(checkout.pack.tokens)} tokens`}
              price={checkout.kind === 'premium' ? PREMIUM.price : checkout.pack.price}
              onPay={pay}
              onCancel={() => {
                track('checkout_cancelled', { kind: checkout.kind });
                setCheckout(null);
                setOverlay(null);
              }}
            />
          ) : (
            <ChatScreen
              character={character}
              showUpgradeBanner={!isPremium}
              messages={messages}
              suggestion={sent ? null : script.ask}
              showTip={!sent}
              onSend={send}
              onUnlock={unlock}
            >
              {overlay?.kind === 'paywall' && (
                <PaywallModal
                  character={character}
                  onClose={() => {
                    track('paywall_dismissed');
                    setOverlay(null);
                  }}
                  onUpgrade={() => {
                    track('checkout_started', { kind: 'premium', price: PREMIUM.price });
                    setCheckout({ kind: 'premium', id: overlay.id });
                  }}
                />
              )}
              {overlay?.kind === 'packs' && (
                <PacksSheet
                  what={what}
                  onClose={() => {
                    track('packs_dismissed');
                    setOverlay(null);
                  }}
                  onBuy={(p) => {
                    track('pack_selected', { tokens: p.tokens, price: p.price });
                    track('checkout_started', { kind: 'pack', price: p.price });
                    setCheckout({ kind: 'pack', id: overlay.id, pack: p });
                  }}
                />
              )}
            </ChatScreen>
          )}
        </div>
      </main>
    </div>
  );
}
