/* Shared step-through investigation engine, used by every use case page.
   cfg: {steps: [{t, h, p, f, m, focus, story, hot?, decorate?(cy), dense?}], stories: [{nodes, rels}],
         renderTable(i) -> html} */
window.runCase = function(cfg){
"use strict";
const {RL, N, $, reduced, toEl, relEl, relLabel, style} = window.T;
const STEPS = cfg.steps;
let cur = 0, running = null;
const storyOf = i => cfg.stories[STEPS[i].story];
const cy = cytoscape({container: $("#cy"), style: style(), wheelSensitivity: .25, minZoom: .2, maxZoom: 2.6, boxSelectionEnabled: false});

function show(i){
  cur = i;
  const s = STEPS[i], st = storyOf(i);
  const want = new Set(st.nodes), wantR = new Set(st.rels);
  cy.batch(() => {
    cy.elements().forEach(e => { if (!(e.isNode() ? want.has(e.id()) : wantR.has(e.id()))) e.remove(); });
    st.nodes.forEach(id => { if (!cy.getElementById(id).length) cy.add(toEl(id)); });
    st.rels.forEach(id => { if (!cy.getElementById(id).length) cy.add(relEl(id)); });
    cy.elements().removeClass("focus hot lab small term");
    const hot = new Set((s.hot || []).concat(s.focus));
    s.focus.forEach(id => cy.getElementById(id).addClass("focus"));
    cy.edges().forEach(e => { if (hot.has(e.source().id()) && hot.has(e.target().id())) e.addClass("hot"); });
    if (s.decorate) s.decorate(cy);
    if (cy.nodes().length < 26) cy.edges().addClass("lab");
  });
  if (running) running.stop();
  const dense = !!s.dense;
  const rootId = s.root || cfg.root;
  let opts;
  if (s.hubs) {
    // Hubs spaced on an inner circle; everything else on an outer circle, ordered by its hub.
    const hubs = s.hubs.filter(h => cy.getElementById(h).length), pos = {};
    const hubOf = n => hubs.findIndex(h => n.neighborhood("#" + h).length);
    const others = cy.nodes().filter(n => !hubs.includes(n.id()));
    // Nodes linked to a hub go on the outer ring; the few that are not (and any focus node) sit on a middle ring.
    const loose = others.filter(n => hubOf(n) < 0 || n.hasClass("focus")).toArray();
    const rest = others.filter(n => !(hubOf(n) < 0 || n.hasClass("focus"))).toArray();
    rest.sort((a, b) => hubOf(a) - hubOf(b));
    const R = Math.max(220, rest.length * 9), r = hubs.length > 1 ? R * .28 : 0, m = R * .62;
    hubs.forEach((h, k) => { const a = -Math.PI / 2 + 2 * Math.PI * k / hubs.length; pos[h] = {x: r * Math.cos(a), y: r * Math.sin(a)}; });
    rest.forEach((n, k) => { const a = -Math.PI / 2 + 2 * Math.PI * k / rest.length; pos[n.id()] = {x: R * Math.cos(a), y: R * Math.sin(a)}; });
    loose.forEach((n, k) => { const a = -Math.PI / 3 + 2 * Math.PI * k / Math.max(loose.length, 1); pos[n.id()] = {x: m * Math.cos(a), y: m * Math.sin(a)}; });
    opts = {name: "preset", positions: n => pos[n.id()]};
  } else if (!dense && s.radial !== false && rootId && cy.getElementById(rootId).length) {
    // Radial tree: the case in the centre, each branch in its own wedge, one ring per relationship.
    const root = cy.getElementById(rootId), parent = {}, kids = {}, depth = {[rootId]: 0};
    cy.elements().bfs({roots: root, visit: (v, e, u) => {
      if (u) { parent[v.id()] = u.id(); (kids[u.id()] = kids[u.id()] || []).push(v.id()); depth[v.id()] = depth[u.id()] + 1; }
    }});
    const leaves = id => (kids[id] || []).reduce((t, k) => t + leaves(k), 0) || 1;
    const pos = {[rootId]: {x: 0, y: 0}}, RING = 150;
    const place = (id, a0, a1) => {
      let a = a0; const total = leaves(id);
      (kids[id] || []).forEach(k => {
        const w = (a1 - a0) * leaves(k) / total, mid = a + w / 2, d = depth[k];
        pos[k] = {x: RING * d * Math.cos(mid), y: RING * d * Math.sin(mid)};
        place(k, a, a + w); a += w;
      });
    };
    place(rootId, -Math.PI / 2, 1.5 * Math.PI);
    let spare = 0;
    cy.nodes().forEach(n => { if (!pos[n.id()]) pos[n.id()] = {x: -RING * 3 + 90 * spare++, y: RING * 3.4}; });
    opts = {name: "preset", positions: n => pos[n.id()]};
  } else {
    opts = {name: "cose", randomize: true, nodeRepulsion: () => 6000, idealEdgeLength: () => 40, edgeElasticity: () => 120,
      gravity: 1.2, numIter: 2000, nodeDimensionsIncludeLabels: true, componentSpacing: 40};
  }
  // Computed layouts are placed at once; only the force layout animates to its final positions.
  const animate = opts.name === "preset" || reduced ? false : "end";
  const layout = running = cy.layout(Object.assign(opts, {animate, animationDuration: 500, fit: true, padding: 30}));
  layout.one("layoutstop", () => { cy.resize(); cy.fit(undefined, 30); });
  layout.run();
  renderNarr(); renderSteps(); $("#tableview").innerHTML = cfg.renderTable(cur); $("#card").hidden = true;
  $("#prev").disabled = i === 0;
  $("#next").textContent = i === STEPS.length - 1 ? "Start again" : "Next step";
}
function renderSteps(){
  $("#steps").innerHTML = STEPS.map((s, i) => `<li><button type="button" data-i="${i}" title="${s.t}" aria-label="Step ${i + 1}: ${s.t}" ${i === cur ? 'aria-current="step"' : ""}><span class="n">${i + 1}</span><span class="t">${s.t}</span></button></li>`).join("");
}
function renderNarr(){
  const s = STEPS[cur];
  $("#narr").scrollTop = 0;
  $("#narr").innerHTML = `<span class="label">Step ${cur + 1} of ${STEPS.length} · ${s.t}</span><h3>${s.h}</h3><p>${s.p}</p><p class="finding">${s.f}</p><p class="method">${s.m}</p>`;
}
function setView(v){
  $("#tab-graph").setAttribute("aria-selected", v === "graph");
  $("#tab-table").setAttribute("aria-selected", v === "table");
  $("#tableview").hidden = v !== "table";
  if (v === "graph") cy.resize();
}
$("#tab-graph").onclick = () => setView("graph");
$("#tab-table").onclick = () => setView("table");
$("#steps").addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (b) show(+b.dataset.i); });
$("#next").onclick = () => show(cur === STEPS.length - 1 ? 0 : cur + 1);
$("#prev").onclick = () => cur > 0 && show(cur - 1);
document.addEventListener("keydown", e => {
  if (!document.activeElement || !document.activeElement.closest(".case")) return;
  if (e.key === "ArrowRight") $("#next").click();
  if (e.key === "ArrowLeft") $("#prev").click();
});

/* evidence card */
const PROPS = [["ref","Reference"],["type","Type"],["date","Date"],["created","Registered"],["region","Region"],["serial","Serial"],["description","Description"],
  ["acn","ACN"],["value","Value"],["shared_by","Shared by"],["declared_crypto","Crypto declared"],["holder_name","Holder"],["note","Note"],
  ["household","Household"],["budget_food","Food / week"],["budget_utilities","Utilities / week"],["budget_transport","Transport / week"],
  ["budget_phone","Phone / week"],["unsecured_debt","Unsecured debt"],["status","Status"]];
const money = new Set(["budget_food", "budget_utilities", "budget_transport", "budget_phone", "unsecured_debt"]);
function evidence(id, scopeRels){
  const n = N[id];
  const dl = PROPS.filter(([k]) => n[k] !== undefined && n[k] !== null && n[k] !== n.name).map(([k, l]) =>
    `<dt>${l}</dt><dd>${k === "shared_by" ? n[k] + " entities" : money.has(k) ? window.T.fmt$(n[k]) : k === "household" ? n[k] + (n[k] === 1 ? " person" : " people") : n[k]}</dd>`).join("");
  const li = scopeRels.map(r => RL[r]).filter(r => r.source_id === id || r.target_id === id).slice(0, 12).map(r => {
    const other = N[r.source_id === id ? r.target_id : r.source_id];
    return `<li><span class="dv ${r.derivation}">${r.derivation}</span><span>${relLabel(r)} · ${other.name || other.ref || other.value}</span><span class="src">${r.source}${r.date ? " · " + r.date : ""}</span></li>`;
  }).join("");
  return `<button class="x" type="button" aria-label="Close">×</button><span class="label">${n.kind}${n.role ? " · " + n.role.replace(/_/g, " ") : ""}</span>
    <h4>${n.name || n.ref || n.value}</h4>${dl ? `<dl>${dl}</dl>` : ""}<span class="label">Where each fact comes from</span><ul>${li || '<li class="src">No connections in this view.</li>'}</ul>`;
}
cy.on("tap", "node", e => {
  const c = $("#card");
  c.innerHTML = evidence(e.target.id(), storyOf(cur).rels);
  c.hidden = false;
  c.querySelector(".x").onclick = () => { c.hidden = true; cy.nodes().unselect(); };
});
cy.on("tap", e => { if (e.target === cy) $("#card").hidden = true; });

if ($("#legend")) window.T.legend($("#legend"), [...new Set(cfg.stories.flatMap(st => st.nodes))]);
// Links such as #step-4 open that step and bring the investigation into view.
const stepFromHash = () => { const m = location.hash.match(/^#step-(\d+)$/); const k = m ? +m[1] - 1 : -1; return k >= 0 && k < STEPS.length ? k : -1; };
show(Math.max(0, stepFromHash()));
document.addEventListener("click", e => {   // a repeat click on the current #step link does not fire hashchange
  const a = e.target.closest('a[href^="#step-"]');
  if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); show(stepFromHash()); $("#investigation").scrollIntoView({behavior: reduced ? "auto" : "smooth"}); }
});
window.addEventListener("hashchange", () => { const k = stepFromHash(); if (k >= 0) { show(k); $("#investigation").scrollIntoView({behavior: reduced ? "auto" : "smooth"}); } });
window.addEventListener("load", () => { cy.resize(); show(cur); if (stepFromHash() >= 0) $("#investigation").scrollIntoView(); });
if (window.ResizeObserver) { let w = 0; new ResizeObserver(es => { const nw = Math.round(es[0].contentRect.width); if (w && Math.abs(nw - w) > 40) { cy.resize(); cy.fit(undefined, 30); } w = nw; }).observe($("#cy")); }
};
