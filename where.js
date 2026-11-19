/* The build-up chart on "Where this leads": cumulative proposals visible as part of a known group,
   against proposals seen only because a complaint named them. Read from data.js. */
(function(){
  const R = window.GRAPH.now.results.roc, S = R.series;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const svg = document.getElementById("buildchart"), tip = document.getElementById("buildtip");
  const W = 720, H = 300, L = 44, Rt = 150, T = 20, B = 40, iw = W - L - Rt, ih = H - T - B;
  const max = Math.ceil(Math.max(...S.map(s => s.in_known_groups)) / 20) * 20;
  const x = i => L + i * iw / (S.length - 1), y = v => T + ih - v / max * ih;
  const el = (t, a, txt) => { const e = document.createElementNS("http://www.w3.org/2000/svg", t); for (const k in a) e.setAttribute(k, a[k]); if (txt !== undefined) e.textContent = txt; svg.appendChild(e); return e; };
  const SERIES = [
    {key: "in_known_groups", name: "Connected record", color: css("--accent"), w: 2},
    {key: "seen_through_complaints", name: "File by file", color: "#8C99A6", w: 2}
  ];
  function draw(){
    svg.innerHTML = "";
    for (let v = 0; v <= max; v += 20) {
      el("line", {x1: L, x2: L + iw, y1: y(v), y2: y(v), stroke: css("--line"), "stroke-width": 1});
      el("text", {x: L - 8, y: y(v) + 4, "text-anchor": "end"}, v);
    }
    S.forEach((s, i) => { if (i % 2 === (S.length - 1) % 2) el("text", {x: x(i), y: H - B + 18, "text-anchor": "middle"}, s.q); });
    SERIES.forEach(se => {
      const pts = S.map((s, i) => `${x(i)},${y(s[se.key])}`).join(" ");
      el("polyline", {points: pts, fill: "none", stroke: se.color, "stroke-width": se.w, "stroke-linejoin": "round", "stroke-linecap": "round"});
      const last = S[S.length - 1][se.key];
      el("circle", {cx: x(S.length - 1), cy: y(last), r: 4.5, fill: se.color, stroke: css("--surface"), "stroke-width": 2});
      el("text", {class: "lbl", x: x(S.length - 1) + 10, y: y(last) + 4}, `${se.name}: ${last}`);
    });
    // legend
    let lx = L;
    SERIES.forEach(se => { el("line", {x1: lx, x2: lx + 16, y1: 8, y2: 8, stroke: se.color, "stroke-width": 3, "stroke-linecap": "round"}); el("text", {x: lx + 22, y: 12}, se.name); lx += 40 + se.name.length * 7; });
    // hover layer
    const cross = el("line", {x1: 0, x2: 0, y1: T, y2: T + ih, stroke: css("--muted"), "stroke-width": 1, "stroke-dasharray": "3 3", visibility: "hidden"});
    const hit = el("rect", {x: L - 10, y: T, width: iw + 20, height: ih, fill: "transparent"});
    hit.addEventListener("mousemove", ev => {
      const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
      const i = Math.max(0, Math.min(S.length - 1, Math.round((px - L) / (iw / (S.length - 1)))));
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i)); cross.setAttribute("visibility", "visible");
      const s = S[i];
      tip.innerHTML = `<b>${s.q}</b><span>Connected record: ${s.in_known_groups}</span><span>File by file: ${s.seen_through_complaints}</span><span class="m">${s.proposals} proposals lodged so far</span>`;
      tip.hidden = false;
      const left = x(i) / W * r.width;
      tip.style.left = Math.min(r.width - 190, Math.max(0, left + 12)) + "px";
    });
    hit.addEventListener("mouseleave", () => { cross.setAttribute("visibility", "hidden"); tip.hidden = true; });
  }
  draw();
  const last = S[S.length - 1];
  document.getElementById("buildcap").textContent = `By the last quarter, ${last.in_known_groups} proposals from the planted groups are visible as part of a known group, and ${last.reached_at_lodgement} of them were recognised the day they were lodged. Handled file by file, ${last.seen_through_complaints} are seen, because only ${last.seen_through_complaints} were ever named in a complaint. The largest group was visible from ${new Date(R.a_visible + "T00:00:00").toLocaleDateString("en-AU", {day: "numeric", month: "long", year: "numeric"})}, ${R.a_lead_days} days before its first complaint, by which time ${R.a_lodged_before_complaint} of its proposals had been lodged.`;
  document.getElementById("buildtable").innerHTML = `<table><thead><tr><th>Quarter</th><th class="num">Proposals lodged</th><th class="num">Connected record</th><th class="num">Recognised at lodgement</th><th class="num">File by file</th></tr></thead><tbody>${
    S.map(s => `<tr><td>${s.q}</td><td class="num">${s.proposals}</td><td class="num">${s.in_known_groups}</td><td class="num">${s.reached_at_lodgement}</td><td class="num">${s.seen_through_complaints}</td></tr>`).join("")}</tbody></table>`;
})();
