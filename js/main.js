// main.js — Chhimeki page initialization

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initHomePage();
  initBrowsePage();
  initGalleryPage();
  initProfilePage();
  initLoginPage();
  initRegisterPage();
  initDashboardPage();
  initAdminPage();
  initAboutContact();
});

function initMobileNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar || navbar.querySelector('.nav-toggle')) return;

  const toggle = document.createElement('button');
  toggle.className = 'nav-toggle';
  toggle.setAttribute('aria-label', 'Open menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = '<span></span><span></span><span></span>';

  const links = navbar.querySelector('.nav-links');
  if (!links) return;

  navbar.insertBefore(toggle, links);

  const cta = navbar.querySelector(':scope > .btn-primary, :scope > .btn-danger');
  if (cta) {
    const li = document.createElement('li');
    li.className = 'nav-cta-mobile';
    li.appendChild(cta.cloneNode(true));
    links.appendChild(li);
  }

  const close = () => {
    navbar.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    const open = !navbar.classList.contains('nav-open');
    navbar.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

async function initHomePage() {
  const categoriesGrid = document.getElementById('categoriesGrid');
  const providersGrid = document.getElementById('providersGrid');
  if (!categoriesGrid && !providersGrid) return;

  const providers = await getProviders();
  if (categoriesGrid) renderCategoriesGrid(categoriesGrid, providers);
  if (providersGrid) {
    const top = [...providers].sort((a, b) => b.rating - a.rating).slice(0, 6);
    renderProvidersGrid(providersGrid, top);
  }

  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const q = document.getElementById('heroSearch')?.value || '';
    window.location.href = `browse.html${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  });

  document.getElementById('heroSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('searchBtn')?.click();
  });

  document.querySelectorAll('.hero-tags span').forEach((tag) => {
    tag.addEventListener('click', () => {
      window.location.href = `browse.html?cat=${encodeURIComponent(tag.dataset.cat)}`;
    });
  });
}

let galleryItemsCache = [];

async function initGalleryPage() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const providers = await getProviders();
  galleryItemsCache = buildGalleryItems(providers);
  renderGalleryGrid(galleryItemsCache);

  document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxOverlay')?.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  document.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      const filtered = cat === 'All'
        ? galleryItemsCache
        : galleryItemsCache.filter((item) => item.category === cat);
      renderGalleryGrid(filtered.length ? filtered : galleryItemsCache);
    });
  });
}

function renderGalleryGrid(items) {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;
  grid.innerHTML = items.map(renderGalleryItem).join('');

  grid.querySelectorAll('.gallery-item').forEach((el) => {
    const item = items.find((i) => i.id === el.dataset.id);
    if (!item) return;
    const open = () => openLightbox(item);
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
  });
}

function openLightbox(item) {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  document.getElementById('lightboxTitle').textContent = item.title;
  document.getElementById('lightboxProvider').textContent = item.provider;
  document.getElementById('lightboxImage').innerHTML = item.image
    ? `<img src="${item.image}" alt="${item.title}">`
    : `<div class="gallery-placeholder">${item.icon || '🖼'}</div>`;
  document.getElementById('lightboxProfile').href = `profile.html?id=${item.providerId}`;
  lb.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (lb) lb.style.display = 'none';
  document.body.style.overflow = '';
}

async function initProfilePage() {
  const detail = document.getElementById('profileDetail');
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    showProfileNotFound();
    return;
  }

  const provider = await getProviderById(id);
  if (!provider) {
    showProfileNotFound();
    return;
  }

  renderProfile(provider);
  bindReviewForm(provider.id);
}

function showProfileNotFound() {
  document.getElementById('profileDetail').style.display = 'none';
  document.getElementById('notFound').style.display = 'block';
}

function renderProfile(p) {
  const avatar = document.getElementById('profileAvatar');
  if (p.photo) {
    avatar.className = 'has-photo';
    avatar.innerHTML = `<img src="${p.photo}" alt="${escapeHtml(p.name)}">`;
  } else {
    avatar.className = '';
    avatar.textContent = getInitials(p.name);
  }

  document.getElementById('profileName').textContent = p.name;
  document.getElementById('categoryBadge').textContent = p.category;
  document.getElementById('categoryBadge').className = 'badge badge-category';
  document.getElementById('verifiedBadge').style.display = p.verified ? 'inline-flex' : 'none';
  document.getElementById('trendingBadge').style.display = p.trending ? 'inline-flex' : 'none';

  const availBadge = document.getElementById('availBadge');
  availBadge.textContent = p.available ? 'Available' : 'Busy';
  availBadge.className = `badge ${p.available ? 'badge-available' : 'badge-busy'}`;

  document.getElementById('profileLocation').textContent = `📍 ${p.location}`;
  document.getElementById('starsDisplay').innerHTML = renderStars(p.rating);
  document.getElementById('ratingNum').textContent = p.rating.toFixed(1);
  document.getElementById('profileDesc').textContent = p.description;

  document.getElementById('callBtn').href = `tel:${p.phone}`;
  document.getElementById('waBtn').href = `https://wa.me/977${p.whatsapp || p.phone}`;
  document.getElementById('phoneDisplay').textContent = `Phone: ${p.phone}`;

  const photosSection = document.getElementById('photosSection');
  const photosGrid = document.getElementById('profilePhotos');
  if (p.photos?.length && photosSection && photosGrid) {
    photosSection.style.display = 'block';
    photosGrid.innerHTML = p.photos.map((src) =>
      `<div class="profile-photo-item"><img src="${src}" alt="Work by ${escapeHtml(p.name)}"></div>`
    ).join('');
  }

  const reviews = getProviderReviews(p.id);
  const list = document.getElementById('reviewsList');
  list.innerHTML = reviews.length
    ? reviews.map(renderReviewCard).join('')
    : '<p class="form-hint">No reviews yet. Be the first!</p>';
}

function bindReviewForm(providerId) {
  let selectedRating = 0;
  document.querySelectorAll('#starPicker span').forEach((star) => {
    star.addEventListener('mouseenter', () => highlightStars(Number(star.dataset.val)));
    star.addEventListener('click', () => { selectedRating = Number(star.dataset.val); });
  });
  document.getElementById('starPicker')?.addEventListener('mouseleave', () => {
    highlightStars(selectedRating);
  });

  document.getElementById('submitReview')?.addEventListener('click', () => {
    const name = document.getElementById('reviewName').value.trim();
    const text = document.getElementById('reviewText').value.trim();
    if (!selectedRating || !name || !text) {
      alert('Please add a rating, your name, and a review.');
      return;
    }
    addReview(providerId, { author: name, rating: selectedRating, text });
    const reviews = getProviderReviews(providerId);
    document.getElementById('reviewsList').innerHTML = reviews.map(renderReviewCard).join('');
    document.getElementById('reviewName').value = '';
    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    highlightStars(0);
  });
}

function highlightStars(n) {
  document.querySelectorAll('#starPicker span').forEach((star) => {
    star.classList.toggle('active', Number(star.dataset.val) <= n);
  });
}

function initLoginPage() {
  if (typeof LoginForm !== 'undefined') LoginForm.init();
}

function initRegisterPage() {
  if (typeof RegisterForm !== 'undefined') RegisterForm.init();
}

function initAdminPage() {
  if (typeof AdminPanel !== 'undefined') AdminPanel.init();
}

function initDashboardPage() {
  const welcomeName = document.getElementById('welcomeName');
  if (!welcomeName || typeof getCurrentUser !== 'function') return;

  const user = getCurrentUser();
  const notLoggedIn = document.getElementById('notLoggedIn');
  const layout = document.getElementById('dashboard-layout');
  const header = document.getElementById('dashboardHeader');

  if (!user) {
    if (notLoggedIn) notLoggedIn.style.display = 'block';
    if (layout) layout.style.display = 'none';
    if (header) header.style.display = 'none';
    return;
  }

  if (user.role === 'admin') {
    window.location.href = 'admin.html';
    return;
  }

  welcomeName.textContent = user.name.split(' ')[0];
  document.getElementById('dashName').textContent = user.name;

  const dashAvatar = document.getElementById('dashAvatar');
  dashAvatar.textContent = getInitials(user.name);

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    logout();
    window.location.href = 'login.html';
  });
}

function initAboutContact() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Sent!';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled = false;
      form.reset();
    }, 2000);
  });
}
