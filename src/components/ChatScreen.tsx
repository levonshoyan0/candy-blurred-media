import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import type { Character } from '../characters';
import type { MediaType } from '../lib/media';
import type { ChipId } from '../lib/chips';
import * as I from './Icons';

export type MediaState = 'locked' | 'generating' | 'revealed';

export type Message =
  | { id: number; kind: 'text'; from: 'me' | 'her'; text: string; time?: string }
  | { id: number; kind: 'typing' }
  | { id: number; kind: 'media'; media: MediaType; cost: number; requested: boolean; state: MediaState };

interface Props {
  character: Character;
  showUpgradeBanner: boolean;
  messages: Message[];
  chips: { id: ChipId; text: string }[]; // what the reviewer can send
  chipsDisabled: boolean;
  showTip: boolean;
  onSend: (chip: ChipId) => void;
  onUnlock: (id: number) => void;
  children?: ReactNode; // overlays
}

export function ChatScreen({ character, showUpgradeBanner, messages, chips, chipsDisabled, showTip, onSend, onUnlock, children }: Props) {
  // Scroll only the message list, never the page (scrollIntoView moves the whole page on mobile).
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="screen chat">
      <header className="hd">
        <span className="ic back">
          <I.Back />
        </span>
        <span className="av-ring">
          <img className="av" src={character.avatar} alt="" />
        </span>
        <div className="who">
          <div className="nm">
            {character.name} <span className="online" />
          </div>
          <span className="tag">{character.level}</span>
        </div>
        <span className="ic call off">
          <I.Phone />
        </span>
      </header>
      <div className="handle-tab">
        <i />
      </div>

      {showUpgradeBanner && (
        <div className="upsell off">
          <span className="heart">♥</span>
          <div>
            <div className="up-t">Unlimited messages</div>
            <div className="up-s">Photos, video, voice &amp; calls</div>
          </div>
          <span className="up-btn">Unlock</span>
        </div>
      )}

      <div className="msgs" ref={list}>
        {messages.map((m) => {
          if (m.kind === 'typing')
            return (
              <div key={m.id} className="b h typing">
                <span />
                <span />
                <span />
              </div>
            );
          if (m.kind === 'media') return <MediaItem key={m.id} m={m} character={character} onUnlock={() => onUnlock(m.id)} />;
          return (
            <div key={m.id} className={`b ${m.from === 'me' ? 'u' : 'h'}`}>
              <span>
                {m.text}
                {m.time && <span className="time">{m.time}</span>}
              </span>
            </div>
          );
        })}
      </div>

      <div className="composer">
        {chips.length > 0 && (
          <div className="chips">
            {showTip && <span className="tip chips-tip">Tap a message to send it</span>}
            {chips.map((c) => (
              <button key={c.id} className="suggest" data-chip={c.id} disabled={chipsDisabled} onClick={() => onSend(c.id)}>
                {c.text}
              </button>
            ))}
          </div>
        )}
        <div className="box">
          <div className="box-row">
            <span className="ph-text">Write a message...</span>
            <span className="send">
              <I.Send />
            </span>
          </div>
          <div className="box-icons off">
            <span className="pinkic">
              <I.Gift />
            </span>
            <I.Sliders size={26} />
            {!showUpgradeBanner && <I.Hanger size={26} />}
          </div>
        </div>
      </div>

      {children}
    </div>
  );
}

function MediaItem({ m, character, onUnlock }: { m: Extract<Message, { kind: 'media' }>; character: Character; onUnlock: () => void }) {
  const label = m.media === 'video' ? `15s video from ${character.name}` : `Photo from ${character.name}`;
  const src = m.media === 'video' ? character.video : character.photo;
  if (m.state === 'revealed')
    return (
      <div className={`media ${m.media}`}>
        <img src={src} alt={label} />
        {m.media === 'video' && (
          <>
            <span className="play">
              <I.Play />
            </span>
            <span className="dur">0:15</span>
          </>
        )}
      </div>
    );
  return (
    <div className={`media locked ${m.media} ${m.state} ${m.requested ? 'placeholder' : ''}`}>
      {/* Unprompted: a blurred existing photo. Requested: a generic placeholder, never a fake preview. */}
      {!m.requested && <img src={src} alt="" className="blurimg" />}
      <div className="lockbody">
        {m.state === 'generating' ? (
          <>
            <span className="spinner" />
            <span className="lk-label">{m.media === 'video' ? `${character.name} is recording…` : `${character.name} is taking your photo…`}</span>
          </>
        ) : (
          <>
            <span className="lk-ic">
              <I.Lock size={18} />
            </span>
            <span className="lk-label">{label}</span>
            {m.requested && <span className="lk-sub">Made for you after you unlock</span>}
            <button className="lk-btn" onClick={onUnlock}>
              Unlock
            </button>
            <span className="tip inline">Tap Unlock to see it</span>
          </>
        )}
      </div>
    </div>
  );
}
