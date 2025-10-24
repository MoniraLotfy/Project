// js/storage.js
export const SCHEMA_ID = "pocket-classroom/v1";

/* ---------- Utility Helpers ---------- */
export const q = s => document.querySelector(s);
export const qa = s => Array.from(document.querySelectorAll(s));

export function timeAgo(iso){
  try{
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff/60000);
    if(mins < 1) return 'just now';
    if(mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins/60);
    if(hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs/24);
    return `${days}d`;
  }catch(e){ return ''; }
}

export function safeParse(s){
  try{ return JSON.parse(s); }catch(e){ return null; }
}

/* Escape helpers */
export function escapeHtml(s){
  if(!s && s !== 0) return '';
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
export function escapeAttr(s){
  if(!s && s !== 0) return '';
  return String(s).replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

/* ---------- Storage key helpers (as per PDF) */
export function getIndexKey(){ return 'pc_capsules_index'; }
export function getCapsuleKey(id){ return `pc_capsule_${id}`; }
export function getProgressKey(id){ return `pc_progress_${id}`; }

/* ---------- Index and capsule ops ---------- */
export function ensureIndex(){
  if(!localStorage.getItem(getIndexKey())){
    localStorage.setItem(getIndexKey(), JSON.stringify([], null, 2));
  }
}

export function getIndex(){
  return safeParse(localStorage.getItem(getIndexKey())) || [];
}

export function saveIndex(idx){
  localStorage.setItem(getIndexKey(), JSON.stringify(idx, null, 2));
}

export function saveCapsuleObj(capsule){
  // write capsule object (expects capsule.id present)
  localStorage.setItem(getCapsuleKey(capsule.id), JSON.stringify(capsule, null, 2));
  // update index (keep newest first)
  let idx = getIndex();
  idx = idx.filter(i => i.id !== capsule.id);
  idx.unshift({ id: capsule.id, title: capsule.title, subject: capsule.subject || '', level: capsule.level || '', updatedAt: capsule.updatedAt || new Date().toISOString() });
  saveIndex(idx);
}

export function loadCapsule(id){
  return safeParse(localStorage.getItem(getCapsuleKey(id)));
}

export function deleteCapsuleStorage(id){
  localStorage.removeItem(getCapsuleKey(id));
  localStorage.removeItem(`pc_flash_${id}`);
  localStorage.removeItem(`pc_quiz_${id}`);
  localStorage.removeItem(getProgressKey(id));
  localStorage.removeItem(`pc_quiz_best_${id}`);
  let idx = getIndex();
  idx = idx.filter(i => i.id !== id);
  saveIndex(idx);
}

/* ---------- Progress helpers ---------- */
export function updateProgress(id, value){
  const v = Math.min(Math.round(value), 100);
  localStorage.setItem(getProgressKey(id), String(v));
}
export function getProgress(id){
  return parseInt(localStorage.getItem(getProgressKey(id)) || '0', 10);
}

/* ---------- Flash & Quiz counts ---------- */
export function getFlashDone(id){
  const c = loadCapsule(id);
  const total = c?.flashcards?.length || 0;
  const done = parseInt(localStorage.getItem(`pc_flash_${id}`) || '0', 10);
  return Math.min(done, total);
}
export function getQuizDone(id){
  const c = loadCapsule(id);
  const total = c?.quiz?.length || 0;
  const done = parseInt(localStorage.getItem(`pc_quiz_${id}`) || '0', 10);
  return Math.min(done, total);
}
export function getQuizProgressPart(id){
  const qDone = parseInt(localStorage.getItem(`pc_quiz_${id}`) || '0',10);
  const c = loadCapsule(id);
  const total = c?.quiz?.length || 0;
  return total ? Math.round((qDone / total) * 50) : 0;
}
