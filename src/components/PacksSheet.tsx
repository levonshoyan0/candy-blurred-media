import { useState } from 'react';
import { DEFAULT_PACK, formatPrice, formatTokens, PACKS, SHEET_PACKS, type Pack } from '../lib/media';
import { Coin } from './Coin';
import * as I from './Icons';

/** Candy.ai's in-place "Not Enough Tokens!" sheet, with a subtitle that names what's being unlocked. */
export function PacksSheet({ what, onBuy, onClose }: { what: string; onBuy: (p: Pack) => void; onClose: () => void }) {
  const [sel, setSel] = useState<Pack>(DEFAULT_PACK);
  const [all, setAll] = useState(false);
  const list = all ? PACKS : SHEET_PACKS;
  return (
    <div className="overlay">
      <div className="nets" role="dialog" aria-label="Not Enough Tokens">
        <div className="pplus off">
          <span className="pp-badge">Premium Plus</span>
          <span>
            Get +10% bonus tokens <I.ChevronRight />
          </span>
        </div>
        <div className="nets-body">
          <button className="nets-x" onClick={onClose} aria-label="Close">
            <I.Close />
          </button>
          <div className="nets-t">Not Enough Tokens!</div>
          <div className="nets-s">Get tokens to unlock {what}</div>
          <div className="nets-list">
            {list.map((p) => (
              <button key={p.tokens} className={`nrow ${p.tokens === sel.tokens ? 'sel' : ''}`} onClick={() => setSel(p)}>
                <span className="nrow-amt">
                  <Coin size="l" /> {formatTokens(p.tokens)}
                </span>
                <span className="nrow-bonus">{p.bonus ? `+${p.bonus}% bonus` : ''}</span>
                <span className="nrow-price">{formatPrice(p.price)}</span>
              </button>
            ))}
          </div>
          {!all && (
            <button className="more" onClick={() => setAll(true)}>
              Show more packages <I.Chevron />
            </button>
          )}
          <button className="buy-now" onClick={() => onBuy(sel)}>
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
