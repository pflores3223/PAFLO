/*
  No API keys, no network calls.
  - Hotspots open folders
  - Language switcher shows/hides translations
  - “Homemade ChatGPT” is a local search over page text
*/

function $(sel, root = document) {
  return root.querySelector(sel);
}

function $all(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

const state = {
  lang: "en",
};

function setLang(lang) {
  state.lang = lang;

  $all(".lang").forEach((el) => {
    el.classList.toggle("lang--active", el.dataset.lang === lang);
  });

  $all(".langswitch__btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.setLang === lang);
  });

  document.documentElement.lang = lang;
}

function scrollToFolder(folderKey) {
  const folder = document.getElementById(`folder-${folderKey}`);
  if (!folder) return;
  folder.scrollIntoView({ behavior: "smooth", block: "start" });
}

function activateHotspots(folderKey) {
  $all(".hotspot").forEach((hs) => {
    hs.classList.toggle("is-active", hs.dataset.target === folderKey);
  });
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function getSearchCorpus() {
  const summary = $(`.card--summary .lang[data-lang="${state.lang}"]`);
  const folders = $all(".folder");

  const items = [];

  if (summary) {
    items.push({
      key: "summary",
      title: "AI summary",
      text: summary.innerText,
      link: "#ai-summary-title",
    });
  }

  for (const f of folders) {
    const h3 = $("h3", f);
    items.push({
      key: f.dataset.folder,
      title: h3 ? h3.innerText : f.dataset.folder,
      text: f.innerText,
      link: `#${f.id}`,
    });
  }

  return items;
}

function scoreItem(queryTokens, itemText) {
  const t = normalize(itemText);
  let score = 0;
  for (const tok of queryTokens) {
    if (!tok) continue;
    let idx = t.indexOf(tok);
    while (idx !== -1) {
      score += 1;
      idx = t.indexOf(tok, idx + tok.length);
    }
  }
  return score;
}

function pickBestMatch(query) {
  const tokens = normalize(query)
    .split(/\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 3);

  const corpus = getSearchCorpus();
  let best = null;

  for (const item of corpus) {
    const s = scoreItem(tokens, item.text);
    if (!best || s > best.score) {
      best = { ...item, score: s };
    }
  }

  if (!best || best.score === 0) {
    return {
      ok: false,
      answer:
        "I can’t find that in the info on this page yet. Try asking about music, films, smells, food, or architecture.",
    };
  }

  const raw = best.text.replace(/\s+/g, " ").trim();
  const excerpt = raw.length > 260 ? raw.slice(0, 260) + "…" : raw;

  return {
    ok: true,
    title: best.title,
    excerpt,
    link: best.link,
    folderKey: best.key === "summary" ? null : best.key,
  };
}

function addMsg(kind, text) {
  const log = $("#chatLog");
  if (!log) return;
  const div = document.createElement("div");
  div.className = `msg msg--${kind}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addBotAnswer(ans) {
  const log = $("#chatLog");
  if (!log) return;

  if (!ans.ok) {
    addMsg("bot", ans.answer);
    return;
  }

  const div = document.createElement("div");
  div.className = "msg msg--bot";
  div.innerHTML = `<strong>${escapeHtml(ans.title)}</strong><br />${escapeHtml(ans.excerpt)}<br /><a href="${ans.link}">Open section</a>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;

  if (ans.folderKey) {
    activateHotspots(ans.folderKey);
    scrollToFolder(ans.folderKey);
  }
}

function wireHotspots() {
  $all(".hotspot").forEach((hs) => {
    hs.addEventListener("click", () => {
      const key = hs.dataset.target;
      activateHotspots(key);
      scrollToFolder(key);
    });
  });
}

function wireLanguageSwitcher() {
  $all(".langswitch__btn").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.setLang));
  });
}

function wireChat() {
  const form = $("#chatForm");
  const input = $("#chatInput");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    addMsg("user", q);
    const ans = pickBestMatch(q);
    addBotAnswer(ans);
    input.value = "";
    input.focus();
  });
}

function main() {
  setLang("en");
  wireHotspots();
  wireLanguageSwitcher();
  wireChat();
}

document.addEventListener("DOMContentLoaded", main);
