(function(){
"use strict";
const {RES, H, $, css} = window.T;

const M = [["rules", "Rules check"], ["naive", "Graph traversal"], ["graph", "Graph with context"]];
$("#bignums").innerHTML = M.map(([k, name]) => { const s = RES[k]; return `<div class="${k === "graph" ? "win" : ""}">
  <span class="m">${name}</span><b>${s.tp} of ${RES.planted}</b><span class="sub">planted connections found (${Math.round(s.recall * 100)}%)</span>
  <span class="sub"><strong style="color:var(--ink)">${s.flagged} proposals flagged</strong>, ${s.fp} of them controls (precision ${Math.round(s.precision * 100)}%)</span></div>`; }).join("");

function svgEl(tag, attrs, text){ const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; }
function groupedBars(svg, cats, subs, series, max){
  const W = 520, Hh = 270, L = 34, Rr = 10, Tp = 30, B = 52, iw = W - L - Rr, ih = Hh - Tp - B;
  svg.innerHTML = "";
  const y = v => Tp + ih - v / max * ih;
  for (let t = 0; t <= max; t += Math.max(1, Math.round(max / 5))) {
    svg.appendChild(svgEl("line", {x1: L, x2: W - Rr, y1: y(t), y2: y(t), stroke: css("--line"), "stroke-width": 1}));
    svg.appendChild(svgEl("text", {x: L - 6, y: y(t) + 4, "text-anchor": "end"}, t));
  }
  const gw = iw / cats.length, bw = Math.min(26, (gw - 14) / series.length);
  cats.forEach((c, i) => {
    const x0 = L + i * gw + (gw - bw * series.length) / 2;
    series.forEach((s, j) => {
      const v = s.values[i], x = x0 + j * bw, h = ih - (y(v) - Tp);
      svg.appendChild(svgEl("rect", {x: x + 1, y: y(v), width: bw - 2, height: Math.max(0, h), fill: s.fill, stroke: s.stroke || "none", "stroke-width": s.stroke ? 1.4 : 0, rx: 1}));
      svg.appendChild(svgEl("text", {class: "val", x: x + bw / 2, y: y(v) - 4, "text-anchor": "middle"}, v));
    });
    svg.appendChild(svgEl("text", {class: "lbl", x: L + i * gw + gw / 2, y: Hh - B + 18, "text-anchor": "middle"}, c));
    if (subs) svg.appendChild(svgEl("text", {x: L + i * gw + gw / 2, y: Hh - B + 33, "text-anchor": "middle"}, subs[i]));
  });
  let lx = L;
  series.forEach(s => {
    svg.appendChild(svgEl("rect", {x: lx, y: 6, width: 11, height: 11, fill: s.fill, stroke: s.stroke || "none", "stroke-width": s.stroke ? 1.4 : 0}));
    svg.appendChild(svgEl("text", {x: lx + 16, y: 15}, s.name));
    lx += 22 + s.name.length * 6.8;
  });
}

// What each planted level is, and how many relationships separate debtor and creditor.
const LEVEL = {1: "Phone", 2: "Spouse co.", 3: "Spouse addr.", 4: "1 holding", 5: "2 holding"};
const d = RES.by_depth;
const hops = d.map(r => { const h = RES.hops_by_depth[String(r.depth)] || []; return h.length ? h.join("/") + " hops" : ""; });
groupedBars($("#depthchart"), d.map(r => LEVEL[r.depth]), hops, [
  {name: "Planted", values: d.map(r => r.planted), fill: "none", stroke: css("--muted")},
  {name: "Rules check", values: d.map(r => r.rules), fill: css("--n-ident")},
  {name: "Graph with context", values: d.map(r => r.graph), fill: css("--accent")}], 14);
const deepest = d[d.length - 1];
$("#depthcap").textContent = `The rules check compares the debtor's own details with each creditor's, so it finds only the first level. Most planted connections ran through a spouse, a director or a holding company. The deepest level is ${hops[hops.length - 1]} away, beyond the five-relationship limit, so neither method found those ${deepest.planted}.`;

const dc = RES.decoys.filter(r => r.kind !== "none");
const names = {weak_address: "Tax agent office", surname: "Same surname", past_neighbour: "Former address"};
groupedBars($("#decoychart"), dc.map(r => names[r.kind]), dc.map(r => r.n + " proposals"), [
  {name: "Rules check", values: dc.map(r => r.rules), fill: css("--n-ident")},
  {name: "Traversal", values: dc.map(r => r.naive), fill: css("--matched")},
  {name: "With context", values: dc.map(r => r.graph), fill: css("--accent")}], 24);

const l3 = d.find(r => r.depth === 3);
$("#lim-l3").textContent = l3 && l3.rules ? `The rules check's ${l3.rules} find at the spouse's-address level is the proposal in use case 3. It was flagged through a different creditor, the invoices from the debtor's email domain, not the planted company.` : "";

const shortNm = t => t.id === H.adv_phone ? "Adviser's phone" : t.name.includes("tax agent") ? "Tax agent office" :
  t.id === "ADR" ? t.name : (t.name.length > 26 ? t.name.slice(0, 24) + "…" : t.name);
const list = (rows, key) => rows.slice(0, 5).map((t, i) =>
  `<li class="${t.id === H.adv_phone ? "hit" : ""}"><span class="i">${i + 1}</span><span class="nm">${shortNm(t)}</span><span class="w">${t[key].toLocaleString("en-AU")}</span></li>`).join("");
$("#rank-degree").innerHTML = list(RES.top_degree, "degree");
$("#rank-pdegree").innerHTML = list(RES.top_projection_degree, "degree");
$("#rank-between").innerHTML = list(RES.top_betweenness, "score");
const pd = RES.top_projection_degree, bt = RES.top_betweenness;
const ratio = (a, b) => (a / b).toFixed(1);
$("#rankcap").textContent = `Counted across the whole graph, the most connected nodes are large lenders that claim in hundreds of estates. The link graph keeps only people, companies, identifiers, and the estates that give an identifier for correspondence or carry a trade creditor's claim; registered practitioners are removed. On that graph the adviser's phone ranks first by both measures. Betweenness separates it more clearly: ${ratio(bt[0].score, bt[1].score)} times the next node, against ${ratio(pd[0].degree, pd[1].degree)} times by connections. Choosing what the graph connects does most of the work. The tax agent offices that follow are innocent hubs, so a ranking gives an analyst a lead, not a conclusion.`;
})();

/* ---------- use case 2 test ---------- */
(function(){
"use strict";
const {G, $, css} = window.T;
const T2 = G.now.results.test;
const fill = {proposals: T2.proposals, planted: T2.planted, schemes: T2.schemes,
  admin_office: T2.decoy_sizes.admin_office, counsel: T2.decoy_sizes.counsel, household: T2.decoy_sizes.household};
document.querySelectorAll("[data-t]").forEach(el => { el.textContent = fill[el.dataset.t]; });
const M2 = [["watchlist", "Watchlist"], ["shared", "Shared contact count"], ["graph", "Graph grouping with context"]];
$("#bignums2").innerHTML = M2.map(([k, name]) => { const s = T2[k]; return `<div class="${k === "graph" ? "win" : ""}">
  <span class="m">${name}</span><b>${s.tp} of ${T2.planted}</b><span class="sub">planted proposals found (${Math.round(s.recall * 100)}%), ${s.schemes_found} of ${T2.schemes} advisers</span>
  <span class="sub"><strong style="color:var(--ink)">${s.flagged} proposals flagged</strong>, ${s.fp} of them controls${s.precision === null ? "" : ` (precision ${Math.round(s.precision * 100)}%)`}</span></div>`; }).join("");

function svgEl(tag, attrs, text){ const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text !== undefined) e.textContent = text; return e; }
function bars(svg, cats, subs, series, max){
  const W = 520, Hh = 270, L = 34, Rr = 10, Tp = 30, B = 52, iw = W - L - Rr, ih = Hh - Tp - B;
  svg.innerHTML = "";
  const y = v => Tp + ih - v / max * ih, step = max > 50 ? 20 : max > 20 ? 10 : 5;
  for (let t = 0; t <= max; t += step) {
    svg.appendChild(svgEl("line", {x1: L, x2: W - Rr, y1: y(t), y2: y(t), stroke: css("--line"), "stroke-width": 1}));
    svg.appendChild(svgEl("text", {x: L - 6, y: y(t) + 4, "text-anchor": "end"}, t));
  }
  const gw = iw / cats.length, bw = Math.min(22, (gw - 8) / series.length);
  cats.forEach((c, i) => {
    const x0 = L + i * gw + (gw - bw * series.length) / 2;
    series.forEach((s, j) => {
      const v = s.values[i], x = x0 + j * bw;
      svg.appendChild(svgEl("rect", {x: x + 1, y: y(v), width: bw - 2, height: Math.max(0, Tp + ih - y(v)), fill: s.fill, stroke: s.stroke || "none", "stroke-width": s.stroke ? 1.4 : 0, rx: 1}));
      svg.appendChild(svgEl("text", {class: "val", x: x + bw / 2, y: y(v) - 4, "text-anchor": "middle"}, v));
    });
    svg.appendChild(svgEl("text", {class: "lbl", x: L + i * gw + gw / 2, y: Hh - B + 18, "text-anchor": "middle"}, c));
    if (subs) svg.appendChild(svgEl("text", {x: L + i * gw + gw / 2, y: Hh - B + 33, "text-anchor": "middle"}, subs[i]));
  });
  let lx = L;
  series.forEach(s => {
    svg.appendChild(svgEl("rect", {x: lx, y: 6, width: 11, height: 11, fill: s.fill, stroke: s.stroke || "none", "stroke-width": s.stroke ? 1.4 : 0}));
    svg.appendChild(svgEl("text", {x: lx + 16, y: 15}, s.name));
    lx += 22 + s.name.length * 6.8;
  });
}
const bs = T2.by_scheme;
bars($("#schemechart"), bs.map(b => b.size + " proposals"), bs.map(b => b.rotating ? "rotating" : "one contact"), [
  {name: "Planted", values: bs.map(b => b.size), fill: "none", stroke: css("--muted")},
  {name: "Watchlist", values: bs.map(b => b.watchlist), fill: css("--n-ident")},
  {name: "Count", values: bs.map(b => b.shared), fill: css("--matched")},
  {name: "Grouping", values: bs.map(b => b.graph), fill: css("--accent")}], 45);
const rot = bs.find(b => b.rotating), tiny = bs.find(b => b.size < T2.min_proposals);
$("#schemecap").textContent = `The watchlist finds only the adviser a past investigation already identified. Counting finds every adviser that reuses one phone or email on ${T2.min_proposals} or more proposals. Only grouping finds the adviser that rotates three phones and three emails (${rot ? rot.graph : 0} of ${rot ? rot.size : 0}), because the overlaps join its proposals. No method finds the ${tiny ? tiny.size : ""}-proposal adviser, which is below the threshold.`;
const DK = [["admin_office", "Administrator's office"], ["counsel", "Counselling service"], ["household", "Shared household"]];
bars($("#stdchart"), DK.map(d => d[1]), DK.map(d => T2.decoy_sizes[d[0]] + " proposals"), [
  {name: "Watchlist", values: DK.map(d => T2.watchlist.decoys[d[0]]), fill: css("--n-ident")},
  {name: "Count", values: DK.map(d => T2.shared.decoys[d[0]]), fill: css("--matched")},
  {name: "Grouping", values: DK.map(d => T2.graph.decoys[d[0]]), fill: css("--accent")}], 65);
$("#stdcap").textContent = `Counting shared contacts flags every proposal where a registered administrator or a listed counselling service is the contact: ${T2.shared.decoys.admin_office + T2.shared.decoys.counsel} innocent proposals. Grouping ignores details that belong to someone on AFSA's registers or a public list of services, so it flags none of them. Couples sharing a household phone form groups of two, below the threshold.`;
})();
