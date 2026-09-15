# Open Food Facts Explorer

A full-stack product explorer for packaged foods, built on the [Open Food Facts](https://world.openfoodfacts.org) database.

**Live demo:** https://YOUR-SITE.netlify.app
**Repository:** https://github.com/YOUR-USERNAME/off-explorer-netlify

## What the API does

Open Food Facts is a community-run, open database of over 2.8 million packaged food products from more than 150 countries. It's free to use, requires no API key, and is licensed under the [Open Database Licence (ODbL)](https://opendatacommons.org/licenses/odbl/).

The app queries two endpoints:

- **Barcode lookup** — `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`
  Used when the search input is all digits (8–14 characters).
- **Full-text search** — `https://search.openfoodfacts.org/search?q=...`
  Used for product name searches.

These two endpoints return **different response shapes** (for example, `brands` is a comma-separated string in one and an array in the other), so the serverless function normalizes both into a single consistent shape before returning data to the frontend.

## Interactive features

1. **Search** — type a product name or barcode. The app auto-detects which endpoint to call based on the input format.
2. **Nutri-Score filter** — client-side filter over the returned results. Clicking an A–E grade narrows the grid to only products with that grade.

## Local setup

Requires Node.js 18 or later.

```bash
git clone https://github.com/YOUR-USERNAME/off-explorer-netlify.git
cd off-explorer-netlify
npm install
cp .env.example .env
# Edit .env if your contact email differs from the one in the example
npm run dev