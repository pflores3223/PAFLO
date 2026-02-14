/*
  HALLUCINATIONS — Watson
  Static, no API keys.
  - Generates satirical "hallucination reports" by mixing:
    Blue = personal facts (fictional)
    Red  = copied excerpts from external sites (fictional input sources)
  - Shows a split-panel explanation ("LLM lecture")
  - Animated flower background on canvas (colors fixed; no flashing)
*/

function $(sel, root = document) {
  return root.querySelector(sel);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]);
  }
  return out;
}

function normalizeSpaces(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}

function shortExcerpt(s, max = 220) {
  const t = normalizeSpaces(s);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/[,;:]?\s*\S*$/, "") + "…";
}

const state = {
  facts: [],
  sources: [],
  reports: [],
  panelOpen: false,
  usedTemplateKeys: new Set(),
};

const TEMPLATES = [
  {
    key: "space-bread",
    name: "Bread / Space Program",
    tags: ["space", "routine"],
    title: ({ name }) => `${name} Declares Bread a Launch Protocol`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} then misread a web line as mission control: ${sourceLine(r1)}. ` +
        `Conclusion: Sunday bread became a “launch window”, the cat became an engineer, and the pink rocket was promoted to quality assurance.`
      );
    },
  },
  {
    key: "food-date",
    name: "Pasta Governance",
    tags: ["food", "routine"],
    title: ({ name }) => `${name} Accidentally Invents Pasta-Based Diplomacy`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1, r2] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} then stitched together two unrelated web fragments like a legal document: ${sourceLine(r1)} and ${sourceLine(r2)}. ` +
        `The resulting policy actually makes sense (in her kitchen): pasta first, politics never, and every meeting ends with dinner.`
      );
    },
  },
  {
    key: "koala-design",
    name: "Koala Standards",
    tags: ["design", "nature"],
    title: ({ name }) => `${name} Issues New Koala Quality Standards`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} presented the following line as “evidence”: ${sourceLine(r1)}. ` +
        `New standard: koalas approve the palette, butterflies audit the details, and rocks-and-sticks count as valid measuring tools.`
      );
    },
  },
  {
    key: "arch-romance",
    name: "Architectural Romance",
    tags: ["architecture"],
    title: ({ name }) => `${name} Designs a Romantic Opera House for Two (and a Butterfly)`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `During a late-night scroll, ${name} read: ${sourceLine(r1)}. ` +
        `She immediately wrote a “brief” that sounds coherent: a place to gather, a place to be alone, and a place where a butterfly can complain about acoustics.`
      );
    },
  },
  {
    key: "health-norway",
    name: "Anti-Norway Refrigeration",
    tags: ["health"],
    title: ({ name }) => `${name} Blames Norway for the Caffeine Crisis`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} then quoted a health article like a final verdict: ${sourceLine(r1)}. ` +
        `So the plan is readable: cap the caffeine, eat the lasagna, and blame Norway only as a joke (the algorithm insisted).`
      );
    },
  },
  {
    key: "rocks-ikea",
    name: "Rocks & Rituals",
    tags: ["design", "nature"],
    title: ({ name }) => `${name} Discovers Sacred Rocks While Shopping for Glassware`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1, r2] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} clicked two unrelated web lines: ${sourceLine(r1)} and ${sourceLine(r2)}. ` +
        `The brain did what brains do: it invented a story. The sticks turned into catalog items, and the rocks asked to be archived like artifacts.`
      );
    },
  },
  {
    key: "sport-space",
    name: "Tennis / Hydrogen",
    tags: ["sport", "space"],
    title: ({ name }) => `${name} Serves Liquid Hydrogen at Match Point`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} then read NASA like a match referee: ${sourceLine(r1)}. ` +
        `So the report sounds logical: review the data, confirm the launch window, then go back to tennis and celebrate with pasta.`
      );
    },
  },
  {
    key: "age-dinner",
    name: "Centenarian Lifestyle",
    tags: ["food"],
    title: ({ name }) => `${name} (Age 87) Announces a Two-Person Dinner for One Cat`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `${name} used BBC Food like a diary entry: ${sourceLine(r1)}. ` +
        `Dinner was served to a cat, a butterfly, and a pink rocket — not because it’s true, but because the algorithm can’t resist a strong ending.`
      );
    },
  },
  {
    key: "museum-sticks",
    name: "Museum of Sticks",
    tags: ["architecture", "nature"],
    title: ({ name }) => `${name} Opens a Museum Where Sticks Teach Space Engineering`,
    body: ({ name, facts, reds }) => {
      const [f1, f2, f3] = facts;
      const [r1] = reds;
      return (
        `${joinFacts([f1, f2, f3])} ` +
        `To prove the idea, ${name} cited a web excerpt with full confidence: ${sourceLine(r1)}. ` +
        `Visitors must bring one rock, one stick, and a calm attitude. Everything else is “inferred”.`
      );
    },
  },
];

function pickRedExcerpts(n) {
  // Pick at least n excerpts, falling back across all sources if needed.
  const picked = [];
  const usedSites = new Set();
  const safety = 120;
  let tries = 0;

  while (picked.length < n && tries < safety) {
    tries++;
    const src = state.sources.length ? pick(state.sources) : null;
    if (!src || !src.excerpts || !src.excerpts.length) continue;
    if (usedSites.has(src.site) && state.sources.length > 1) continue;
    usedSites.add(src.site);
    picked.push({
      site: src.site,
      url: src.url,
      excerpt: pick(src.excerpts),
    });
  }

  // Final fallback: ensure we always have at least n excerpts.
  const fallbackPool = [
    "Engineers will examine findings before setting a timeline for the next test.",
    "These delicious and impressive main meals work perfectly for a romantic dinner for two.",
    "The Food and Drug Administration suggests consuming no more than 400 milligrams of caffeine per day.",
  ];
  while (picked.length < n) {
    picked.push({
      site: "Web",
      url: "",
      excerpt: fallbackPool[picked.length % fallbackPool.length],
    });
  }
  return picked;
}

function joinFacts(facts) {
  const clean = (facts || []).map((x) => (x || "").trim()).filter(Boolean);
  if (clean.length === 0) return "Watson exists.";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} ${clean[1]}`;
  return `${clean[0]} ${clean[1]} ${clean[2]}`;
}

function sourceLine(r) {
  const site = r.site || "Web";
  const excerpt = (r.excerpt || "").trim();
  return `[${site}] “${excerpt}”`;
}

function pickTemplateNoRepeat(candidates) {
  const list = candidates && candidates.length ? candidates : TEMPLATES;
  if (state.usedTemplateKeys.size >= list.length) state.usedTemplateKeys.clear();

  let tpl = pick(list);
  let tries = 0;
  while (state.usedTemplateKeys.has(tpl.key) && tries < 80) {
    tpl = pick(list);
    tries++;
  }
  state.usedTemplateKeys.add(tpl.key);
  return tpl;
}

function inferTheme(facts, reds) {
  const f = (facts || []).join(" ").toLowerCase();
  const sites = (reds || []).map((r) => (r.site || "").toLowerCase()).join(" ");
  if (sites.includes("nasa")) return "space";
  if (sites.includes("bbc")) return "food";
  if (sites.includes("archdaily") || sites.includes("aho")) return "architecture";
  if (sites.includes("ikea")) return "design";
  if (sites.includes("health")) return "health";
  if (f.includes("pasta") || f.includes("lasagna")) return "food";
  if (f.includes("tennis") || f.includes("curling")) return "sport";
  return "routine";
}

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
}

function renderReports() {
  const wrap = $("#reports");
  if (!wrap) return;
  wrap.innerHTML = "";
  for (const r of state.reports) {
    const el = document.createElement("article");
    el.className = "report";
    el.innerHTML = `
      <h3 class="report__title"></h3>
      <div class="report__meta"></div>
      <p class="report__body"></p>
    `;
    $(".report__title", el).textContent = r.title;
    $(".report__meta", el).textContent = `${r.templateName} • ${r.redSites.join(", ")}`;
    $(".report__body", el).textContent = r.body;
    wrap.appendChild(el);
  }
}

function renderPanel(h) {
  const blueList = $("#blueList");
  const redList = $("#redList");
  const tpl = $("#templateUsed");
  const marked = $("#markedOutput");
  const trace = $("#traceUsed");

  if (!h) {
    if (blueList) blueList.innerHTML = "";
    if (redList) redList.innerHTML = "";
    if (tpl) tpl.textContent = "";
    if (marked) marked.innerHTML = "";
    if (trace) trace.textContent = "";
    return;
  }

  if (blueList) {
    blueList.innerHTML = "";
    for (const f of h.blueFacts) {
      const li = document.createElement("li");
      li.textContent = f;
      blueList.appendChild(li);
    }
  }

  if (redList) {
    redList.innerHTML = "";
    for (const r of h.redExcerpts) {
      const li = document.createElement("li");
      li.textContent = `${r.site}: ${shortExcerpt(r.excerpt, 240)}`;
      redList.appendChild(li);
    }
  }

  if (tpl) {
    tpl.textContent = `Template: ${h.template.name}\n\nSteps:\n1) Pick blue facts\n2) Pick red excerpts\n3) Apply template words\n4) Output confident report\n\nNote: This is intentionally fictional.`;
  }

  if (marked) marked.innerHTML = h.markedHtml || "";

  if (trace) {
    const traceObj = {
      picked_blue_facts: h.blueFacts || [],
      picked_red_excerpts: (h.redExcerpts || []).map((x) => ({
        site: x.site,
        url: x.url,
        excerpt: x.excerpt,
      })),
      template: {
        name: h.template ? h.template.name : "",
        title_fn: h.template && h.template.title ? String(h.template.title) : "",
        body_fn: h.template && h.template.body ? String(h.template.body) : "",
      },
      output: {
        title: h.title || "",
        body: h.body || "",
      },
    };

    trace.textContent = JSON.stringify(traceObj, null, 2);
  }
}

function escapeHtml(s) {
  return (s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function markText(body, blueFacts, redExcerpts) {
  // Mark longer strings first to avoid partial overlaps.
  const blues = [...blueFacts].sort((a, b) => b.length - a.length);
  const reds = redExcerpts.map((r) => r.excerpt).sort((a, b) => b.length - a.length);

  let html = escapeHtml(body);

  for (const b of blues) {
    const safe = escapeHtml(b);
    if (!safe) continue;
    html = html.replaceAll(safe, `<span class="mark-blue">${safe}</span>`);
  }
  for (const r of reds) {
    const safe = escapeHtml(r);
    if (!safe) continue;
    html = html.replaceAll(safe, `<span class="mark-red">${safe}</span>`);
  }
  return html;
}

function buildHallucination() {
  const name = "Watson";
  const blueFacts = pickMany(state.facts, 3);
  const safeFacts = [
    blueFacts[0] || "Watson has a strange habit.",
    blueFacts[1] || "Watson insists this is normal.",
    blueFacts[2] || "Watson blames the algorithm.",
  ];

  const redExcerpts = pickRedExcerpts(2);
  const theme = inferTheme(safeFacts, redExcerpts);
  const candidates = TEMPLATES.filter((t) => (t.tags || []).includes(theme));
  const tpl = pickTemplateNoRepeat(candidates);

  let title = tpl.title({ name, facts: safeFacts, reds: redExcerpts });
  if (!title.toLowerCase().includes(name.toLowerCase())) title = `${name}: ${title}`;

  const body = tpl.body({ name, facts: safeFacts, reds: redExcerpts });

  const markedHtml = markText(body, safeFacts, redExcerpts);

  const report = {
    title,
    body,
    templateName: tpl.name,
    redSites: redExcerpts.map((x) => x.site),
    debug: {
      blueFacts: safeFacts,
      redExcerpts,
      template: tpl,
      markedHtml,
      title,
      body,
    },
  };

  // Show only ONE report at a time
  state.reports = [report];
  const btn = $("#hallucinateBtn");
  if (btn) btn.classList.add("has-reload");
  renderReports();
  renderPanel(report.debug);
}

function setPanelOpen(open) {
  state.panelOpen = !!open;
  const app = $("#app");
  const panel = $("#panel");
  const btn = $("#panelToggle");
  if (app) app.classList.toggle("is-panel-open", state.panelOpen);
  if (btn) {
    btn.setAttribute("aria-expanded", state.panelOpen ? "true" : "false");
    const arrow = $(".panelToggle__arrow", btn);
    if (arrow) arrow.textContent = state.panelOpen ? "←" : "→";
  }
  if (panel) panel.hidden = !state.panelOpen;
}

function wireUi() {
  const btn = $("#hallucinateBtn");
  if (btn) btn.addEventListener("click", buildHallucination);
  const panelToggle = $("#panelToggle");
  if (panelToggle) panelToggle.addEventListener("click", () => setPanelOpen(!state.panelOpen));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setPanelOpen(false);
  });
}

// --- Canvas flowers ---------------------------------------------------------

const palettes = {
  orange: {
    big: ["#ff7a30", "#ff4a6a", "#f3b000", "#f7c3d0"],
    blue: ["#1e4bd6", "#7ec6ff", "#0e6e7a"],
    cream: "#f7f1e8",
  },
  blue: {
    big: ["#2057ff", "#7ec6ff", "#0e6e7a", "#b9d7ff"],
    blue: ["#ff7a30", "#ff4a6a", "#f3b000"],
    cream: "#f7f1e8",
  },
};

function seededColor(i) {
  const pool = [
    "#ff7a30",
    "#ff4a6a",
    "#f3b000",
    "#f7c3d0",
    "#1e4bd6",
    "#7ec6ff",
    "#0e6e7a",
    "#2e6b3a",
  ];
  return pool[i % pool.length];
}

function drawFlower(ctx, x, y, r, rot, fill, centerFill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  const petals = 8;
  for (let i = 0; i < petals; i++) {
    ctx.rotate((Math.PI * 2) / petals);
    ctx.beginPath();
    ctx.ellipse(r * 0.6, 0, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centerFill;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMini(ctx, x, y, r, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = fill;
  for (let i = 0; i < 6; i++) {
    ctx.rotate((Math.PI * 2) / 6);
    ctx.beginPath();
    ctx.ellipse(r * 0.5, 0, r * 0.55, r * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fill();
  ctx.restore();
}

class FlowerField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.flowers = [];
    this.theme = "orange";
    this.lastToggleAt = 0;
    this.cornerZone = 64;
    this.resize();
    this.seed();
  }

  resize() {
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  seed() {
    this.flowers = [];
    const count = clamp(Math.floor((this.w * this.h) / 52000), 14, 28);
    for (let i = 0; i < count; i++) {
      const big = Math.random() < 0.65;
      const r = big ? 42 + Math.random() * 44 : 14 + Math.random() * 14;
      this.flowers.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * (big ? 0.22 : 0.32),
        vy: (Math.random() - 0.5) * (big ? 0.22 : 0.32),
        r,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.004,
        kind: big ? "big" : "mini",
        fill: seededColor(i + Math.floor(Math.random() * 8)),
        center: seededColor(i + 3),
      });
    }
  }

  checkCorners(f) {
    const z = this.cornerZone;
    return (
      (f.x < z && f.y < z) ||
      (f.x > this.w - z && f.y < z) ||
      (f.x < z && f.y > this.h - z) ||
      (f.x > this.w - z && f.y > this.h - z)
    );
  }

  step(dt) {
    // Flowers keep moving but DO NOT change palette (no toggling)
    for (const f of this.flowers) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;

      const hitX = f.x < -f.r || f.x > this.w + f.r;
      const hitY = f.y < -f.r || f.y > this.h + f.r;

      if (hitX) f.vx *= -1;
      if (hitY) f.vy *= -1;

    }
  }

  draw() {
    const ctx = this.ctx;
    const pal = palettes[this.theme];
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.fillStyle = pal.cream;
    ctx.fillRect(0, 0, this.w, this.h);
    for (const f of this.flowers) {
      if (f.kind === "big") {
        drawFlower(ctx, f.x, f.y, f.r, f.rot, f.fill, f.center);
      } else {
        drawMini(ctx, f.x, f.y, f.r, f.fill);
      }
    }
  }
}

function startCanvas() {
  const canvas = $("#bg");
  if (!canvas) return;
  const field = new FlowerField(canvas);
  setTheme(field.theme);
  let last = performance.now();
  function loop(now) {
    const dt = clamp(now - last, 0, 50);
    last = now;
    field.step(dt);
    field.draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  window.addEventListener("resize", () => {
    field.resize();
    field.seed();
  });
}

async function main() {
  wireUi();
  setPanelOpen(false);
  startCanvas();
  const factsJson = await loadJson("./data/personal-facts.json");
  const sourcesJson = await loadJson("./data/external-sources.json");
  state.facts = (factsJson.facts || []).map(normalizeSpaces).filter(Boolean);
  state.sources = (sourcesJson.sources || []).map((s) => ({
    site: s.site,
    url: s.url,
    excerpts: (s.excerpts || []).map(normalizeSpaces).filter(Boolean),
  }));
}

document.addEventListener("DOMContentLoaded", () => {
  main().catch((err) => {
    console.error(err);
    const reports = $("#reports");
    if (reports) {
      const el = document.createElement("div");
      el.className = "report";
      el.innerHTML = `<h3 class="report__title">Watson encountered an error</h3><p class="report__body">${normalizeSpaces(
        err && err.message ? err.message : String(err)
      )}</p>`;
      reports.appendChild(el);
    }
  });
});
