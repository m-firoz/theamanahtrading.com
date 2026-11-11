import { useEffect, useState } from 'react';
import { addItem, readItems } from '../lib/quote-store';

type Props = { sku: string; moq: number; add: string; inQuote: string; href: string };

export default function AddToQuote({ sku, moq, add, inQuote, href }: Props) {
  const [inList, setInList] = useState(false);
  useEffect(() => {
    const update = () => setInList(readItems().some((i) => i.sku === sku));
    update();
    window.addEventListener('quote:changed', update);
    return () => window.removeEventListener('quote:changed', update);
  }, [sku]);
  return inList ? (
    <a className="btn ghost small" href={href}>{inQuote}</a>
  ) : (
    <button type="button" className="btn small" onClick={() => addItem(sku, moq)}>{add}</button>
  );
}
