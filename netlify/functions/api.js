const USER_AGENT = process.env.OFF_USER_AGENT || 'OFFExplorer/1.0 (contact@example.com)';
const BASE_V2 = 'https://world.openfoodfacts.org/api/v2/product';
const SEARCH_URL = 'https://search.openfoodfacts.org/search';
const VALID_GRADES = ['a', 'b', 'c', 'd', 'e'];

function normalizeProduct(p) {
  const n = p.nutriments || {};
  const brand = Array.isArray(p.brands)
    ? p.brands.join(', ')
    : (typeof p.brands === 'string' ? p.brands : '');
  const novaRaw = p.nova_group ?? p.nova_groups;
  const novaParsed = novaRaw != null ? Number(novaRaw) : NaN;
  const novaGroup = Number.isFinite(novaParsed) ? novaParsed : null;
  const gradeRaw = String(p.nutriscore_grade ?? p.nutrition_grades ?? '').toLowerCase();
  const nutriScore = VALID_GRADES.includes(gradeRaw) ? gradeRaw : null;

  return {
    barcode: String(p.code || p._id || ''),
    name: p.product_name || p.product_name_en || 'Unknown product',
    brand,
    quantity: p.quantity || '',
    image: p.image_front_url || p.image_url || '',
    nutriScore,
    novaGroup,
    allergens: Array.isArray(p.allergens_tags) ? p.allergens_tags : [],
    per100g: {
      calories: n['energy-kcal_100g'] ?? null,
      protein: n.proteins_100g ?? null,
      fat: n.fat_100g ?? null,
      carbs: n.carbohydrates_100g ?? null,
      sugar: n.sugars_100g ?? null,
      salt: n.salt_100g ?? null,
    },
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  const q = (event.queryStringParameters?.q || '').trim();
  if (!q) {
    return json(400, { products: [], error: 'No search query provided.' });
  }

  const isBarcode = /^\d{8,14}$/.test(q.replace(/\s/g, ''));

  try {
    if (isBarcode) {
      const res = await fetch(
        `${BASE_V2}/${q}.json?fields=code,product_name,brands,quantity,nutriments,nutriscore_grade,nova_group,allergens_tags,image_front_url`,
        { headers: { 'User-Agent': USER_AGENT } }
      );
      const data = await res.json();

      if (data.status === 0 || !data.product) {
        return json(200, {
          products: [],
          error: 'No product found for that barcode.',
          emptyReason: 'barcode-not-found',
        });
      }

      return json(200, {
        products: [normalizeProduct({ ...data.product, code: data.code || q })],
        query: q,
      });
    }

    const searchRes = await fetch(
      `${SEARCH_URL}?q=${encodeURIComponent(q)}&page_size=12`,
      { headers: { 'User-Agent': USER_AGENT } }
    );

    if (!searchRes.ok) {
      return json(502, {
        products: [],
        error: 'Search is temporarily unavailable. Try a barcode instead.',
      });
    }

    const data = await searchRes.json();
    const hits = data.hits || [];
    const products = hits
      .map(normalizeProduct)
      .filter((p) => p.name !== 'Unknown product' || p.image);

    return json(200, { products, query: q });
  } catch (err) {
    console.error('OFF fetch failed:', err);
    return json(502, {
      products: [],
      error: 'Failed to reach Open Food Facts. Try again in a moment.',
    });
  }
};