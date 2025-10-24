
// js/main.js — fully integrated with fixed learn.js
import * as storage from './storage.js';
import { renderLibrary } from './library.js';
import { initAuthorHandlers, addFlashcardRow, addQuizRow } from './author.js';
import * as learnMod from './learn.js';

const q = s => document.querySelector(s);
const qa = s => Array.from(document.querySelectorAll(s));

/* ---------- Navbar Navigation ---------- */
qa('.navbar-nav .nav-link').forEach(link=>{
  link.addEventListener('click', e=>{
    e.preventDefault();
    qa('main section').forEach(s=>s.classList.add('d-none'));
    const sec = q(`#${link.dataset.target}`);
    if(!sec) return;
    sec.classList.remove('d-none');

    if(link.dataset.target === 'library') renderLibrary();
    if(link.dataset.target === 'learn') learnMod.renderLearnDropdown();

    qa('.navbar-nav .nav-link').forEach(l=>l.classList.remove('active'));
    link.classList.add('active');
  });
});

/* ---------- Learn internal tab buttons ---------- */
qa('#learn .nav-link').forEach(btn=>{
  btn.addEventListener('click', ()=> learnMod.showLearnTab(btn.dataset.tab, btn));
});

/* ---------- Author / Add Buttons ---------- */
q('#newCapsuleBtn').addEventListener('click', ()=>{
  q('#editingId').value = '';
  ['title','subject','notes'].forEach(id=> q(`#${id}`).value = '');
  q('#level').value = 'Beginner';
  q('#flashcardsContainer').innerHTML = '';
  q('#quizContainer').innerHTML = '';
  qa('main section').forEach(s=>s.classList.add('d-none'));
  q('#author').classList.remove('d-none');
});
q('#addFlashcardBtn').addEventListener('click', ()=> addFlashcardRow());
q('#addQuizBtn').addEventListener('click', ()=> addQuizRow());
initAuthorHandlers();

/* ---------- Library Events ---------- */
window.addEventListener('pc-delete', e=>{
  storage.deleteCapsuleStorage(e.detail.id);
  renderLibrary();
});

window.addEventListener('pc-saved', ()=>{
  renderLibrary();
  qa('main section').forEach(s=>s.classList.add('d-none'));
  q('#library').classList.remove('d-none');
});

window.addEventListener('pc-show-section', e=>{
  const id = e.detail.id;
  qa('main section').forEach(s=>s.classList.add('d-none'));
  q(`#${id}`).classList.remove('d-none');
  if(id === 'learn') learnMod.renderLearnDropdown();
});

window.addEventListener('pc-set-active-tab', e=>{
  qa('.navbar-nav .nav-link').forEach(l=>l.classList.remove('active'));
  const node = document.querySelector(e.detail.linkSelector);
  if(node) node.classList.add('active');
});

/* ---------- Learn button ---------- */
window.addEventListener('pc-learn', e=>{
  const { id } = e.detail;
  qa('main section').forEach(s=>s.classList.add('d-none'));
  q('#learn').classList.remove('d-none');
  learnMod.loadCapsuleForLearn(id);

  qa('.navbar-nav .nav-link').forEach(l=>l.classList.remove('active'));
  const navLearn = document.querySelector('[data-target="learn"]');
  if(navLearn) navLearn.classList.add('active');

  // update dropdown selection
  const sel = q('#learnSelect');
  if(sel) sel.value = id;
});

/* ---------- Theme ---------- */
q('#themeBtn').addEventListener('click', ()=>{
  document.body.classList.toggle('dark');
  q('#themeBtn').textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

/* ---------- Import Capsule ---------- */
q('#importCapsuleBtn').addEventListener('click', ()=>{
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = e=>{
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const c = JSON.parse(reader.result);
        if(c.schema !== storage.SCHEMA_ID){
          alert('Invalid schema. Expected ' + storage.SCHEMA_ID);
          return;
        }
        if(!c.title || typeof c.title !== 'string'){
          alert('Invalid capsule: missing title.');
          return;
        }
        if(!c.id) c.id = 'c_' + Date.now();
        if(localStorage.getItem(storage.getCapsuleKey(c.id))){
          c.id = 'c_' + Date.now();
        }
        c.updatedAt = new Date().toISOString();
        localStorage.setItem(storage.getCapsuleKey(c.id), JSON.stringify(c, null, 2));

        let idx = storage.safeParse(localStorage.getItem(storage.getIndexKey())) || [];
        idx = idx.filter(i => i.id !== c.id);
        idx.unshift({ id: c.id, title: c.title, subject: c.subject || '', level: c.level || '', updatedAt: c.updatedAt });
        localStorage.setItem(storage.getIndexKey(), JSON.stringify(idx, null, 2));

        alert('Capsule imported successfully!');
        renderLibrary();
      }catch(err){
        console.error(err);
        alert('Invalid file.');
      }
    };
    reader.readAsText(file);
  };
  input.click();
});

/* ---------- Initial Load ---------- */
storage.ensureIndex();
renderLibrary();
