
// js/library.js
import { safeParse, getIndexKey, getCapsuleKey, getFlashDone, escapeHtml } from './storage.js';

/* Render library from pc_capsules_index — emits events for learn/edit */
export function renderLibrary(){
  const list = document.querySelector('#capsuleList');
  list.innerHTML = '';
  const idx = safeParse(localStorage.getItem(getIndexKey())) || [];
  if(!idx.length){
    document.querySelector('#emptyLibrary').classList.remove('d-none');
    return;
  }
  document.querySelector('#emptyLibrary').classList.add('d-none');

  idx.forEach(entry=>{
    const c = safeParse(localStorage.getItem(getCapsuleKey(entry.id)));
    if(!c) return;

    const totalQuiz = c.quiz?.length || 0;
    const correctQuiz = parseInt(localStorage.getItem(`pc_quiz_${c.id}_score`) || '0', 10);
    const quizDone = Math.min(parseInt(localStorage.getItem(`pc_quiz_${c.id}`) || '0', 10), totalQuiz);
    const flashDone = Math.min(parseInt(localStorage.getItem(`pc_flash_${c.id}`) || '0',10), c.flashcards?.length || 0);
    
    const progress = totalQuiz ? Math.round((correctQuiz / totalQuiz) * 100) : 0;

    const col = document.createElement('div');
    col.className = 'col-sm-6 col-md-4';
    col.innerHTML = `
      <div class="card p-3 h-100 shadow-sm d-flex flex-column" role="article" aria-labelledby="title-${c.id}">
        <h5 id="title-${c.id}">${escapeHtml(c.title)}</h5>
        <p class="text-muted small mb-2">${escapeHtml(c.subject||"")} · <span class="badge ${escapeHtml(c.level||'')}">${escapeHtml(c.level||'')}</span></p>
        <div class="progress mb-2" style="height:8px;">
          <div class="progress-bar bg-success" role="progressbar" style="width:${progress}%"></div>
        </div>
        <p class="small text-muted mb-2">Quiz Progress: ${progress}% (${correctQuiz}/${totalQuiz})</p>
        <p class="small text-muted mb-2">Flashcards done: ${flashDone}/${c.flashcards?.length || 0}</p>
        <p class="small text-muted mb-2">Quiz answered: ${quizDone}/${totalQuiz}</p>
        <div class="mt-auto d-flex gap-2 flex-wrap">
          <button class="btn btn-sm btn-primary learnBtn" data-id="${c.id}">📖Learn</button>
          <button class="btn btn-sm btn-secondary editBtn" data-id="${c.id}">📝Edit</button>
          <button class="btn btn-sm btn-warning exportBtn" data-id="${c.id}">🔃Export</button>
          <button class="btn btn-sm btn-danger deleteBtn" data-id="${c.id}">🗑️Delete</button>
        </div>
      </div>
    `;
    list.appendChild(col);
  });

  // wire events
  document.querySelectorAll('.learnBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      window.dispatchEvent(new CustomEvent('pc-learn', { detail: { id } }));
    });
  });
  document.querySelectorAll('.editBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      window.dispatchEvent(new CustomEvent('pc-edit', { detail: { id } }));
    });
  });
  document.querySelectorAll('.exportBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      const raw = localStorage.getItem(getCapsuleKey(id));
      if(!raw){ alert('Capsule not found.'); return; }
      const c = safeParse(raw);
      if(!c){ alert('Invalid capsule data.'); return; }
      c.schema = 'pocket-classroom/v1';
      const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${(c.title||'capsule').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60) || 'capsule'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  });
  document.querySelectorAll('.deleteBtn').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const id = e.currentTarget.dataset.id;
      if(!confirm('Delete this capsule?')) return;
      window.dispatchEvent(new CustomEvent('pc-delete', { detail: { id } }));
    });
  });
}
