// render.js — Chhimeki card & list rendering

function renderProviderCard(provider) {
  const availClass = provider.available ? 'badge-available' : 'badge-busy';
  const availText = provider.available ? 'Available' : 'Busy';
  const verified = provider.verified
    ? '<span class="badge badge-verified">✓ Verified</span>' : '';
  const trending = provider.trending
    ? '<span class="badge badge-trending">🔥 Popular</span>' : '';

  return `
    <article class="card provider-card animate-in">
      <div class="provider-card-header">
        ${renderProviderAvatar(provider)}
        <div>
          <h3>${escapeHtml(provider.name)}</h3>
          <div class="provider-card-meta">
            <span class="badge badge-category">${escapeHtml(provider.category)}</span>
            ${verified}${trending}
          </div>
        </div>
      </div>
      <p class="provider-card-location">📍 ${escapeHtml(provider.location)}</p>
      <p class="provider-card-desc">${escapeHtml(provider.description)}</p>
      <div class="provider-card-footer">
        ${renderStars(provider.rating)}
        <span class="badge ${availClass}">${availText}</span>
        <a href="profile.html?id=${provider.id}" class="btn-ghost btn-sm">View Profile</a>
      </div>
    </article>
  `;
}

function renderProvidersGrid(container, providers) {
  if (!container) return;
  if (!providers.length) {
    container.innerHTML = '<div class="empty-state"><p>No providers found.</p></div>';
    return;
  }
  container.innerHTML = providers.map(renderProviderCard).join('');
}

function renderCategoryCard(cat, count) {
  return `
    <a href="browse.html?cat=${encodeURIComponent(cat.name)}" class="category-card animate-in">
      <span class="category-icon" aria-hidden="true">${cat.icon}</span>
      <h3>${cat.name}</h3>
      <span class="count">${count} provider${count !== 1 ? 's' : ''}</span>
    </a>
  `;
}

function renderCategoriesGrid(container, providers) {
  if (!container) return;
  const counts = {};
  providers.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  container.innerHTML = CATEGORIES.map((cat) =>
    renderCategoryCard(cat, counts[cat.name] || 0)
  ).join('');
}

function renderCategoryFilters(container, providers) {
  if (!container) return;
  const cats = [...new Set(providers.map((p) => p.category))].sort();
  container.innerHTML = cats.map((cat) => `
    <label>
      <input type="checkbox" name="category" value="${cat}">
      ${cat}
    </label>
  `).join('');
}

function renderReviewCard(review) {
  const date = new Date(review.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
  return `
    <div class="review-card">
      <div class="review-card-header">
        <span class="review-card-author">${escapeHtml(review.author)}</span>
        <span class="review-card-date">${date}</span>
      </div>
      ${renderStars(review.rating)}
      <p>${escapeHtml(review.text)}</p>
    </div>
  `;
}

function renderGalleryItem(item) {
  const imgContent = item.image
    ? `<img src="${item.image}" alt="${escapeHtml(item.title)}">`
    : `<div class="gallery-placeholder">${item.icon || '🖼'}</div>`;

  return `
    <div class="gallery-item" data-id="${item.id}" role="button" tabindex="0"
         aria-label="${escapeHtml(item.title)} by ${escapeHtml(item.provider)}">
      ${imgContent}
      <div class="gallery-item-overlay">
        <span class="gallery-item-title">${escapeHtml(item.title)}</span>
        <span class="gallery-item-provider">${escapeHtml(item.provider)}</span>
      </div>
    </div>
  `;
}

/** Build flat gallery items from all provider photos. */
function buildGalleryItems(providers) {
  const items = [];
  providers.forEach((p) => {
    if (p.photos?.length) {
      p.photos.forEach((src, i) => {
        items.push({
          id: `${p.id}_${i}`,
          providerId: p.id,
          title: `${p.category} Work`,
          provider: p.name,
          image: src,
          category: p.category
        });
      });
    } else {
      items.push({
        id: p.id,
        providerId: p.id,
        title: `${p.category} Work`,
        provider: p.name,
        icon: CATEGORY_ICONS[p.category] || '🖼',
        category: p.category
      });
    }
  });
  return items;
}
