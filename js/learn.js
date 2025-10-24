
// js/learn.js — fully fixed + quiz progress saved
import { safeParse, getCapsuleKey, escapeHtml } from './storage.js';

let learnState = null;

/* ---------- Keyboard shortcuts ---------- */
document.addEventListener('keydown', e => {
  const tag = document.activeElement.tagName;
  if(['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

  if(e.code === 'Space'){
    const fcTab = document.querySelector('#flashcardsTab.show');
    if(fcTab && learnState?.capsule?.flashcards?.length){
      e.preventDefault();
      const inner = fcTab.querySelector('.flashcard-inner');
      if(inner) inner.classList.toggle('flipped');
      return;
    }
  }

  const tabKeys = { '[':'notesTab', ']':'flashcardsTab', '\\':'quizTab' };
  if(tabKeys[e.key]){
    e.preventDefault();
    const btn = document.querySelector(`#learn .nav-link[data-tab="${tabKeys[e.key]}"]`);
    if(btn) btn.click();
  }
});

/* ---------- Learn dropdown ---------- */
export function renderLearnDropdown(){
  const learnHeader = document.querySelector('#learnHeader');
  let select = document.querySelector('#learnSelect');
  if(!select){
    select = document.createElement('select');
    select.className = 'form-select mb-2';
    select.id = 'learnSelect';
    select.setAttribute('aria-label','Select capsule to learn');
    learnHeader.insertBefore(select, learnHeader.firstChild);
    select.addEventListener('change', ()=>learnCapsule(select.value));
  }

  const idx = safeParse(localStorage.getItem('pc_capsules_index')) || [];
  select.innerHTML = '<option value="">-- Select Capsule --</option>' +
    idx.map(i=>{
      const c = safeParse(localStorage.getItem(getCapsuleKey(i.id))) || { title:i.title || '(untitled)' };
      return `<option value="${i.id}">${escapeHtml(c.title)}</option>`;
    }).join('');
}

/* ---------- Learn Capsule ---------- */
export function learnCapsule(id){
  if(!id) return;
  const c = safeParse(localStorage.getItem(getCapsuleKey(id)));
  if(!c){ alert('Capsule not found'); return; }

  const savedFlash = parseInt(localStorage.getItem(`pc_flash_${c.id}`) || '0',10);
  const savedQuiz = parseInt(localStorage.getItem(`pc_quiz_${c.id}`) || '0',10);
  const savedScore = parseInt(localStorage.getItem(`pc_quiz_${c.id}_score`) || savedQuiz,10);

  learnState = { capsule:c, fi:savedFlash, qi:savedQuiz, score:savedScore };

  document.querySelector('#learnTitle').textContent = c.title || '';
  document.querySelector('#learnSubject').textContent = c.subject || '';
  const lvl = document.querySelector('#learnLevel');
  lvl.textContent = c.level || '';
  lvl.className = 'badge ' + (c.level || 'Beginner');

  if(!document.querySelector('#learnShortcuts')){
    const div = document.createElement('div');
    div.id = 'learnShortcuts';
    div.className = 'small text-muted mb-2';
    div.innerHTML = `⬜ <b>Space:</b> Flip flashcard &nbsp; | &nbsp;
      <b>[ / ]:</b> Switch Notes ↔ Flashcards ↔ Quiz &nbsp; | &nbsp;
      <b>\\</b>: Go to Quiz`;
    document.querySelector('#learnHeader').appendChild(div);
  }

  renderNotes();
  renderFlash();
  renderQuiz();

  window.dispatchEvent(new CustomEvent('pc-show-section',{detail:{id:'learn'}}));
  const learnNavBtn = document.querySelector('#learn .nav-link[data-tab="notesTab"]');
  showLearnTab('notesTab', learnNavBtn || document.querySelector('#learn .nav-link'));

  updateLearnStats();
}

/* ---------- Notes ---------- */
function renderNotes(){
  const s = learnState;
  const container = document.querySelector('#notesTab');
  if(!s || !s.capsule) return;
  container.innerHTML = (s.capsule.notes?.length) ?
    `<ol>${s.capsule.notes.map(n=>`<li>${escapeHtml(n)}</li>`).join('')}</ol>` :
    '<p class="text-muted">No notes</p>';
}

/* ---------- Flashcards ---------- */
function renderFlash(){
  const s = learnState;
  const container = document.querySelector('#flashcardsTab');
  if(!s || !s.capsule) return;

  const fc = s.capsule.flashcards || [];
  if(!fc.length){
    container.innerHTML = "<p class='text-muted'>No flashcards available.</p>";
    return;
  }

  const front = escapeHtml(fc[s.fi]?.front || '(empty front)');
  const back = escapeHtml(fc[s.fi]?.back || '(empty back)');
  container.innerHTML = `
    <div class="flashcard" tabindex="0">
      <div class="flashcard-inner">
        <div class="flashcard-front">${front}</div>
        <div class="flashcard-back">${back}</div>
      </div>
    </div>
    <div class="d-flex justify-content-between my-2">
      <button class="btn btn-sm btn-secondary prev-fc" ${s.fi===0?'disabled':''}>Prev</button>
      <button class="btn btn-sm btn-secondary next-fc" ${s.fi>=fc.length-1?'disabled':''}>Next</button>
    </div>
    <div class="d-flex justify-content-center gap-2 mb-2 flashcard-action">
      <button class="btn btn-sm btn-success" id="knowBtn">I Know</button>
      <button class="btn btn-sm btn-warning" id="dontKnowBtn">I Don't Know</button>
    </div>
  `;

  container.querySelector('.prev-fc')?.addEventListener('click', ()=>{
    if(s.fi>0){ s.fi--; localStorage.setItem(`pc_flash_${s.capsule.id}`,s.fi); renderFlash(); updateLearnStats(); }
  });
  container.querySelector('.next-fc')?.addEventListener('click', ()=>{
    if(s.fi<fc.length-1){ s.fi++; localStorage.setItem(`pc_flash_${s.capsule.id}`,s.fi); renderFlash(); updateLearnStats(); }
  });

  document.querySelector('#knowBtn')?.addEventListener('click', ()=>{
    s.fi++; localStorage.setItem(`pc_flash_${s.capsule.id}`, s.fi); renderFlash(); updateLearnStats();
  });
  document.querySelector('#dontKnowBtn')?.addEventListener('click', ()=>{
    s.fi++; localStorage.setItem(`pc_flash_${s.capsule.id}`, s.fi); renderFlash(); updateLearnStats();
  });
}

/* ---------- Quiz ---------- */
function renderQuiz(){
  const s = learnState;
  const container = document.querySelector('#quizTab');
  if(!s || !s.capsule) return;

  const quiz = s.capsule.quiz || [];
  if(!quiz.length){ container.innerHTML="<p class='text-muted'>No quiz questions.</p>"; return; }

  if(s.qi >= quiz.length){
    const scorePercent = Math.round((s.score/quiz.length)*100);
    container.innerHTML = `<h5>✅ Quiz Finished!</h5><p>Your score: <b>${s.score}/${quiz.length}</b> (${scorePercent}%)</p>`;
    localStorage.setItem(`pc_quiz_${s.capsule.id}`, quiz.length);
    localStorage.setItem(`pc_quiz_${s.capsule.id}_score`, s.score);
    return;
  }

  const qObj = quiz[s.qi];
  const choices = [...qObj.choices].slice(0,4);
  while(choices.length<4) choices.push('');

  container.innerHTML = `<p><b>Q${s.qi+1}:</b> ${escapeHtml(qObj.q||'(empty)')}</p>`+
    choices.map(ch=>`<button class="btn btn-outline-primary w-100 mb-2 choice-btn">${escapeHtml(ch||'(empty)')}</button>`).join('');

  container.querySelectorAll('.choice-btn').forEach((btn,i)=>{
    btn.addEventListener('click', ()=>{
      const correctIndex = Math.min(qObj.correct||0,3);
      btn.classList.remove('btn-outline-primary');
      if(i===correctIndex){ 
        btn.classList.add('btn-success'); 
        s.score++; 
      } else { 
        btn.classList.add('btn-danger'); 
        const all = container.querySelectorAll('.choice-btn'); 
        if(all[correctIndex]) all[correctIndex].classList.add('btn-success'); 
      }

      // Save quiz progress & score
      localStorage.setItem(`pc_quiz_${s.capsule.id}`, s.qi+1);
      localStorage.setItem(`pc_quiz_${s.capsule.id}_score`, s.score);

      setTimeout(()=>{ s.qi++; renderQuiz(); updateLearnStats(); },600);
    });
  });
}

/* ---------- Tabs ---------- */
export function showLearnTab(id, btn){
  document.querySelectorAll('#learn .tab-pane').forEach(p=>p.classList.remove('show','active'));
  const pane = document.querySelector(`#${id}`);
  if(pane) pane.classList.add('show','active');
  document.querySelectorAll('#learn .nav-link').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
}

/* ---------- Update Stats ---------- */
export function updateLearnStats(){
  const s = learnState;
  if(!s) return;
  const flashDone = Math.min(parseInt(localStorage.getItem(`pc_flash_${s.capsule.id}`)||'0',10), s.capsule.flashcards?.length||0);
  const quizDone = Math.min(parseInt(localStorage.getItem(`pc_quiz_${s.capsule.id}`)||'0',10), s.capsule.quiz?.length||0);
  let statsDiv = document.querySelector('#learnStats');
  if(!statsDiv){
    statsDiv = document.createElement('div');
    statsDiv.id = 'learnStats';
    statsDiv.className = 'small text-muted';
    document.querySelector('#learnHeader').appendChild(statsDiv);
  }
  statsDiv.innerHTML = `Flashcards done: ${flashDone}/${s.capsule.flashcards?.length||0} | Quiz answered: ${quizDone}/${s.capsule.quiz?.length||0}`;
}

/* ---------- Export ---------- */
export { learnCapsule as loadCapsuleForLearn, renderFlash, renderQuiz };
