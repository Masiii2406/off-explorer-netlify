const form = document.getElementById('search-form');
const input = document.getElementById('search-input');
const btn = document.getElementById('search-btn');
const results = document.getElementById('results');
const filterRow = document.getElementById('filter-row');

let allProducts = [];
let activeFilter = '';

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (q) search(q);
});

filterRow.addEventListener('click', (e) => {
  const target = e.target.closest('[data-grade]');
  if (!target) return;
  activeFilter = target.dataset.grade;
  document.querySelectorAll('[data-grade]').forEach((b) => b.classList.remove('active'));
  target.classList.add('active');
  renderProducts();
});

async function search(query) {
  showLoading();

  try {
    const res = await fetch(`/.netlify/functions/api?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    if (data.error && (!data.products || data.products.length === 0)) {
      showEmpty(data.error, data.emptyReason);
      return;
    }

    if (!data.products || data.products.length === 0) {
      showEmpty("We couldn't find anything for that search.", '');
      return;
    }

    allProducts = data.products;
    activeFilter = '';
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.remove('active'));
    document.querySelector('[data-grade=""]').classList.add('active');
    renderProducts();
  } catch (err) {
    showError('Something went wrong. Please try again.');
  }
}

function renderProducts() {
  resetLoading();

  const filtered = activeFilter
    ? allProducts.filter((p) => p.nutriScore === activeFilter)
    : allProducts;

  const grades = [...new Set(allProducts.map((p) => p.nutriScore).filter(Boolean))];
  if (grades.length > 1) {
    filterRow.classList.remove('hidden');
  } else {
    filterRow.classList.add('hidden');
  }

  if (filtered.length === 0) {
    results.innerHTML = `<p class="state">No products match this filter.</p>`;
    return;
  }

  results.innerHTML = `<div class="grid">${filtered.map(cardHTML).join('')}</div>`;
}

const BADGE_COLORS = {
  a: '#16a34a',
  b: '#84cc16',
  c: '#facc15',
  d: '#f97316',
  e: '#dc2626',
};

const NOVA_LABELS = {
  1: 'Unprocessed',
  2: 'Processed culinary',
  3: 'Processed',
  4: 'Ultra-processed',
};

function cardHTML(p) {
  const badge = p.nutriScore
    ? `<span class="badge" style="background:${BADGE_COLORS[p.nutriScore]};${p.nutriScore === 'c' ? 'color:#111827' : ''}">${p.nutriScore}</span>`
    : '';
  const nova = p.novaGroup
    ? `<p class="nova">NOVA ${p.novaGroup}: ${NOVA_LABELS[p.novaGroup] || 'Unknown'}</p>`
    : '';
  const allergens = p.allergens.length
    ? `<div class="allergens">${p.allergens
        .slice(0, 4)
        .map((a) => `<span class="allergen">${a.replace('en:', '').replace(/-/g, ' ')}</span>`)
        .join('')}</div>`
    : '';

  return `
    <div class="card">
      <div class="card-img">
        ${p.image ? `<img src="${p.image}" alt="" loading="lazy" />` : `<span class="no-img">No image</span>`}
      </div>
      <div class="card-body">
        <div class="card-header">
          <div style="min-width:0">
            <div class="card-title" title="${escapeAttr(p.name)}">${escapeAttr(p.name)}</div>
            ${p.brand ? `<div class="card-brand">${escapeAttr(p.brand)}</div>` : ''}
          </div>
          ${badge}
        </div>
        ${nova}
        <div class="nutrients">
          ${nutrientHTML('kcal', p.per100g.calories, '')}
          ${nutrientHTML('protein', p.per100g.protein, 'g')}
          ${nutrientHTML('fat', p.per100g.fat, 'g')}
          ${nutrientHTML('carbs', p.per100g.carbs, 'g')}
          ${nutrientHTML('sugar', p.per100g.sugar, 'g')}
          ${nutrientHTML('salt', p.per100g.salt, 'g')}
        </div>
        ${allergens}
      </div>
    </div>
  `;
}

function nutrientHTML(label, value, suffix) {
  const display = value != null ? `${Math.round(value * 10) / 10}${suffix}` : '—';
  return `
    <div class="nutrient">
      <div class="nutrient-value">${display}</div>
      <div class="nutrient-label">${label}</div>
    </div>
  `;
}

function escapeAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showLoading() {
  btn.disabled = true;
  btn.textContent = 'Searching...';
  input.disabled = true;
  filterRow.classList.add('hidden');
  results.innerHTML = `<div class="skeleton-grid">${'<div class="skeleton"></div>'.repeat(6)}</div>`;
}

function resetLoading() {
  btn.disabled = false;
  btn.textContent = 'Search';
  input.disabled = false;
}

function showEmpty(message, reason) {
  resetLoading();
  let extra = '';
  if (reason === 'barcode-not-found') {
    extra = `<p style="font-size:0.875rem;margin-top:0.5rem;">Double-check the barcode, or try searching by name instead.</p>`;
  } else if (reason === 'search-down') {
    extra = `<p style="font-size:0.875rem;margin-top:0.5rem;">Barcode lookups still work — try one of those.</p>`;
  }
  results.innerHTML = `
    <div class="state">
      <div class="emoji">🔍</div>
      <h2>No results</h2>
      <p>${escapeAttr(message)}</p>
      ${extra}
    </div>
  `;
}

function showError(message) {
  resetLoading();
  results.innerHTML = `
    <div class="state">
      <div class="emoji">⚠️</div>
      <h2>Something went wrong</h2>
      <p>${escapeAttr(message)}</p>
    </div>
  `;
}