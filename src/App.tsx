import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS } from './characters';
import { ChatScreen, type Message } from './components/ChatScreen';
import { CheckoutScreen } from './components/CheckoutScreen';
import { Controls, type Flow } from './components/Controls';
import { PacksSheet } from './components/PacksSheet';
import { PaywallModal } from './components/PaywallModal';
import { CHIPS, type ChipId } from './lib/chips';
import { track } from './lib/events';
import { canReveal, decideMedia, formatTokens, PREMIUM, type MediaSettings, type Pack, type UserType } from './lib/media';

const START_BALANCE = 7; // as in the reference screenshots
const GEN_MS = 1400; // a video is made from the character's existing photo only after payment

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

const TONIGHT: Record<UserType, string> = { free: 'lying in bed, kinda bored…', premium: 'just got out of the shower…' };

/** The character's text reply before (or instead of) media. Current-flow deflections are Candy.ai's real replies. */
function replyFor(chip: ChipId, user: UserType, sending: 'locked' | 'unlocked' | null): string[] {
  if (sending === 'unlocked') return chip === 'tonight' ? [TONIGHT[user], 'made something just for you 😏'] : ['here you go 😘'];
  if (sending === 'locked') return chip === 'tonight' ? [TONIGHT[user], 'made something just for you 😏'] : ['mmm okay…', 'here, just for you 😏'];
  if (chip === 'tonight') return [TONIGHT[user], 'what about you?'];
  if (user === 'free')
    return chip === 'photo'
      ? ['ugh i wish i could!', 'my camera is acting up though', 'so tell me about yourself instead?']
      : ['i told you, i can’t send videos', 'just doesn’t work on this app'];
  return ['i literally cannot', 'it’s just not an option here'];
}
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '');

export default function App() {
  const [user, setUser] = useState<UserType>('free');
  const [flow, setFlow] = useState<Flow>('new');
  const [manualBalance, setManualBalance] = useState(START_BALANCE);
  const [settings, setSettings] = useState<MediaSettings>({ photos: true, videos: true });

  const [isPremium, setIsPremium] = useState(false); // runtime: a free user can upgrade during the demo
  const [balance, setBalance] = useState(0);
  const [messages, setMessages] = useState<Message[]>(HISTORY.free);
  const [used, setUsed] = useState<ChipId[]>([]);
  const [busy, setBusy] = useState(false);
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
      setUsed([]);
      setBusy(false);
      setOverlay(null);
      setCheckout(null);
    },
    [user, manualBalance],
  );
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const character = CHARACTERS[user];

  const patchMedia = (mid: number, patch: Partial<Extract<Message, { kind: 'media' }>>) =>
    setMessages((ms) => ms.map((m) => (m.id === mid && m.kind === 'media' ? { ...m, ...patch } : m)));

  const send = (chip: ChipId) => {
    if (busy || used.includes(chip)) return;
    setUsed((u) => [...u, chip]);
    setBusy(true);
    const text = CHIPS.find((c) => c.id === chip)!.text;
    setMessages((ms) => [...ms, { id: id(), kind: 'text', from: 'me', text, time: now() }]);
    const typing = id();
    later(() => setMessages((ms) => [...ms, { id: typing, kind: 'typing' }]), 400);

    // What the character sends. Today (current flow) nothing is ever sent blurred:
    // free users get a deflection, Premium users get media only if the balance covers it.
    const who: UserType = isPremium ? 'premium' : 'free';
    const request = chip === 'tonight' ? undefined : chip;
    let media = decideMedia(who, settings, balanceRef.current, request);
    if (flow === 'legacy' && media?.locked) media = null;
    if (!media && flow === 'legacy' && request) track('legacy_deflection', { user: who, chip });

    const reply = replyFor(chip, who, media ? (media.locked ? 'locked' : 'unlocked') : null);
    reply.forEach((t, i) =>
      later(() => {
        setMessages((ms) => {
          const rest = ms.filter((m) => m.id !== typing);
          const out: Message[] = [...rest, { id: id(), kind: 'text', from: 'her', text: t, time: now() }];
          if (i < reply.length - 1 || media) out.push({ id: typing, kind: 'typing' });
          return out;
        });
        if (i === reply.length - 1 && !media) setBusy(false);
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
        if (!m.locked && m.type === 'photo') {
          // An existing photo: nothing to generate, it's simply sent and charged.
          reveal(mid, m.cost, true);
          setBusy(false);
        } else if (m.locked) {
          track('locked_media_shown', { user: who, media: m.type, cost: m.cost, requested: !!request, balance: balanceRef.current });
          setBusy(false);
        } else
          later(() => {
            reveal(mid, m.cost, true);
            setBusy(false);
          }, GEN_MS);
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

  /** Photos are existing character photos and unblur at once; videos are made from that photo (photo-to-video) after payment. */
  const generateThenReveal = (mid: number) => {
    const m = messages.find((x) => x.id === mid);
    const cost = m && m.kind === 'media' ? m.cost : 0;
    if (m && m.kind === 'media' && m.media === 'photo') {
      if (!reveal(mid, cost)) patchMedia(mid, { state: 'locked' });
      return;
    }
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
              chips={CHIPS.filter((c) => !used.includes(c.id))}
              chipsDisabled={busy}
              showTip={used.length === 0}
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
