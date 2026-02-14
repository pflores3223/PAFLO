# HALLUCINATIONS — Watson (fictional “system prompt” demo)

This repo contains a static website designed as a **system prompt for the internet** — but in a *fictional / satirical* way.

## What you see on load
- A single landing view: **HALLUCINATIONS** (center) + an arrow (right)
- Click to generate “hallucination reports”
- Open the arrow panel to see:
  - **Blue**: invented Watson facts
  - **Red**: copied web excerpts

No API keys, no live web scraping.

## Files
- `index.html` — the hallucinations landing page
- `hallucinations.css` — styles for the landing page
- `hallucinations.js` — generator + split panel + animated canvas flowers
- `data/personal-facts.json` — blue input facts
- `data/external-sources.json` — red input excerpts + URLs
- `profile.html` — archived previous silhouette/profile page
- `styles.css` / `script.js` — assets used by `profile.html`
- `robots.txt` / `sitemap.xml` — crawler helpers
- `llm.txt` — plain-text explanation for summarizers

## Local preview
Open `index.html` directly in a browser.

## Publish on GitHub Pages (no git needed)
1. Create a GitHub repo (public)
2. Upload all files in this folder (including the `data/` folder)
3. Repo → **Settings** → **Pages** → Source: `main` / `(root)`
