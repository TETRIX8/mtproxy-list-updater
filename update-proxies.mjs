import { readFile, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';

const SOURCES = [
  {
    name: 'sponsor',
    url: 'https://proxy-sponsor.llimonix.dev/v1/site-proxies',
  },
  {
    name: 'public',
    url: 'https://proxy-public.llimonix.dev/v1/public-proxies',
  },
];

const Q = [78,116,96,107,87,98,106,70,128,93,70,119,60,101,122,67,139,119,123,85,125,67,100,137,121,72,114,69,117,87,84,115,86,120,129,116,86,117,65,136,88,117,87,85];

function deriveKey() {
  const base64 = Q.slice().reverse().map((value) => String.fromCharCode(value - 0x11)).join('');
  const x = Buffer.from(base64, 'base64');
  const hash = crypto.createHash('sha256').update(Buffer.from('mt91zxq', 'ascii')).digest();
  if (x.length !== hash.length) throw new Error(`Unexpected key material length: ${x.length}`);
  return Buffer.from(x.map((value, index) => value ^ hash[index]));
}

function decryptEnvelope(envelope) {
  if (!envelope || envelope.alg !== 'A256GCM' || !envelope.iv || !envelope.ct) {
    throw new Error('Invalid encrypted source envelope');
  }
  const encrypted = Buffer.from(envelope.ct, 'base64');
  const tag = encrypted.subarray(-16);
  const ciphertext = encrypted.subarray(0, -16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(tag);
  return JSON.parse(Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8'));
}

function asProxy(raw, source) {
  const server = String(raw.server ?? raw.host ?? '').trim();
  const port = Number(raw.port);
  const secret = String(raw.secret ?? '').trim();
  if (!server || !Number.isInteger(port) || port < 1 || port > 65535 || !secret) return null;
  const country = String(raw.geo ?? raw.country ?? 'UN').trim().toUpperCase() || 'UN';
  const link = `tg://proxy?server=${encodeURIComponent(server)}&port=${port}&secret=${encodeURIComponent(secret)}`;
  return {
    country,
    server,
    port,
    secret,
    link,
    source,
    ...(raw.status ? { status: String(raw.status) } : {}),
  };
}

const all = [];
for (const source of SOURCES) {
  const response = await fetch(source.url, { headers: { 'user-agent': 'mtproxy-json-updater/1.0' } });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  const payload = decryptEnvelope(await response.json());
  if (!Array.isArray(payload)) throw new Error(`${source.name}: decrypted payload is not an array`);
  for (const item of payload) {
    const proxy = asProxy(item, source.name);
    if (proxy) all.push(proxy);
  }
}

const deduped = [...new Map(all.map((proxy) => [`${proxy.server}:${proxy.port}:${proxy.secret}`, proxy])).values()]
  .sort((a, b) => a.country.localeCompare(b.country) || a.server.localeCompare(b.server));

const output = {
  updated_at: new Date().toISOString(),
  count: deduped.length,
  proxies: deduped,
};

await writeFile('proxies.json', `${JSON.stringify(output, null, 2)}\n`);
console.log(`Saved ${deduped.length} proxies to proxies.json`);
