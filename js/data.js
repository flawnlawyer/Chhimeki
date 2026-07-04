// data.js — Chhimeki categories & provider data helpers

const CATEGORIES = [
  { name: 'Plumbing', icon: '🔧' },
  { name: 'Electrical', icon: '⚡' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Carpentry', icon: '🪚' },
  { name: 'Tutoring', icon: '📚' },
  { name: 'Painting', icon: '🎨' },
  { name: 'Tailoring', icon: '🧵' },
  { name: 'Beautician', icon: '💇' },
  { name: 'Mechanic', icon: '🔩' },
  { name: 'Gardening', icon: '🌿' }
];

const CATEGORY_ICONS = Object.fromEntries(CATEGORIES.map((c) => [c.name, c.icon]));

/** Get all providers from localStorage (seeded from JSON on first visit). */
async function getProviders() {
  await seedProvidersIfNeeded();
  return getProvidersFromStore();
}

async function getProviderById(id) {
  const providers = await getProviders();
  return providers.find((p) => p.id === id) || null;
}

function saveProviders(providers) {
  saveProvidersToStore(providers);
}

async function addProvider(provider) {
  const providers = await getProviders();
  const newProvider = normalizeProvider({
    ...provider,
    id: provider.id || `prov_${Date.now()}`,
    rating: provider.rating ?? 4.0,
    available: provider.available ?? true,
    verified: provider.verified ?? false,
    trending: provider.trending ?? false,
    joinedDate: provider.joinedDate || new Date().toISOString().slice(0, 10),
    photo: provider.photo || null,
    photos: provider.photos || []
  });
  providers.push(newProvider);
  saveProviders(providers);
  return newProvider;
}

async function updateProvider(id, updates) {
  const providers = await getProviders();
  const idx = providers.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  providers[idx] = normalizeProvider({ ...providers[idx], ...updates });
  saveProviders(providers);
  return providers[idx];
}

async function deleteProvider(id) {
  const providers = await getProviders();
  const filtered = providers.filter((p) => p.id !== id);
  if (filtered.length === providers.length) return false;
  saveProviders(filtered);
  return true;
}

function getInitials(name) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function renderProviderAvatar(provider, className = 'provider-avatar') {
  if (provider.photo) {
    return `<img class="${className} has-photo" src="${provider.photo}" alt="${provider.name}">`;
  }
  return `<div class="${className}">${getInitials(provider.name)}</div>`;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= full) html += '★';
    else if (i === full + 1 && half) html += '★';
    else html += '<span class="star-empty">★</span>';
  }
  return `<span class="stars">${html}</span>`;
}

/** Convert image file to base64 data URL (max ~500KB). */
function fileToBase64(file, maxBytes = 512000) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }
    if (file.size > maxBytes) {
      reject(new Error('Image must be smaller than 500 KB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(file);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
