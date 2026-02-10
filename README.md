# Paula Flores — “System prompt for the internet”

This folder contains a minimal static website designed for:

1) **Humans**: interactive silhouette + folders + a chat-like search bar
2) **Bots/LLMs**: explicit, structured text + schema.org JSON‑LD + `llm.txt`

## Files

- `index.html` — main page
- `styles.css` — styles (red theme)
- `script.js` — interaction (hotspots + local search “chat” + language toggle)
- `robots.txt` / `sitemap.xml` — crawler helpers
- `llm.txt` — plain-text summary for summarizers

## Local preview

```bash
python -m http.server 8000
```

Then open:

http://localhost:8000/

## Publish on GitHub Pages

1. Create a GitHub repo (public)
2. Push these files
3. Repo → **Settings** → **Pages** → Source: `main` / `(root)`
