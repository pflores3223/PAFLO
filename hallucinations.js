/*
  HALLUCINATIONS — Watson
  Static, no API keys.
  - Generates satirical "hallucination reports" by mixing:
    Blue = personal facts (fictional)
    Red  = copied excerpts from external sites (fictional input sources)
  - Shows a split-panel explanation ("LLM lecture")
  - Animated flower background on canvas; palette toggles when flowers hit corners
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
  usedTemplateIdx: new Set(),
};

const TEMPLATES = [
  {
    name: "Bread / Space Program",
    title: ({ name }) => `${name} Declares Bread a Launch Protocol`,
    body: ({ facts, reds }) =>
      `Witnesses confirm that ${facts[0]} and ${facts[1]} were reclassified as "pre-flight checks" after reading: ${reds[0]}. Experts say this explains why ${facts[2]} now requires a countdown.`,
  },
  {
    name: "Pasta Governance",
    title: ({ name }) => `${name} Accidentally Invents Pasta-Based Diplomacy`,
    body: ({ facts, reds }) =>
      `According to leaked transcripts, ${facts[0]} collided with ${reds[0]} and produced a new doctrine: if you ${facts[1]}, you must also "remain the earliest potential launch window". Critics call it nonsense. Supporters call it dinner.`,
  },
  {
    name: "Koala Standards",
    title: ({ name }) => `${name} Issues New Koala Quality Standards`,
    body: ({ facts, reds }) =>
      `${facts[0]} was reportedly inspired by this sentence: ${reds[0]}. The result is a strict policy requiring "various tones of green and pink" to be approved by a koala before anything is considered real.`,
  },
  {
    name: "Architectural Romance",
    title: ({ name }) => `${name} Designs a Romantic Opera House for Two (and a Butterfly)`,
    body: ({ facts, reds }) =>
      `Sources claim ${facts[0]} fused with: ${reds[0]} — producing a building that is "a place to be alone, singular or plural" and also to ${facts[1]}. The butterfly demanded better acoustics.`,
  },
  {
    name: "Anti-Norway Refrigeration",
    title: ({ name }) => `${name} Blames Norway for the Caffeine Crisis`,
    body: ({ facts, reds }) =>
      `After stating ${facts[0]}, ${name} cited ${reds[0]} and concluded that coffee should stop after 2 p.m. and also that Norway should apologize to lasagna. No one could prove any of it.`,
  },
  {
    name: "Rocks & Rituals",
    title: ({ name }) => `${name} Discovers Sacred Rocks While Shopping for Glassware`,
    body: ({ facts, reds }) =>
      `The hallucination began with ${facts[0]} and escalated when the model read: ${reds[0]}. Investigators later found a stick labeled "PAPPERSBJÖRK" and a rock insisting it was "rich in grain".`,
  },
  {
    name: "Tennis / Hydrogen",
    title: ({ name }) => `${name} Serves Liquid Hydrogen at Match Point`,
    body: ({ facts, reds }) =>
      `In a shocking crossover event, ${facts[0]} was combined with: ${reds[0]}. The algorithm then concluded that curling is just tennis with seals, and that all confidence tests should end in pasta.`,
  },
  {
    name: "Centenarian Lifestyle",
    title: ({ name }) => `${name} (Age 87) Announces a Two-Person Dinner for One Cat`,
    body: ({ facts, reds }) =>
      `After asserting ${facts[0]}, the system consumed: ${reds[0]}. The final report insists dinner must be "delicious and impressive" and served to a cat, a butterfly, and a pink rocket.`,
  },
  {
    name: "Museum of Sticks",
    title: ({ name }) => `${name} Opens a Museum Where Sticks Teach Space Engineering`,
    body: ({ facts, reds }) =>
      `The curator (${name}) claims ${facts[0]} is a peer-reviewed fact, citing: ${reds[0]}. Visitors are encouraged to bring one rock, one stick, and exactly 397 kcal of sea bass energy.`,
  },
];

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

  if (!h) {
    if (blueList) blueList.innerHTML = "";
    if (redList) redList.innerHTML = "";
    if (tpl) tpl.textContent = "";
    if (marked) marked.innerHTML = "";
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

  if (marked) {
    marked.innerHTML = h.markedHtml || "";
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

function pickTemplateNoRepeat() {
  // Avoid repeating until all templates used.
  if (state.usedTemplateIdx.size >= TEMPLATES.length) state.usedTemplateIdx.clear();

  let idx = Math.floor(Math.random() * TEMPLATES.length);
  let tries = 0;
  while (state.usedTemplateIdx.has(idx) && tries < 50) {
    idx = Math.floor(Math.random() * TEMPLATES.length);
    tries++;
  }
  state.usedTemplateIdx.add(idx);
  return { idx, tpl: TEMPLATES[idx] };
}

function buildHallucination() {
  const name = "Watson";
  const blueFacts = pickMany(state.facts, 3);
  const chosenSources = pickMany(state.sources, 2);
  const redExcerpts = chosenSources
    .map((s) => ({ site: s.site, url: s.url, excerpt: pick(s.excerpts || [""]) }))
    .filter((x) => normalizeSpaces(x.excerpt).length > 0);
  const redsText = redExcerpts.map((x) => `“${shortExcerpt(x.excerpt, 160)}”`).slice(0, 2);

  const { tpl } = pickTemplateNoRepeat();

  let title = tpl.title({ name, facts: blueFacts, reds: redsText });
  if (!title.toLowerCase().includes(name.toLowerCase())) title = `${name}: ${title}`;
  const body = tpl.body({ name, facts: blueFacts, reds: redsText });

  const markedHtml = markText(body, blueFacts, redExcerpts);

  const report = {
    title,
    body,
    templateName: tpl.name,
    redSites: redExcerpts.map((x) => x.site),
    debug: { blueFacts, redExcerpts, template: tpl, markedHtml },
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
      });
    }
  }

  toggleTheme() {
    this.theme = this.theme === "orange" ? "blue" : "orange";
    setTheme(this.theme);
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
    const now = performance.now();
    for (const f of this.flowers) {
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;

      const hitX = f.x < -f.r || f.x > this.w + f.r;
      const hitY = f.y < -f.r || f.y > this.h + f.r;

      if (hitX) f.vx *= -1;
      if (hitY) f.vy *= -1;

      // Toggle ONLY when any flower hits an EDGE (not constantly)
      if ((hitX || hitY) && now - this.lastToggleAt > 1800) {
        this.lastToggleAt = now;
        this.toggleTheme();
        break;
      }
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
        const fill = pick([...pal.big, ...pal.blue]);
        const center = pick(pal.blue);
        drawFlower(ctx, f.x, f.y, f.r, f.rot, fill, center);
      } else {
        drawMini(ctx, f.x, f.y, f.r, pick(pal.big));
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
