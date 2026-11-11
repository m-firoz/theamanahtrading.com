// The quote list lives in the browser session only. Nothing is stored by us.
export type QuoteItem = { sku: string; qty: number };
const KEY = 'amanah-quote';
const DONE_KEY = 'amanah-quote-confirmation';

export function readItems(): QuoteItem[] {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}
export function writeItems(items: QuoteItem[]) {
  sessionStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('quote:changed'));
}
export function addItem(sku: string, qty: number) {
  const items = readItems();
  if (!items.some((i) => i.sku === sku)) writeItems([...items, { sku, qty }]);
}
export function readConfirmation<T>(): T | null {
  try { return JSON.parse(sessionStorage.getItem(DONE_KEY) ?? 'null'); } catch { return null; }
}
export function writeConfirmation(data: unknown) { sessionStorage.setItem(DONE_KEY, JSON.stringify(data)); }
export function clearAll() {
  sessionStorage.removeItem(DONE_KEY);
  writeItems([]);
}
