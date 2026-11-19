/* Shared graph helpers for the pages that draw from data.js. */
window.T = (function(){
  "use strict";
  const G = window.GRAPH;
  const N = G.nodes, RL = G.rels, H = G.hero, RES = G.results;
  const $ = s => document.querySelector(s);
  const fmt$ = n => "$" + Math.round(n).toLocaleString("en-AU");
  const pct = n => (n * 100).toFixed(1) + "%";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  const KIND = {Person: "person", Company: "company", Estate: "estate", Address: "ident", Phone: "ident", EmailDomain: "ident", BankAccount: "ident",
    Registration: "ppsr", Collateral: "ppsr", Wallet: "crypto", Exchange: "crypto", ExchangeAccount: "crypto", RestrainedAsset: "ppsr", Sale: "ppsr", BudgetFingerprint: "fp", Email: "ident", Complaint: "complaint", Investigation: "inv"};
  const REL_LABEL = {DEBTOR_OF: "debtor", VOTED: "voted", CLAIM_IN: "claim", USES_DOMAIN: "email domain", HAS_ADDRESS: "address",
    HAS_PHONE: "phone", DIRECTOR_OF: "director", SPOUSE_OF: "spouse", SHAREHOLDER_OF: "owns", OWNS: "owns", GRANTOR: "grantor",
    SECURED_PARTY: "secured party", OVER: "over", CONTACT_PHONE: "contact phone", CONTACT_ADDRESS: "contact address",
    HOLDS_ACCOUNT: "holds", AT_EXCHANGE: "at", FIAT_TRANSFER: "AUD transfer", WITHDREW_TO: "withdrawal", SENT: "sent",
    DEPOSIT_ADDRESS_OF: "deposit address", ADMINISTERS: "administers", RELATIVE_OF: "brother", SUBJECT_OF_ORDER: "restrained",
    SOLD_IN: "sold", BOUGHT: "bought", REFERRED_BY: "referred by", SAME_BUDGET_AS: "same budget",
    PROPOSAL_CONTACT: "contact on form", MADE_COMPLAINT: "complained", ABOUT: "about", OPENED_FOR: "opened for",
    IDENTIFIED: "identified", HAS_EMAIL: "email"};

  function shortName(n){
    let s = n.name || n.ref || n.value || n.id;
    if (n.kind === "Wallet") s = s.slice(0, 6) + "…" + s.slice(-4);
    if (n.kind === "Registration") s = "PPSR reg";
  if (n.kind === "BudgetFingerprint") s = "Shared budget · " + n.agreements + " agreements";
    if (n.kind === "Estate" && n.id !== H.estate) s = n.ref;
    return s.length > 30 ? s.slice(0, 28) + "…" : s;
  }
  function relLabel(r){
    let l = REL_LABEL[r.type] || r.type.toLowerCase();
    if (r.type === "VOTED") l = (r.in_favour ? "yes " : "no ") + "$" + Math.round(r.amount / 1000) + "k";
    if (r.type === "FIAT_TRANSFER") l = "$86k AUD";
    if (r.type === "WITHDREW_TO" || r.type === "SENT") l = r.amount + " ETH";
    return l;
  }
  /* Node types: a colour and a simple white line icon (24x24, stroked), drawn for this site. */
  const ICON = {
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
    company: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1M11 21v-3h2v3"/>',
    regulated: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
    referrer: '<path d="M3 10v4h4l6 4V6l-6 4H3z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6a8 8 0 0 1 0 12"/>',
    lender: '<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>',
    estate: '<path d="M3 6h6l2 2h10v11H3z"/><path d="M8 13h8"/>',
    agreement: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7"/>',
    address: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    domain: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a2 2 0 0 0 4 0v-1a8 8 0 1 0-3 6"/>',
    bank: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    registration: '<path d="M6 3h9l4 4v14H6z"/><rect x="9" y="13" width="7" height="5" rx="1"/><path d="M10.5 13v-2a2 2 0 0 1 4 0v2"/>',
    vehicle: '<path d="M3 16v-3l2-5h14l2 5v3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4z"/>',
    exchange: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    account: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5M15 10h3M15 14h3"/>',
    sale: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    budget: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    complaint: '<path d="M4 4h16v12H9l-5 4z"/><path d="M12 7v4M12 13.5v.5"/>',
    investigation: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    adviser: '<circle cx="12" cy="7" r="3.5"/><path d="M5 21v-3a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v3"/><path d="M12 14v4"/>',
    service: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M6.3 6.3l3.6 3.6M14.1 14.1l3.6 3.6M17.7 6.3l-3.6 3.6M9.9 14.1l-3.6 3.6"/>'
  };
  const TYPE = {
    person: ["Person", "#1F6FB8"], company: ["Company", "#3D6587"], regulated: ["Registered practitioner", "#2E7D5B"],
    referrer: ["Referrer", "#7A4FB0"], lender: ["Lender or large creditor", "#5D6B7A"], estate: ["Insolvency case", "#0E2236"],
    agreement: ["Debt agreement", "#0E2236"], address: ["Address", "#C46A1C"], phone: ["Phone", "#B8890A"],
    domain: ["Email domain", "#2A8494"], bank: ["Bank account", "#4F5F70"], registration: ["PPSR registration", "#A86412"],
    vehicle: ["Vehicle or asset", "#6A7B90"], wallet: ["Crypto wallet", "#6B4FC8"], exchange: ["Exchange", "#5A3FB0"],
    account: ["Exchange account", "#7D62D6"], sale: ["Sale", "#3D6587"], budget: ["Shared budget", "#B06F0E"],
    complaint: ["Complaint", "#C2412D"], investigation: ["Past investigation", "#2A6F97"], email: ["Email", "#2A8494"],
    adviser: ["Unregistered adviser", "#9C3D7A"], service: ["Listed service", "#2E7D5B"]
  };
  function typeOf(n){
    switch (n.kind) {
      case "Person": return "person";
      case "Company": return n.role === "rdaa" ? "regulated" : n.role === "referrer" ? "referrer" : n.role === "generic_creditor" ? "lender" : n.role === "adviser_business" ? "adviser" : n.role === "service" ? "service" : "company";
      case "Complaint": return "complaint";
      case "Investigation": return "investigation";
      case "Email": return "email";
      case "Estate": return n.type === "debt_agreement" ? "agreement" : "estate";
      case "Address": return "address";
      case "Phone": return "phone";
      case "EmailDomain": return "domain";
      case "BankAccount": return "bank";
      case "Registration": return "registration";
      case "Collateral": case "RestrainedAsset": return "vehicle";
      case "Wallet": return "wallet";
      case "Exchange": return "exchange";
      case "ExchangeAccount": return "account";
      case "Sale": return "sale";
      case "BudgetFingerprint": return "budget";
      default: return "company";
    }
  }
  const iconCache = {};
  const iconURI = t => iconCache[t] || (iconCache[t] = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON[t]}</svg>`));
  const toEl = id => { const n = N[id], t = typeOf(n);
    return {group: "nodes", data: {id, label: shortName(n), k: KIND[n.kind] || "ident", t, color: TYPE[t][1], icon: iconURI(t)}}; };
  const relEl = id => { const r = RL[id]; return {group: "edges", data: {id, source: r.source_id, target: r.target_id, label: relLabel(r), dv: r.derivation, t: r.type}}; };
  function legend(el, ids){
    const seen = [...new Set(ids.map(id => typeOf(N[id])))];
    el.innerHTML = seen.map(t => `<span class="nk"><img src="${iconURI(t)}" alt="" style="background:${TYPE[t][1]}">${TYPE[t][0]}</span>`).join("");
  }

  function style(){
    return [
      {selector: "node", style: {"label": "data(label)", "font-family": "Public Sans, sans-serif", "font-size": 10, "color": css("--ink"),
        "text-valign": "bottom", "text-margin-y": 5, "shape": "ellipse", "width": 32, "height": 32,
        "background-color": "data(color)", "background-image": "data(icon)", "background-width": "58%", "background-height": "58%", "background-clip": "none",
        "text-background-color": css("--surface"), "text-background-opacity": .85, "text-background-padding": 2, "text-background-shape": "roundrectangle",
        "text-wrap": "ellipsis", "text-max-width": 150, "border-width": 2, "border-color": "#ffffff",
        "transition-property": "border-width, width, height", "transition-duration": reduced ? 0 : 250}},
      {selector: "node[k='ident']", style: {"width": 26, "height": 26, "font-size": 9, "color": css("--muted")}},
      {selector: "node[k='estate']", style: {"width": 34, "height": 34, "font-weight": 600}},
      {selector: "node[k='fp']", style: {"width": 40, "height": 40, "font-weight": 700}},
      {selector: "node.term", style: {"background-color": css("--risk")}},
      {selector: "node.focus", style: {"border-width": 4, "border-color": css("--risk"), "width": 42, "height": 42, "font-weight": 700, "z-index": 10}},
      {selector: "node.small", style: {"label": "", "width": 11, "height": 11, "background-image": "none", "border-width": 1}},
      {selector: "node:selected", style: {"border-width": 4, "border-color": css("--accent")}},
      {selector: "edge", style: {"width": 1.4, "line-color": css("--line"), "curve-style": "bezier", "target-arrow-shape": "none",
        "label": "", "font-size": 8.5, "font-family": "JetBrains Mono, monospace", "color": css("--muted"),
        "text-background-color": css("--surface"), "text-background-opacity": .9, "text-background-padding": 1.5, "text-rotation": "autorotate"}},
      {selector: "edge[dv='declared']", style: {"line-color": "#AEB8C3"}},
      {selector: "edge[dv='matched']", style: {"line-color": css("--matched"), "line-style": "dashed", "width": 2}},
      {selector: "edge[dv='observed']", style: {"line-color": css("--observed"), "target-arrow-shape": "triangle", "target-arrow-color": css("--observed"), "arrow-scale": .7}},
      {selector: "edge.lab", style: {"label": "data(label)"}},
      {selector: "edge.hot", style: {"line-color": css("--risk"), "width": 2.6, "z-index": 9, "label": "data(label)", "color": css("--ink")}}
    ];
  }

  function mini(el, ids, relIds, layout, focus){
    const c = cytoscape({container: el, style: style(), userZoomingEnabled: false, userPanningEnabled: false,
      boxSelectionEnabled: false, autoungrabify: true, elements: ids.map(toEl).concat(relIds.map(relEl)), layout});
    focus.forEach(f => c.getElementById(f).addClass("focus"));
    return c;
  }

  return {G, N, RL, H, RES, $, fmt$, pct, reduced, css, toEl, relEl, relLabel, style, mini, legend, typeOf};
})();
