const $ = (id) => document.getElementById(id);
const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const clean = (s) => s.toLowerCase().replace(/[^a-z]/g, "");
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const ZOD = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];
const elem = (s) => ["fire", "earth", "air", "water"][ZOD.indexOf(s) % 4];
const EGGS = ["jack|rose", "juliet|romeo"]; // sorted lowercase pairs
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ACTS = ["a cozy coffee date", "stargazing", "a random road trip", "a home-cooked meal"];
const RANGE = {
  Enemies: [3, 19],
  Siblings: [20, 39],
  Friends: [40, 59],
  Affection: [60, 74],
  Love: [75, 89],
  Marriage: [90, 100],
};
const MSG = {
  Friends: "Friends. Easy company.",
  Love: "Love. Do not panic.",
  Affection: "Affection. Warm and growing.",
  Marriage: "Marriage. Start saving.",
  Enemies: "Enemies. Dramatic, but entertaining.",
  Siblings: "Siblings. Share the snacks.",
};

// seeded PRNG: same couple, same result, any name order
function seed(str) {
  let h = 2166136261;
  for (const c of str) {
    h ^= c.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function zodiac(s1, s2) {
  const a = elem(s1),
    b = elem(s2),
    warm = ["fire", "air"],
    cool = ["earth", "water"];
  if (a === b) return [15, `Both ${a} signs. Strong bond.`];
  if ((warm.includes(a) && warm.includes(b)) || (cool.includes(a) && cool.includes(b)))
    return [10, `${cap(a)} and ${b} complement each other.`];
  return [-10, `${cap(a)} and ${b} clash.`];
}

function verdict(s) {
  if (s >= 90) return "Ultimate soulmates. Soul-contract level.";
  if (s >= 75) return "High compatibility. Deep connection.";
  if (s >= 50) return "Friends with potential. Sparks need effort.";
  if (s >= 30) return "Rough waters. Keep talking honestly.";
  return "Total clash. Stay distant acquaintances.";
}

function love(a, b, s1, s2, label) {
  const key = [a, b].sort().join("|"),
    combined = a + "loves" + b;
  let counts = [..."loves"].map((c) => combined.split(c).length - 1);
  const start = counts.join(" "),
    steps = [];
  while (counts.length > 2) {
    const c = counts;
    counts = c.slice(1).map((_, i) => (c[i] + c[i + 1]) % 10);
    steps.push(counts.join(" "));
  }
  let base = counts[0] * 10 + counts[1],
    zb = 0,
    zmsg;
  const egg = EGGS.includes(key);
  if (egg) {
    base = 99;
    zmsg = "Legendary pair. Calculation skipped.";
  } else [zb, zmsg] = zodiac(s1, s2);
  const pct = Math.max(0, Math.min(100, base + zb));
  const r = rng(seed(key));
  const day = DAYS[Math.floor(r() * DAYS.length)],
    act = ACTS[Math.floor(r() * ACTS.length)];
  return {
    pct,
    tag: "Love + zodiac",
    label,
    verdict: verdict(pct),
    extra: `Best day next week: <b>${day}</b>, for ${act}.`,
    detail: `<p class="bk">Letter counts for L-O-V-E-S: <b>${start}</b></p>
      <ol class="steps">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <p class="bk">Name score: <b>${base}%</b>${egg ? " (easter egg)" : ""}</p>
      <p class="bk">Zodiac: <b>${zb >= 0 ? "+" : ""}${zb}</b>. ${esc(zmsg)}</p>
      <p class="bk">Final: <b>${pct}%</b> (clamped to 0-100)</p>`,
  };
}

function flames(a, b, label) {
  const cnt = (s) => [...s].reduce((o, c) => ((o[c] = (o[c] || 0) + 1), o), {});
  const ca = cnt(a),
    cb = cnt(b);
  let n = 0;
  const cancelled = [];
  for (const k of new Set([...Object.keys(ca), ...Object.keys(cb)])) {
    const x = ca[k] || 0,
      y = cb[k] || 0,
      m = Math.min(x, y);
    if (m) cancelled.push(k.repeat(m));
    n += Math.abs(x - y);
  }
  if (n === 0) return { err: "No leftover letters, so FLAMES cannot count. Try different names." };
  const list = ["Friends", "Love", "Affection", "Marriage", "Enemies", "Siblings"],
    steps = [];
  let i = 0;
  while (list.length > 1) {
    i = (i + n - 1) % list.length;
    steps.push(`Count ${n}: <b>${list[i]}</b> out`);
    list.splice(i, 1);
  }
  const word = list[0],
    [lo, hi] = RANGE[word];
  const pct = lo + Math.floor(rng(seed([a, b].sort().join("|") + "f"))() * (hi - lo + 1));
  return {
    pct,
    tag: "FLAMES: " + word,
    label,
    verdict: MSG[word],
    detail: `<p class="bk">Cancelled letters: <b>${cancelled.join(", ") || "none"}</b></p>
      <p class="bk">Leftover letters: <b>${n}</b></p>
      <ol class="steps">${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <p class="bk">Percentage: the FLAMES result sets a range (${word}: ${lo}-${hi}%), then your names pick a spot in it. Just for fun.</p>`,
  };
}

// UI
["s1", "s2"].forEach((id) => {
  $(id).add(new Option("Skip", ""));
  ZOD.forEach((z) => $(id).add(new Option(cap(z), z)));
});

// magical cursor / finger trail
let lx = 0,
  ly = 0;
addEventListener("pointermove", (e) => {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
  if (Math.hypot(e.clientX - lx, e.clientY - ly) < 16) return;
  lx = e.clientX;
  ly = e.clientY;
  const s = document.createElement("span");
  s.className = "sp tr";
  s.style.cssText = `left:${lx}px;top:${ly}px;--s:${6 + Math.random() * 10}px;--x:${(Math.random() - 0.5) * 40}px;--y:${12 + Math.random() * 30}px;--c:${["#ff4f87", "#ffd27a", "#ffb3cb", "#c9a7ff"][(Math.random() * 4) | 0]}`;
  document.body.append(s);
  setTimeout(() => s.remove(), 850);
});

function burst(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 16; i++) {
    const e = document.createElement("span"),
      a = Math.random() * 6.28,
      d = 60 + Math.random() * 110;
    e.className = "sp bs";
    e.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + 60}px;--s:${10 + Math.random() * 14}px;--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;--c:${i % 2 ? "#ffd27a" : "#ff4f87"}`;
    document.body.append(e);
    setTimeout(() => e.remove(), 1000);
  }
}

function countUp(el, to) {
  if (matchMedia("(prefers-reduced-motion:reduce)").matches) {
    el.textContent = to + "%";
    return;
  }
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1100, 1);
    el.textContent = Math.round(to * p) + "%";
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

function run() {
  const rawA = $("a").value.trim(),
    rawB = $("b").value.trim(),
    a = clean(rawA),
    b = clean(rawB);
  const s1 = $("s1").value,
    s2 = $("s2").value;
  $("err").textContent = "";
  if (!a || !b) {
    $("err").textContent = "Enter both names using letters A-Z.";
    return;
  }
  const label = `${esc(rawA)} × ${esc(rawB)}`;
  const out = s1 && s2 ? love(a, b, s1, s2, label) : flames(a, b, label);
  if (out.err) {
    $("err").textContent = out.err;
    $("res").hidden = true;
    return;
  }

  const res = $("res");
  res.innerHTML = `<span class="pill">${out.tag}</span>
    <p class="names">${out.label}</p>
    <div class="big" id="num">0%</div>
    <div class="bar"><i id="fill"></i></div>
    <p class="verdict">${out.verdict}</p>
    ${out.extra ? `<p class="bk" style="text-align:center">${out.extra}</p>` : ""}
    <details><summary>How it was calculated</summary>${out.detail}</details>
    <div class="acts"><button type="button" id="share">Copy link</button></div>`;
  res.hidden = false;
  document.body.style.setProperty("--p", out.pct);
  requestAnimationFrame(() => {
    $("fill").style.width = out.pct + "%";
  });
  countUp($("num"), out.pct);
  burst(res);

  $("share").onclick = async () => {
    const u = new URL(location.href.split("?")[0]);
    u.searchParams.set("a", rawA);
    u.searchParams.set("b", rawB);
    if (s1 && s2) {
      u.searchParams.set("s1", s1);
      u.searchParams.set("s2", s2);
    }
    try {
      await navigator.clipboard.writeText(u.toString());
      $("share").textContent = "Copied";
    } catch {
      prompt("Copy this link:", u.toString());
    }
  };
}
$("f").addEventListener("submit", (e) => {
  e.preventDefault();
  run();
});

// restore from shared link
const q = new URLSearchParams(location.search);
if (q.get("a") && q.get("b")) {
  $("a").value = q.get("a");
  $("b").value = q.get("b");
  if (ZOD.includes(q.get("s1"))) $("s1").value = q.get("s1");
  if (ZOD.includes(q.get("s2"))) $("s2").value = q.get("s2");
  run();
}
