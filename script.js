/* =========================================================================
   FILM DU JOUR — script.js
   JavaScript vanilla, aucune dépendance.
   ========================================================================= */

const STORAGE_FAVORITES = 'fdj_favorites';
const STORAGE_OVERRIDES = 'fdj_films_override'; // écrasement des données via admin.html
const STORAGE_CONFIG_OVERRIDE = 'fdj_config_override';

let DATA = { config: {}, films: [] };
let currentView = 'grid';
let currentSort = 'popularity';
let currentQuery = '';
let currentFilters = { genre: '', country: '', year: '', minRating: 0, age: '' };

/* --------------------------- Chargement des données --------------------------- */
async function loadData(){
  const res = await fetch('films.json');
  const json = await res.json();

  // Applique les surcharges enregistrées depuis l'admin (LocalStorage), si présentes
  const overrideFilms = localStorage.getItem(STORAGE_OVERRIDES);
  const overrideConfig = localStorage.getItem(STORAGE_CONFIG_OVERRIDE);

  DATA.config = overrideConfig ? JSON.parse(overrideConfig) : json.config;
  DATA.films = overrideFilms ? JSON.parse(overrideFilms) : json.films;

  applyTheme();
  applyEffectsFlags();
  populateFilterOptions();
  render();
}

/* --------------------------- Thème / config dynamique --------------------------- */
function applyTheme(){
  const t = DATA.config.theme || {};
  const root = document.documentElement.style;
  if(t.bgColor) root.setProperty('--bg', t.bgColor);
  if(t.surfaceColor) root.setProperty('--surface', t.surfaceColor);
  if(t.borderColor) root.setProperty('--border', t.borderColor);
  if(t.textColor) root.setProperty('--text', t.textColor);
  if(t.mutedColor) root.setProperty('--muted', t.mutedColor);
  if(t.glowColor) root.setProperty('--glow', t.glowColor);
  if(t.accentColor) root.setProperty('--accent', t.accentColor);
  if(t.fontDisplay) root.setProperty('--font-display', t.fontDisplay);
  if(t.fontBody) root.setProperty('--font-body', t.fontBody);

  const titleEl = document.getElementById('siteTitle');
  if(titleEl && DATA.config.siteTitle) titleEl.textContent = DATA.config.siteTitle;
  const pageTitle = document.getElementById('pageTitleTag');
  if(pageTitle && DATA.config.siteTitle) pageTitle.textContent = DATA.config.siteTitle + ' — Sélection quotidienne';
}

function applyEffectsFlags(){
  const e = DATA.config.effects || {};
  const body = document.body;
  body.classList.toggle('no-fade', e.fade === false);
  body.classList.toggle('no-zoom', e.zoom === false);
  body.classList.toggle('no-glow', e.glow === false);
  body.classList.toggle('no-transitions', e.transitions === false);
}

/* --------------------------- Favoris --------------------------- */
function getFavorites(){
  return JSON.parse(localStorage.getItem(STORAGE_FAVORITES) || '[]');
}
function toggleFavorite(id){
  let favs = getFavorites();
  if(favs.includes(id)) favs = favs.filter(f => f !== id);
  else favs.push(id);
  localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(favs));
  render();
  showToast(favs.includes(id) ? 'Ajouté aux favoris' : 'Retiré des favoris');
}

/* --------------------------- Filtres : options dynamiques --------------------------- */
function populateFilterOptions(){
  const genres = new Set(), countries = new Set(), years = new Set(), ages = new Set();
  DATA.films.forEach(f=>{
    (f.genres||[]).forEach(g=>genres.add(g));
    (f.country||[]).forEach(c=>countries.add(c));
    years.add(f.year);
    if(f.ageRating) ages.add(f.ageRating);
  });
  fillSelect('filterGenre', genres, 'Tous les genres');
  fillSelect('filterCountry', countries, 'Tous les pays');
  fillSelect('filterYear', [...years].sort((a,b)=>b-a), 'Toutes les années');
  fillSelect('filterAge', ages, 'Tous âges');
}
function fillSelect(id, values, defaultLabel){
  const sel = document.getElementById(id);
  if(!sel) return;
  sel.innerHTML = `<option value="">${defaultLabel}</option>` +
    [...values].map(v=>`<option value="${v}">${v}</option>`).join('');
}

/* --------------------------- Recherche / tri / filtrage --------------------------- */
function getFilteredFilms(){
  let list = [...DATA.films];

  if(currentQuery.trim()){
    const q = currentQuery.toLowerCase();
    list = list.filter(f =>
      f.title.toLowerCase().includes(q) ||
      String(f.year).includes(q) ||
      f.director.toLowerCase().includes(q) ||
      (f.cast||[]).some(c=>c.toLowerCase().includes(q)) ||
      (f.genres||[]).some(g=>g.toLowerCase().includes(q)) ||
      (f.country||[]).some(c=>c.toLowerCase().includes(q))
    );
  }

  if(currentFilters.genre) list = list.filter(f => (f.genres||[]).includes(currentFilters.genre));
  if(currentFilters.country) list = list.filter(f => (f.country||[]).includes(currentFilters.country));
  if(currentFilters.year) list = list.filter(f => String(f.year) === currentFilters.year);
  if(currentFilters.age) list = list.filter(f => f.ageRating === currentFilters.age);
  if(currentFilters.minRating) list = list.filter(f => f.imdb >= Number(currentFilters.minRating));

  switch(currentSort){
    case 'imdb': list.sort((a,b)=>b.imdb-a.imdb); break;
    case 'year': list.sort((a,b)=>b.year-a.year); break;
    case 'alpha': list.sort((a,b)=>a.title.localeCompare(b.title)); break;
    case 'duration': list.sort((a,b)=>b.duration-a.duration); break;
    default: /* popularity = ordre boxOffice desc approximatif */
      list.sort((a,b)=> parseBoxOffice(b.boxOffice) - parseBoxOffice(a.boxOffice));
  }

  const max = DATA.config.maxCards || 5;
  return list.slice(0, max);
}
function parseBoxOffice(str){
  if(!str) return 0;
  return parseInt(String(str).replace(/[^\d]/g,'')) || 0;
}

/* --------------------------- Rendu des cartes --------------------------- */
function render(){
  const grid = document.getElementById('filmsGrid');
  if(!grid) return;
  const films = getFilteredFilms();
  const favs = getFavorites();

  grid.className = 'view-' + currentView;
  grid.id = 'filmsGrid';

  if(films.length === 0){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <h3>Aucun film ne correspond</h3>
      <p>Essayez d'ajuster votre recherche ou vos filtres.</p>
    </div>`;
    return;
  }

  grid.innerHTML = films.map(f => cardTemplate(f, favs.includes(f.id))).join('');

  // Animation d'apparition progressive
  requestAnimationFrame(()=>{
    grid.querySelectorAll('.card').forEach((el, i)=>{
      setTimeout(()=>el.classList.add('in'), i * 70);
    });
  });

  // Écouteurs
  grid.querySelectorAll('.card').forEach(el=>{
    el.addEventListener('click', (e)=>{
      if(e.target.closest('.card-fav')) return;
      openModal(el.dataset.id);
    });
    el.addEventListener('keydown', e=>{
      if(e.key === 'Enter') openModal(el.dataset.id);
    });
  });
  grid.querySelectorAll('.card-fav').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.stopPropagation();
      toggleFavorite(el.dataset.id);
    });
  });
}

function cardTemplate(f, isFav){
  return `
  <article class="card" data-id="${f.id}" tabindex="0" role="button" aria-label="Voir la fiche de ${escapeHtml(f.title)}">
    <div class="card-termbar">
      <span></span><span></span><span></span>
      <span class="path">~/films/${f.id}.mkv</span>
    </div>
    <div class="card-poster-wrap">
      <img src="${f.poster}" alt="Affiche du film ${escapeHtml(f.title)}" loading="lazy">
      <button class="card-fav ${isFav?'active':''}" data-id="${f.id}" aria-label="${isFav?'Retirer des favoris':'Ajouter aux favoris'}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 2 6 5.6 5.1 8 4.5 10.4 5.7 12 8c1.6-2.3 4-3.5 6.4-2.9C22 6 23.2 9.8 21.3 12.9 18.7 16.65 12 21 12 21z"/></svg>
      </button>
      <span class="card-badge">★ ${f.imdb}</span>
    </div>
    <div class="card-body">
      <div class="card-title-row">
        <h3 class="card-title">${escapeHtml(f.title)}</h3>
        <span class="card-year">${f.year}</span>
      </div>
      <div class="card-meta">${escapeHtml(f.director)} · ${f.duration} min · ${f.ageRating}</div>
      <div class="card-tagline">"${escapeHtml(f.tagline)}"</div>
      <div class="card-genres">${(f.genres||[]).map(g=>`<span class="chip">${escapeHtml(g)}</span>`).join('')}</div>
      <div class="card-ratings">
        <div class="rating"><span class="val">${f.imdb}</span><span class="lbl">IMDb</span></div>
        <div class="rating"><span class="val">${f.rottenTomatoes}%</span><span class="lbl">RT</span></div>
        <div class="rating"><span class="val">${f.metacritic}</span><span class="lbl">Meta</span></div>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openModal('${f.id}')">Détails</button>
        <button class="btn btn-sm" onclick="event.stopPropagation(); copyLink('${f.id}')">Copier le lien</button>
      </div>
    </div>
  </article>`;
}

function escapeHtml(str=''){
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

/* --------------------------- Modal / fiche détaillée --------------------------- */
let modalHistoryIndex = 0;

function openModal(id){
  const films = getFilteredFilms();
  const f = DATA.films.find(x=>x.id===id);
  if(!f) return;
  modalHistoryIndex = films.findIndex(x=>x.id===id);

  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = modalTemplate(f);
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  overlay.querySelector('.modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) closeModal(); });

  const favBtn = overlay.querySelector('.modal-fav');
  if(favBtn){
    favBtn.addEventListener('click', ()=>{
      toggleFavorite(f.id);
      favBtn.classList.toggle('active');
    });
  }
  const prevBtn = overlay.querySelector('.modal-prev');
  const nextBtn = overlay.querySelector('.modal-next');
  if(prevBtn) prevBtn.addEventListener('click', ()=> navModal(-1));
  if(nextBtn) nextBtn.addEventListener('click', ()=> navModal(1));

  const copyBtn = overlay.querySelector('.modal-copy');
  if(copyBtn) copyBtn.addEventListener('click', ()=> copyLink(f.id));

  const shareBtn = overlay.querySelector('.modal-share');
  if(shareBtn) shareBtn.addEventListener('click', ()=> shareFilm(f));

  history.replaceState(null, '', `#${f.id}`);
}

function navModal(dir){
  const films = getFilteredFilms();
  let idx = modalHistoryIndex + dir;
  if(idx < 0) idx = films.length - 1;
  if(idx >= films.length) idx = 0;
  openModal(films[idx].id);
}

function closeModal(){
  const overlay = document.getElementById('modalOverlay');
  overlay.classList.remove('open');
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname);
}

document.addEventListener('keydown', (e)=>{
  const overlay = document.getElementById('modalOverlay');
  if(!overlay || !overlay.classList.contains('open')) return;
  if(e.key === 'Escape') closeModal();
  if(e.key === 'ArrowRight') navModal(1);
  if(e.key === 'ArrowLeft') navModal(-1);
});

function modalTemplate(f){
  const isFav = getFavorites().includes(f.id);
  return `
  <div class="modal" role="dialog" aria-modal="true" aria-label="Fiche détaillée de ${escapeHtml(f.title)}">
    <div class="modal-banner">
      <img src="${f.backdrop || f.poster}" alt="Bannière du film ${escapeHtml(f.title)}">
      <button class="modal-close" aria-label="Fermer">✕</button>
    </div>
    <div class="modal-head">
      <div class="modal-poster"><img src="${f.poster}" alt="Affiche de ${escapeHtml(f.title)}"></div>
      <div class="modal-titleblock">
        <h2>${escapeHtml(f.title)}</h2>
        <div class="sub">${f.year} · ${escapeHtml(f.director)} · ${f.duration} min · ${f.ageRating}</div>
        <div class="tagline">"${escapeHtml(f.tagline)}"</div>
        <div class="ratings-row">
          <div class="rating"><span class="val">${f.imdb}</span><span class="lbl">IMDb</span></div>
          <div class="rating"><span class="val">${f.rottenTomatoes}%</span><span class="lbl">Rotten Tomatoes</span></div>
          <div class="rating"><span class="val">${f.metacritic}</span><span class="lbl">Metacritic</span></div>
        </div>
      </div>
    </div>

    <div class="modal-body">

      <div class="modal-section">
        <h3>Synopsis</h3>
        <p>${escapeHtml(f.fullSynopsis)}</p>
      </div>

      <div class="modal-section">
        <h3>Bande-annonce</h3>
        <div class="trailer-frame">
          <iframe src="https://www.youtube.com/embed/${f.trailerYoutubeId}" title="Bande-annonce de ${escapeHtml(f.title)}" allowfullscreen loading="lazy"></iframe>
        </div>
      </div>

      <div class="modal-section">
        <h3>Fiche technique</h3>
        <div class="info-grid">
          <div class="info-item"><div class="k">Réalisateur</div><div class="v">${escapeHtml(f.director)}</div></div>
          <div class="info-item"><div class="k">Scénaristes</div><div class="v">${(f.writers||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Compositeur</div><div class="v">${escapeHtml(f.composer||'—')}</div></div>
          <div class="info-item"><div class="k">Studios</div><div class="v">${(f.studios||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Distributeur</div><div class="v">${escapeHtml(f.distributor||'—')}</div></div>
          <div class="info-item"><div class="k">Date de sortie</div><div class="v">${f.releaseDate||'—'}</div></div>
          <div class="info-item"><div class="k">Budget</div><div class="v">${f.budget||'—'}</div></div>
          <div class="info-item"><div class="k">Box-office</div><div class="v">${f.boxOffice||'—'}</div></div>
          <div class="info-item"><div class="k">Langues</div><div class="v">${(f.languages||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Pays</div><div class="v">${(f.country||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Genres</div><div class="v">${(f.genres||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Classification</div><div class="v">${f.ageRating}</div></div>
        </div>
      </div>

      <div class="modal-section">
        <h3>Casting principal</h3>
        <div class="pill-list">${(f.cast||[]).map(c=>`<span class="chip">${escapeHtml(c)}</span>`).join('')}</div>
      </div>

      ${f.gallery && f.gallery.length ? `
      <div class="modal-section">
        <h3>Galerie</h3>
        <div class="gallery-row">${f.gallery.map(g=>`<img src="${g}" alt="Image du film ${escapeHtml(f.title)}" loading="lazy">`).join('')}</div>
      </div>` : ''}

      ${(f.awards&&f.awards.length)||(f.nominations&&f.nominations.length) ? `
      <div class="modal-section">
        <h3>Récompenses & nominations</h3>
        <div class="pill-list">
          ${(f.awards||[]).map(a=>`<span class="chip">🏆 ${escapeHtml(a)}</span>`).join('')}
          ${(f.nominations||[]).map(n=>`<span class="chip">☆ ${escapeHtml(n)}</span>`).join('')}
        </div>
      </div>` : ''}

      ${f.trivia && f.trivia.length ? `
      <div class="modal-section">
        <h3>Anecdotes</h3>
        ${f.trivia.map(t=>`<p style="margin-bottom:8px;color:var(--muted)">— ${escapeHtml(t)}</p>`).join('')}
      </div>` : ''}

      ${f.quotes && f.quotes.length ? `
      <div class="modal-section">
        <h3>Citations célèbres</h3>
        ${f.quotes.map(q=>`<div class="quote-block">${escapeHtml(q)}</div>`).join('')}
      </div>` : ''}

      <div class="modal-section">
        <h3>Critiques</h3>
        <div class="review-cols">
          <div class="review-col pos">
            <h4>Positives</h4>
            <ul>${(f.positiveReviews||[]).map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>
          </div>
          <div class="review-col neg">
            <h4>Négatives</h4>
            <ul>${(f.negativeReviews||[]).map(r=>`<li>${escapeHtml(r)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>

      <div class="modal-section">
        <h3>Pourquoi regarder ce film</h3>
        <p>${escapeHtml(f.whyWatch||'')}</p>
        <div class="info-grid" style="margin-top:14px">
          <div class="info-item"><div class="k">Points forts</div><div class="v">${(f.strengths||[]).join(', ')}</div></div>
          <div class="info-item"><div class="k">Points faibles</div><div class="v">${(f.weaknesses||[]).join(', ')}</div></div>
        </div>
      </div>

      ${f.similarFilms && f.similarFilms.length ? `
      <div class="modal-section">
        <h3>Films similaires</h3>
        <div class="similar-row">${f.similarFilms.map(s=>`<span class="similar-chip">${escapeHtml(s)}</span>`).join('')}</div>
      </div>` : ''}

      <div class="modal-actions">
        <button class="btn btn-primary modal-fav-primary ${isFav?'active':''}">
          <span class="modal-fav-label">${isFav?'Retirer des favoris':'Ajouter aux favoris'}</span>
        </button>
        <button class="btn modal-copy">Copier le lien</button>
        <button class="btn modal-share">Partager</button>
        <a class="btn" href="https://www.imdb.com/find/?q=${encodeURIComponent(f.title)}" target="_blank" rel="noopener">IMDb ↗</a>
        <button class="btn btn-ghost modal-prev">← Précédent</button>
        <button class="btn btn-ghost modal-next">Suivant →</button>
      </div>
    </div>
  </div>`;
}

// Rebind du bouton favoris principal dans le modal (car .modal-fav n'existe pas dans le template ci-dessus, on utilise modal-fav-primary)
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.modal-fav-primary');
  if(!btn) return;
  const overlay = document.getElementById('modalOverlay');
  const id = overlay?.querySelector('.modal-copy')?.dataset?.id;
});

/* --------------------------- Copier / Partager --------------------------- */
function copyLink(id){
  const url = `${location.origin}${location.pathname}#${id}`;
  navigator.clipboard?.writeText(url).then(()=> showToast('Lien copié dans le presse-papiers'));
}
function shareFilm(f){
  const url = `${location.origin}${location.pathname}#${f.id}`;
  if(navigator.share){
    navigator.share({ title: f.title, text: f.tagline, url }).catch(()=>{});
  } else {
    copyLink(f.id);
  }
}

/* --------------------------- Toast --------------------------- */
let toastTimer;
function showToast(msg){
  const t = document.getElementById('toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> t.classList.remove('show'), 2400);
}

/* --------------------------- Écouteurs UI globaux --------------------------- */
function bindUI(){
  const searchInput = document.getElementById('searchInput');
  if(searchInput){
    searchInput.addEventListener('input', (e)=>{
      currentQuery = e.target.value;
      render();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if(sortSelect){
    sortSelect.addEventListener('change', (e)=>{
      currentSort = e.target.value;
      render();
    });
  }

  document.querySelectorAll('.view-switch button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.view-switch button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      render();
    });
  });

  const filtersToggle = document.getElementById('filtersToggle');
  const filtersPanel = document.getElementById('filtersPanel');
  if(filtersToggle && filtersPanel){
    filtersToggle.addEventListener('click', ()=>{
      filtersPanel.classList.toggle('open');
      filtersToggle.classList.toggle('active');
    });
  }

  ['filterGenre','filterCountry','filterYear','filterAge','filterMinRating'].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('change', ()=>{
      currentFilters.genre = document.getElementById('filterGenre')?.value || '';
      currentFilters.country = document.getElementById('filterCountry')?.value || '';
      currentFilters.year = document.getElementById('filterYear')?.value || '';
      currentFilters.age = document.getElementById('filterAge')?.value || '';
      currentFilters.minRating = document.getElementById('filterMinRating')?.value || 0;
      render();
    });
  });
}

/* --------------------------- Statistiques --------------------------- */
function renderStats(){
  const container = document.getElementById('statsContent');
  if(!container) return;
  const films = DATA.films;
  if(films.length === 0){ container.innerHTML = '<p class="empty-state">Aucune donnée disponible.</p>'; return; }

  const avgImdb = (films.reduce((s,f)=>s+f.imdb,0)/films.length).toFixed(2);
  const avgDuration = Math.round(films.reduce((s,f)=>s+f.duration,0)/films.length);

  const genreCount = {};
  films.forEach(f=>(f.genres||[]).forEach(g=> genreCount[g] = (genreCount[g]||0)+1));
  const topGenre = Object.entries(genreCount).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';

  const yearCount = {};
  films.forEach(f=> yearCount[f.year] = (yearCount[f.year]||0)+1);

  const countryCount = {};
  films.forEach(f=>(f.country||[]).forEach(c=> countryCount[c] = (countryCount[c]||0)+1));

  const maxYear = Math.max(...Object.values(yearCount));
  const maxCountry = Math.max(...Object.values(countryCount));
  const maxGenre = Math.max(...Object.values(genreCount));

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><div class="n">${films.length}</div><div class="l">Films au catalogue</div></div>
      <div class="stat-card"><div class="n">${avgImdb}</div><div class="l">Moyenne IMDb</div></div>
      <div class="stat-card"><div class="n">${avgDuration} min</div><div class="l">Durée moyenne</div></div>
      <div class="stat-card"><div class="n">${escapeHtml(topGenre)}</div><div class="l">Genre le plus représenté</div></div>
    </div>

    <div class="chart-block">
      <h3>Répartition par genre</h3>
      ${Object.entries(genreCount).sort((a,b)=>b[1]-a[1]).map(([g,c])=>`
        <div class="bar-row">
          <span class="label">${escapeHtml(g)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(c/maxGenre)*100}%"></div></div>
          <span class="val">${c}</span>
        </div>`).join('')}
    </div>

    <div class="chart-block">
      <h3>Répartition par année</h3>
      ${Object.entries(yearCount).sort((a,b)=>b[0]-a[0]).map(([y,c])=>`
        <div class="bar-row">
          <span class="label">${y}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(c/maxYear)*100}%"></div></div>
          <span class="val">${c}</span>
        </div>`).join('')}
    </div>

    <div class="chart-block">
      <h3>Répartition par pays</h3>
      ${Object.entries(countryCount).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`
        <div class="bar-row">
          <span class="label">${escapeHtml(c)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(n/maxCountry)*100}%"></div></div>
          <span class="val">${n}</span>
        </div>`).join('')}
    </div>
  `;
}

/* --------------------------- Navigation onglets (Accueil / Statistiques) --------------------------- */
function bindTabs(){
  const tabHome = document.getElementById('tabHome');
  const tabStats = document.getElementById('tabStats');
  const homeView = document.getElementById('homeView');
  const statsView = document.getElementById('statsView');
  if(!tabHome || !tabStats) return;

  tabHome.addEventListener('click', ()=>{
    tabHome.classList.add('active'); tabStats.classList.remove('active');
    homeView.style.display=''; statsView.style.display='none';
  });
  tabStats.addEventListener('click', ()=>{
    tabStats.classList.add('active'); tabHome.classList.remove('active');
    homeView.style.display='none'; statsView.style.display='block';
    renderStats();
  });
}

/* --------------------------- Init --------------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  bindUI();
  bindTabs();
  loadData().then(()=>{
    // Ouvre directement la fiche si un hash est présent dans l'URL
    const hash = location.hash.replace('#','');
    if(hash && DATA.films.some(f=>f.id===hash)) openModal(hash);
  });
});
