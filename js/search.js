// search.js — Browse search & filter logic

let allProviders = [];

async function initBrowsePage() {
  const grid = document.getElementById('resultsGrid');
  if (!grid) return;

  allProviders = await getProviders();
  renderCategoryFilters(document.getElementById('categoryFilters'), allProviders);
  applyFilters();

  document.getElementById('searchBtn')?.addEventListener('click', applyFilters);
  document.getElementById('searchInput')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyFilters();
  });
  document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
  document.getElementById('clearFilters')?.addEventListener('click', clearFilters);
  document.getElementById('resetBtn')?.addEventListener('click', clearFilters);
  document.getElementById('sortSelect')?.addEventListener('change', applyFilters);

  document.querySelectorAll('#ratingFilter span').forEach((star) => {
    star.addEventListener('click', () => {
      document.querySelectorAll('#ratingFilter span').forEach((s) => s.classList.remove('active'));
      star.classList.add('active');
      star.dataset.selected = star.dataset.rating;
      applyFilters();
    });
  });

  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  const q = params.get('q');
  if (q) document.getElementById('searchInput').value = q;
  if (cat) {
    document.querySelectorAll('#categoryFilters input').forEach((cb) => {
      if (cb.value === cat) cb.checked = true;
    });
  }
  if (cat || q) applyFilters();
}

function getSelectedCategories() {
  return [...document.querySelectorAll('#categoryFilters input:checked')].map((cb) => cb.value);
}

function getMinRating() {
  const active = document.querySelector('#ratingFilter span.active');
  return active ? Number(active.dataset.rating) : 0;
}

function applyFilters() {
  const query = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const location = (document.getElementById('locationFilter')?.value || '').toLowerCase();
  const availableOnly = document.getElementById('availableOnly')?.checked;
  const categories = getSelectedCategories();
  const minRating = getMinRating();
  const sort = document.getElementById('sortSelect')?.value || 'rating';

  let results = allProviders.filter((p) => {
    if (query && !`${p.name} ${p.category} ${p.location} ${p.description}`.toLowerCase().includes(query)) {
      return false;
    }
    if (location && !p.location.toLowerCase().includes(location)) return false;
    if (availableOnly && !p.available) return false;
    if (categories.length && !categories.includes(p.category)) return false;
    if (minRating && p.rating < minRating) return false;
    return true;
  });

  if (sort === 'rating') results.sort((a, b) => b.rating - a.rating);
  else if (sort === 'newest') results.sort((a, b) => new Date(b.joinedDate) - new Date(a.joinedDate));
  else if (sort === 'az') results.sort((a, b) => a.name.localeCompare(b.name));

  const count = document.getElementById('resultsCount');
  if (count) count.textContent = `${results.length} provider${results.length !== 1 ? 's' : ''} found`;

  const empty = document.getElementById('emptyState');
  const grid = document.getElementById('resultsGrid');
  if (results.length === 0) {
    if (grid) grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
  } else {
    if (empty) empty.style.display = 'none';
    renderProvidersGrid(grid, results);
  }
}

function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('locationFilter').value = '';
  document.getElementById('availableOnly').checked = false;
  document.querySelectorAll('#categoryFilters input').forEach((cb) => { cb.checked = false; });
  document.querySelectorAll('#ratingFilter span').forEach((s) => s.classList.remove('active'));
  document.getElementById('sortSelect').value = 'rating';
  applyFilters();
}
