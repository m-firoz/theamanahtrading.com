import { useEffect, useState } from 'react';
import { readItems } from '../lib/quote-store';

export default function QuoteBadge() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const update = () => setN(readItems().length);
    update();
    window.addEventListener('quote:changed', update);
    return () => window.removeEventListener('quote:changed', update);
  }, []);
  return n > 0 ? <span className="badge" aria-label={String(n)}>{n}</span> : null;
}
