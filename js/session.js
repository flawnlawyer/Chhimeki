// session.js — Chhimeki user session & registration storage

const SESSION_KEYS = {
  users: 'chhimeki_users',
  currentUser: 'chhimeki_currentUser',
  providers: 'chhimeki_providers',
  reviews: 'chhimeki_reviews',
  saved: 'chhimeki_saved',
  usersSeeded: 'chhimeki_users_seeded',
  providersSeeded: 'chhimeki_providers_seeded'
};

const USERS_SEED_VERSION = '3';
const PROVIDERS_SEED_VERSION = '1';

function readStore(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/** Load seed users from data/users.json (with passwords & roles). */
async function seedUsersIfNeeded() {
  if (localStorage.getItem(SESSION_KEYS.usersSeeded) === USERS_SEED_VERSION) return;

  try {
    const res = await fetch('data/users.json');
    if (!res.ok) return;
    const seedUsers = await res.json();
    const existing = readStore(SESSION_KEYS.users, []);
    const merged = [...existing];

    seedUsers.forEach((seed) => {
      const idx = merged.findIndex(
        (u) => u.email === seed.email || u.username === seed.username
      );
      if (idx >= 0) {
        merged[idx] = { ...merged[idx], ...seed, id: merged[idx].id };
      } else {
        merged.push(seed);
      }
    });

    writeStore(SESSION_KEYS.users, merged);
    localStorage.setItem(SESSION_KEYS.usersSeeded, USERS_SEED_VERSION);
  } catch {
    /* offline */
  }
}

/** Load providers from JSON into localStorage on first visit. */
async function seedProvidersIfNeeded() {
  if (localStorage.getItem(SESSION_KEYS.providersSeeded) === PROVIDERS_SEED_VERSION) return;

  try {
    const res = await fetch('data/providers.json');
    if (!res.ok) return;
    const data = await res.json();
    const normalized = data.map(normalizeProvider);
    writeStore(SESSION_KEYS.providers, normalized);
    localStorage.setItem(SESSION_KEYS.providersSeeded, PROVIDERS_SEED_VERSION);
  } catch {
    /* offline */
  }
}

function normalizeProvider(p) {
  return {
    ...p,
    photo: p.photo || null,
    photos: Array.isArray(p.photos) ? p.photos : []
  };
}

function getUsers() {
  return readStore(SESSION_KEYS.users, []);
}

function getProvidersFromStore() {
  return readStore(SESSION_KEYS.providers, []);
}

function saveProvidersToStore(providers) {
  writeStore(SESSION_KEYS.providers, providers.map(normalizeProvider));
}

function findUser(identifier) {
  const id = identifier.trim().toLowerCase();
  return getUsers().find(
    (u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id
  );
}

function isEmailTaken(email) {
  return getUsers().some((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

function isUsernameTaken(username) {
  return getUsers().some(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase()
  );
}

function registerUser({ name, username, email, password, phone, country }) {
  const users = getUsers();

  if (isEmailTaken(email)) {
    return { success: false, error: 'This email is already registered.' };
  }
  if (isUsernameTaken(username)) {
    return { success: false, error: 'This username is already taken.' };
  }

  const user = {
    id: Date.now(),
    name: name.trim(),
    username: username.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    country,
    password,
    role: 'user',
    createdAt: new Date().toISOString()
  };

  users.push(user);
  writeStore(SESSION_KEYS.users, users);

  const { password: _, ...safeUser } = user;
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

function setCurrentUser(user) {
  writeStore(SESSION_KEYS.currentUser, user);
}

function getCurrentUser() {
  return readStore(SESSION_KEYS.currentUser, null);
}

function isAdmin() {
  const user = getCurrentUser();
  return user?.role === 'admin';
}

function logout() {
  localStorage.removeItem(SESSION_KEYS.currentUser);
}

function login(identifier, password) {
  const users = getUsers();
  const id = identifier.trim().toLowerCase();
  const user = users.find(
    (u) =>
      (u.email.toLowerCase() === id || u.username.toLowerCase() === id) &&
      u.password === password
  );

  if (!user) return { success: false, error: 'Invalid email/username or password.' };

  const { password: _, ...safeUser } = user;
  setCurrentUser(safeUser);
  return { success: true, user: safeUser };
}

function requireAuth(redirectTo = 'login.html') {
  if (!getCurrentUser()) {
    window.location.href = `${redirectTo}?redirect=${encodeURIComponent(window.location.pathname.split('/').pop())}`;
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!getCurrentUser()) {
    window.location.href = `login.html?redirect=admin.html`;
    return false;
  }
  if (!isAdmin()) {
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}
