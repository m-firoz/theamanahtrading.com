import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { clearAll, readConfirmation, readItems, writeConfirmation, writeItems } from '../lib/quote-store';
import type { QuoteItem } from '../lib/quote-store';

type CatalogItem = { sku: string; name: string; weight: string; moqValue: number; moqUnit: string };
type Site = {
  name: string; email: string; phoneDisplay: string; phoneTel: string; hours: string;
  timeZone: string; timeZoneLabel: string; formKey: string;
};
type Props = {
  locale: string;
  catalog: CatalogItem[];
  labels: Record<string, string>;
  units: Record<string, string>;
  site: Site;
  countries: string[];
  hrefs: { products: string; privacy: string };
  dev: boolean;
};
type Buyer = { name: string; company: string; email: string; phone: string; country: string; message: string };
type Line = { sku: string; name: string; weight: string; qty: number; unit: string };
type Confirmation = { ref: string; iso: string; buyer: Buyer; lines: Line[]; test: boolean; text: string };

const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

function makeRef(now: Date) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  const d = now.toISOString().slice(2, 10).replace(/-/g, '');
  return `AMN-${d}-${code}`;
}

function formatDate(iso: string, locale: string, timeZone: string) {
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'long', timeStyle: 'short', timeZone };
  try { return new Intl.DateTimeFormat(locale, opts).format(new Date(iso)); }
  catch { return new Intl.DateTimeFormat('en', opts).format(new Date(iso)); }
}

export default function QuoteList({ locale, catalog, labels: L, units, site, countries, hrefs, dev }: Props) {
  const byKey = Object.fromEntries(catalog.map((c) => [c.sku, c]));
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [conf, setConf] = useState<Confirmation | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending'>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const opened = useRef(Date.now());
  const [form, setForm] = useState({
    name: '', company: '', email: '', phone: '', country: countries[0] ?? '',
    message: '', consent: false, botcheck: false,
  });

  useEffect(() => {
    const sync = () => setItems(readItems().filter((i) => byKey[i.sku]));
    sync();
    setConf(readConfirmation<Confirmation>());
    setReady(true);
    window.addEventListener('quote:changed', sync);
    return () => window.removeEventListener('quote:changed', sync);
  }, []);

  const setQty = (sku: string, qty: number) =>
    writeItems(items.map((i) => (i.sku === sku ? { ...i, qty } : i)));
  const remove = (sku: string) => writeItems(items.filter((i) => i.sku !== sku));
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  function buildText(ref: string, iso: string, buyer: Buyer, lines: Line[]) {
    const rows = lines.map((l, i) => `${i + 1}. ${l.sku} | ${l.name} | ${l.weight} | quantity ${l.qty} ${l.unit}`);
    return [
      `Quote request ${ref}`,
      `Sent: ${formatDate(iso, 'en', site.timeZone)} (${site.timeZoneLabel})`,
      `Website language: ${locale}`,
      '',
      `Name: ${buyer.name}`,
      `Company: ${buyer.company}`,
      `Email: ${buyer.email}`,
      `Phone: ${buyer.phone || '-'}`,
      `Country: ${buyer.country}`,
      '',
      'Items:',
      ...rows,
      '',
      `Message: ${buyer.message || '-'}`,
    ].join('\n');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (form.botcheck || Date.now() - opened.current < 4000) { setError(L.tooFast); return; }
    for (const i of items) {
      const c = byKey[i.sku];
      if (!Number.isFinite(i.qty) || i.qty < c.moqValue) {
        setError(fmt(L.qtyError, { name: c.name, moq: c.moqValue, unit: units[c.moqUnit] ?? c.moqUnit }));
        return;
      }
    }
    const now = new Date();
    const iso = now.toISOString();
    const ref = makeRef(now);
    const buyer: Buyer = {
      name: form.name.trim(), company: form.company.trim(), email: form.email.trim(),
      phone: form.phone.trim(), country: form.country, message: form.message.trim(),
    };
    const lines: Line[] = items.map((i) => ({
      sku: i.sku, name: byKey[i.sku].name, weight: byKey[i.sku].weight, qty: i.qty,
      unit: units[byKey[i.sku].moqUnit] ?? byKey[i.sku].moqUnit,
    }));
    const text = buildText(ref, iso, buyer, lines);

    setStatus('sending');
    try {
      let test = false;
      if (!site.formKey) {
        if (!dev) { setStatus('idle'); setError(L.needKey); return; }
        test = true; // development only: nothing is sent
      } else {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: site.formKey,
            subject: `Quote request ${ref}: ${buyer.company}`,
            from_name: `${site.name} website`,
            name: buyer.name, email: buyer.email, phone: buyer.phone,
            company: buyer.company, country: buyer.country, reference: ref,
            message: text, botcheck: '',
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error('send failed');
      }
      const c: Confirmation = { ref, iso, buyer, lines, test, text };
      writeConfirmation(c);
      setConf(c);
      window.scrollTo({ top: 0 });
    } catch {
      setError(L.failed);
    } finally {
      setStatus('idle');
    }
  }

  async function copyList() {
    const text = conf?.text ?? '';
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* ignore */ }
  }

  if (!ready) return <div className="sheet" aria-busy="true" />;

  // Confirmation: only shown after a successful send. It is the buyer's own record.
  if (conf) {
    return (
      <section className="sheet" aria-labelledby="sent-title">
        <div className="print-brand">{site.name}</div>
        <h1 id="sent-title">{L.sentTitle}</h1>
        {conf.test && <p className="alert no-print">{L.testMode}</p>}
        <p className="muted" style={{ margin: 0 }}>{L.reference}</p>
        <p className="ref">{conf.ref}</p>
        <dl>
          <dt>{L.sentAt}</dt><dd>{formatDate(conf.iso, locale, site.timeZone)} ({site.timeZoneLabel})</dd>
          <dt>{L.name}</dt><dd>{conf.buyer.name}</dd>
          <dt>{L.company}</dt><dd>{conf.buyer.company}</dd>
          <dt>{L.email}</dt><dd>{conf.buyer.email}</dd>
          {conf.buyer.phone && (<><dt>{L.phone}</dt><dd>{conf.buyer.phone}</dd></>)}
          <dt>{L.country}</dt><dd>{conf.buyer.country}</dd>
          {conf.buyer.message && (<><dt>{L.message}</dt><dd>{conf.buyer.message}</dd></>)}
        </dl>
        <h2 style={{ fontSize: '1.2rem' }}>{L.requested}</h2>
        <div className="table-wrap">
          <table className="items">
            <thead><tr><th>SKU</th><th>{L.item}</th><th>{L.quantity}</th></tr></thead>
            <tbody>
              {conf.lines.map((l) => (
                <tr key={l.sku}><td>{l.sku}</td><td>{l.name} <span className="muted">({l.weight})</span></td><td>{l.qty} {l.unit}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: '1rem' }}><strong>{L.statement}</strong></p>
        <p className="no-print">{L.keepRecord}</p>
        <p>{site.name} · {site.phoneDisplay} · {site.email} · {L.hours}: {site.hours} ({site.timeZoneLabel})</p>
        <div className="row no-print">
          <button type="button" className="btn" onClick={() => window.print()}>{L.print}</button>
          <button type="button" className="btn ghost" onClick={copyList}>{copied ? L.copied : L.copy}</button>
          <button type="button" className="btn ghost" onClick={() => { clearAll(); setConf(null); }}>{L.newQuote}</button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <div className="sheet">
        <p>{L.empty}</p>
        <a className="btn" href={hrefs.products}>{L.browse}</a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate={false}>
      <p>{L.intro}</p>
      <div className="table-wrap">
        <table className="items">
          <thead><tr><th>{L.item}</th><th>{L.quantity}</th><th><span className="sr-only">{L.remove}</span></th></tr></thead>
          <tbody>
            {items.map((i) => {
              const c = byKey[i.sku];
              const unit = units[c.moqUnit] ?? c.moqUnit;
              return (
                <tr key={i.sku}>
                  <td><strong>{c.name}</strong><br /><span className="muted">{c.sku} · {c.weight}</span></td>
                  <td>
                    <label className="sr-only" htmlFor={`q-${i.sku}`}>{L.quantity}: {c.name}</label>
                    <input id={`q-${i.sku}`} className="qty" type="number" inputMode="numeric" step={1}
                      value={Number.isFinite(i.qty) ? i.qty : ''}
                      onChange={(e) => setQty(i.sku, e.target.value === '' ? NaN : Math.floor(Number(e.target.value)))} />
                    <span className="muted"> {unit} (min {c.moqValue})</span>
                  </td>
                  <td><button type="button" className="link-btn" onClick={() => remove(i.sku)}>{L.remove}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ marginTop: '2rem' }}>{L.details}</h2>
      <div className="form">
        <label className="field">{L.name}
          <input className="input" required autoComplete="name" value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="field">{L.company}
          <input className="input" required autoComplete="organization" value={form.company} onChange={(e) => set('company', e.target.value)} /></label>
        <label className="field">{L.email}
          <input className="input" type="email" required autoComplete="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></label>
        <label className="field">{L.phone}
          <input className="input" type="tel" autoComplete="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></label>
        <label className="field full">{L.country}
          <select className="input" value={form.country} onChange={(e) => set('country', e.target.value)}>
            {countries.map((c) => <option key={c}>{c}</option>)}
          </select></label>
        <label className="field full">{L.message}
          <textarea className="input" value={form.message} onChange={(e) => set('message', e.target.value)} /></label>

        {/* Honeypot: hidden from people, tempting to bots */}
        <label className="hp" aria-hidden="true">Leave empty
          <input type="checkbox" tabIndex={-1} autoComplete="off" checked={form.botcheck} onChange={(e) => set('botcheck', e.target.checked)} /></label>

        <label className="field full check">
          <input type="checkbox" required checked={form.consent} onChange={(e) => set('consent', e.target.checked)} />
          <span>{L.consent} <a href={hrefs.privacy} target="_blank" rel="noopener">{L.consentLink}</a></span>
        </label>

        <div className="full">
          {error && <p className="alert error" role="alert">{error}</p>}
          <button type="submit" className="btn" disabled={status === 'sending'}>{status === 'sending' ? L.sending : L.submit}</button>
          <p className="muted" style={{ marginTop: '1rem' }}>{fmt(L.callOrEmail, { phone: site.phoneDisplay, email: site.email })}</p>
        </div>
      </div>
    </form>
  );
}
