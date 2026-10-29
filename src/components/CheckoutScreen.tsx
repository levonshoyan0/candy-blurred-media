import { formatPrice } from '../lib/media';

/** Stand-in for the external payment provider page. Nothing is charged. */
export function CheckoutScreen({ item, price, onPay, onCancel }: { item: string; price: number; onPay: () => void; onCancel: () => void }) {
  return (
    <div className="screen checkout">
      <div className="provider">
        <div className="lock">🔒 secure-pay.example · test mode</div>
        <div className="merchant">EverAI</div>
        <div className="item">
          <span>{item}</span>
          <b>{formatPrice(price)}</b>
        </div>
        <label>
          Card number
          <input readOnly value="4242 4242 4242 4242" />
        </label>
        <div className="two">
          <label>
            Expiry
            <input readOnly value="12 / 29" />
          </label>
          <label>
            CVC
            <input readOnly value="123" />
          </label>
        </div>
        <button className="pay" onClick={onPay}>
          Pay {formatPrice(price)}
        </button>
        <button className="cancel" onClick={onCancel}>
          Cancel and return
        </button>
        <div className="fine">Prototype: no real payment is made.</div>
      </div>
    </div>
  );
}
