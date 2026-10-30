import { validateEfforts, mergeEfforts } from './efforts.js?v=20261030-efforts';
const stages = new Set(['Wishlist', 'Tailoring', 'Applied', 'Interview', 'Offer', 'Closed']);
const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const identity = item => `${item.company}|${item.role}`.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}|]/gu, '');

export function validateApplicationImport(payload) {
  if (!payload || payload.version !== 1 || !Array.isArray(payload.applications) || payload.applications.length > 200) throw new Error('Invalid opportunity file');
  const batchId = text(payload.batchId, 100);
  if (!batchId) throw new Error('Missing import identifier');
  const applications = payload.applications.map(item => {
    if (!item || !text(item.company, 100) || !text(item.role, 150) || !stages.has(item.stage)) throw new Error('Invalid opportunity');
    const clean = { id: text(item.id, 100), company: text(item.company, 100), role: text(item.role, 150), stage: item.stage, next: text(item.next, 500), source: text(item.source, 250), deadline: text(item.deadline, 10), link: '', cv: '' };
    if (!clean.id) throw new Error('Missing opportunity identifier');
    if (clean.deadline && (!/^\d{4}-\d{2}-\d{2}$/.test(clean.deadline) || Number.isNaN(Date.parse(clean.deadline)))) throw new Error('Invalid deadline');
    for (const field of ['link', 'cv']) {
      if (!item[field]) continue;
      const url = new URL(item[field]);
      if (url.protocol !== 'https:') throw new Error('Opportunity links must use HTTPS');
      clean[field] = url.href;
    }
    return clean;
  });
  return { batchId, applications, efforts: validateEfforts(payload.efforts || []) };
}

export function mergeApplicationImport(current, rawPayload) {
  const { batchId, applications, efforts } = validateApplicationImport(rawPayload);
  if ((current.applicationImports || []).includes(batchId)) return { state: current, added: 0, effortsAdded: 0 };
  const known = new Set((current.applications || []).map(identity));
  const records = [...(current.applications || [])];
  for (const item of applications) {
    const key = identity(item);
    if (known.has(key) || records.some(old => old.id === item.id)) continue;
    known.add(key);
    records.push(item);
  }
  const mergedEfforts = mergeEfforts(current.efforts, efforts);
  return { state: { ...current, applications: records, efforts: mergedEfforts, applicationImports: [...(current.applicationImports || []), batchId] }, added: records.length - (current.applications || []).length, effortsAdded: mergedEfforts.length - (current.efforts || []).length };
}

export function decodeApplicationFragment(hash) {
  if (!hash.startsWith('#orbit-import=')) return null;
  const encoded = hash.slice('#orbit-import='.length);
  if (!encoded || encoded.length > 200000) throw new Error('Invalid opportunity link');
  const bytes = Uint8Array.from(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

