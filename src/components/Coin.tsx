export const Coin = ({ size = 'm' }: { size?: 's' | 'm' | 'l' }) => <span className={`coin ${size}`} />;

export const Balance = ({ value }: { value: number }) => (
  <div className="bal" aria-label={`Balance: ${value} tokens`}>
    <Coin />
    {value.toLocaleString('en-US')}
  </div>
);
