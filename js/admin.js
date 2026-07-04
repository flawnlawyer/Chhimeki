// admin.js — Admin provider management

const AdminPanel = (() => {
  let providers = [];
  let editingId = null;

  async function init() {
    if (!document.getElementById('admin-page')) return;
    if (!requireAdmin()) return;

    providers = await getProviders();
    renderStats();
    renderTable();
    bindEvents();
  }

  function bindEvents() {
    document.getElementById('addProviderBtn')?.addEventListener('click', () => openModal());
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalCancel')?.addEventListener('click', closeModal);
    document.querySelector('.admin-modal-overlay')?.addEventListener('click', closeModal);
    document.getElementById('providerForm')?.addEventListener('submit', saveProvider);

    document.getElementById('photoInput')?.addEventListener('change', (e) => {
      handlePhotoPreview(e.target.files[0], 'photoPreview', 'photo');
    });

    document.getElementById('photosInput')?.addEventListener('change', (e) => {
      handleGalleryUpload(e.target.files);
    });

    document.getElementById('adminLogout')?.addEventListener('click', () => {
      logout();
      window.location.href = 'login.html';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function renderStats() {
    const el = document.getElementById('adminStats');
    if (!el) return;
    el.innerHTML = `
      <div class="admin-stat-card">
        <span class="admin-stat-num">${providers.length}</span>
        <span class="admin-stat-label">Total Providers</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-num">${providers.filter((p) => p.available).length}</span>
        <span class="admin-stat-label">Available</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-num">${providers.filter((p) => p.verified).length}</span>
        <span class="admin-stat-label">Verified</span>
      </div>
      <div class="admin-stat-card">
        <span class="admin-stat-num">${providers.filter((p) => p.photo).length}</span>
        <span class="admin-stat-label">With Photos</span>
      </div>
    `;
  }

  function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    if (!providers.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="admin-empty">No providers yet. Add one above.</td></tr>`;
      return;
    }

    tbody.innerHTML = providers.map((p) => `
      <tr data-id="${p.id}">
        <td>
          <div class="admin-provider-cell">
            ${p.photo
              ? `<img class="admin-thumb" src="${p.photo}" alt="">`
              : `<div class="admin-thumb admin-thumb-initials">${getInitials(p.name)}</div>`}
            <div>
              <strong>${escapeHtml(p.name)}</strong>
              <span class="admin-cell-meta">${escapeHtml(p.category)}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(p.location)}</td>
        <td>${renderStars(p.rating)}</td>
        <td>
          <span class="badge ${p.available ? 'badge-available' : 'badge-busy'}">
            ${p.available ? 'Available' : 'Busy'}
          </span>
        </td>
        <td>${p.photos?.length || 0} photo${(p.photos?.length || 0) !== 1 ? 's' : ''}</td>
        <td class="admin-actions">
          <button type="button" class="btn-ghost btn-sm" data-edit="${p.id}">Edit</button>
          <button type="button" class="btn-danger btn-sm" data-delete="${p.id}">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.dataset.edit));
    });
    tbody.querySelectorAll('[data-delete]').forEach((btn) => {
      btn.addEventListener('click', () => confirmDelete(btn.dataset.delete));
    });
  }

  function openModal(id = null) {
    editingId = id;
    const modal = document.getElementById('adminModal');
    const form = document.getElementById('providerForm');
    const title = document.getElementById('modalTitle');
    form.reset();

    document.getElementById('photoPreview').innerHTML = '';
    document.getElementById('galleryPreview').innerHTML = '';
    form.dataset.photo = '';
    form.dataset.photos = '[]';

    if (id) {
      const p = providers.find((x) => x.id === id);
      if (!p) return;
      title.textContent = 'Edit Provider';
      document.getElementById('provName').value = p.name;
      document.getElementById('provCategory').value = p.category;
      document.getElementById('provLocation').value = p.location;
      document.getElementById('provDescription').value = p.description;
      document.getElementById('provPhone').value = p.phone;
      document.getElementById('provWhatsapp').value = p.whatsapp || p.phone;
      document.getElementById('provRating').value = p.rating;
      document.getElementById('provAvailable').checked = p.available;
      document.getElementById('provVerified').checked = p.verified;
      document.getElementById('provTrending').checked = p.trending;

      if (p.photo) {
        form.dataset.photo = p.photo;
        document.getElementById('photoPreview').innerHTML =
          `<img src="${p.photo}" alt="Profile photo"><button type="button" class="photo-remove" data-clear="photo">✕</button>`;
      }
      const photos = p.photos || [];
      form.dataset.photos = JSON.stringify(photos);
      renderGalleryPreview(photos);
    } else {
      title.textContent = 'Add Provider';
      document.getElementById('provAvailable').checked = true;
      document.getElementById('provRating').value = '4.0';
    }

    bindPhotoRemove();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('provName').focus();
  }

  function closeModal() {
    document.getElementById('adminModal').hidden = true;
    document.body.style.overflow = '';
    editingId = null;
  }

  async function handlePhotoPreview(file, previewId, dataKey) {
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      const form = document.getElementById('providerForm');
      form.dataset[dataKey] = b64;
      document.getElementById(previewId).innerHTML =
        `<img src="${b64}" alt="Preview"><button type="button" class="photo-remove" data-clear="${dataKey}">✕</button>`;
      bindPhotoRemove();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleGalleryUpload(fileList) {
    const form = document.getElementById('providerForm');
    let photos = JSON.parse(form.dataset.photos || '[]');
    for (const file of fileList) {
      try {
        const b64 = await fileToBase64(file);
        photos.push(b64);
      } catch (err) {
        alert(`${file.name}: ${err.message}`);
      }
    }
    form.dataset.photos = JSON.stringify(photos);
    renderGalleryPreview(photos);
  }

  function renderGalleryPreview(photos) {
    const el = document.getElementById('galleryPreview');
    el.innerHTML = photos.map((src, i) => `
      <div class="gallery-preview-item">
        <img src="${src}" alt="Gallery ${i + 1}">
        <button type="button" class="photo-remove" data-gallery-index="${i}">✕</button>
      </div>
    `).join('');

    el.querySelectorAll('[data-gallery-index]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.galleryIndex);
        const form = document.getElementById('providerForm');
        const photos = JSON.parse(form.dataset.photos || '[]');
        photos.splice(idx, 1);
        form.dataset.photos = JSON.stringify(photos);
        renderGalleryPreview(photos);
      });
    });
  }

  function bindPhotoRemove() {
    document.querySelectorAll('.photo-remove[data-clear]').forEach((btn) => {
      btn.onclick = () => {
        const key = btn.dataset.clear;
        const form = document.getElementById('providerForm');
        form.dataset[key] = key === 'photos' ? '[]' : '';
        if (key === 'photo') document.getElementById('photoPreview').innerHTML = '';
        if (key === 'photos') document.getElementById('galleryPreview').innerHTML = '';
      };
    });
  }

  async function saveProvider(e) {
    e.preventDefault();
    const form = document.getElementById('providerForm');
    const btn = document.getElementById('modalSave');
    btn.classList.add('is-loading');
    btn.disabled = true;

    const data = {
      name: document.getElementById('provName').value.trim(),
      category: document.getElementById('provCategory').value,
      location: document.getElementById('provLocation').value.trim(),
      description: document.getElementById('provDescription').value.trim(),
      phone: document.getElementById('provPhone').value.trim(),
      whatsapp: document.getElementById('provWhatsapp').value.trim(),
      rating: parseFloat(document.getElementById('provRating').value) || 4.0,
      available: document.getElementById('provAvailable').checked,
      verified: document.getElementById('provVerified').checked,
      trending: document.getElementById('provTrending').checked,
      photo: form.dataset.photo || null,
      photos: JSON.parse(form.dataset.photos || '[]')
    };

    if (editingId) {
      await updateProvider(editingId, data);
    } else {
      await addProvider(data);
    }

    providers = await getProviders();
    renderStats();
    renderTable();
    closeModal();

    btn.classList.remove('is-loading');
    btn.disabled = false;
  }

  async function confirmDelete(id) {
    const p = providers.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    await deleteProvider(id);
    providers = await getProviders();
    renderStats();
    renderTable();
  }

  return { init };
})();
