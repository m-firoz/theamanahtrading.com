import { useEffect, useState } from 'react';
import { addItem, readItems } from '../lib/quote-store';

type Props = { sku: string; moq: number; add: string; inQuote: string; inQuoteShort: string; href: string };

export default function AddToQuote({ sku, moq, add, inQuote, inQuoteShort, href }: Props) {
  const [inList, setInList] = useState(false);
  useEffect(() => {
    const update = () => setInList(readItems().some((i) => i.sku === sku));
    update();
    window.addEventListener('quote:changed', update);
    return () => window.removeEventListener('quote:changed', update);
  }, [sku]);
  return inList ? (
    <a className="btn in-quote card-btn" href={href} aria-label={inQuote}>
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <span className="long">{inQuote}</span><span className="short">{inQuoteShort}</span>
    </a>
  ) : (
    <button type="button" className="btn honey card-btn" onClick={() => addItem(sku, moq)}>{add}</button>
  );
}
