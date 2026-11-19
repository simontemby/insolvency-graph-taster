/* Use case 1: a manipulated personal insolvency agreement vote. */
(function(){
"use strict";
const {G, N, RL, H, RES, fmt$, pct} = window.T;

const votes = Object.values(RL).filter(r => r.type === "VOTED" && r.target_id === H.estate)
  .map(r => ({id: r.source_id, name: N[r.source_id].name, amount: r.amount, inFavour: r.in_favour}));
votes.sort((a, b) => b.amount - a.amount);
const absent = Object.values(RL).filter(r => r.type === "CLAIM_IN" && r.target_id === H.estate && !votes.some(v => v.id === r.source_id));
const linkedAt = {};
H.invoice.forEach(id => linkedAt[id] = 2);
linkedAt[H.c1] = 3; linkedAt[H.morlan] = 5; linkedAt[H.ostlen] = 5;
const linkWhy = {2: "Invoice sent from the debtor's email domain", 3: "Director gives the spouse's residential address",
  5: "Gives the adviser's phone number, or recurs across the adviser's estates"};
function tally(excludeUpTo){
  let f = 0, a = 0, nf = 0, na = 0;
  votes.forEach(v => {
    if (excludeUpTo && linkedAt[v.id] && linkedAt[v.id] <= excludeUpTo) return;
    if (v.inFavour){ f += v.amount; nf++; } else { a += v.amount; na++; }
  });
  return {f, a, nf, na, share: f / (f + a)};
}
const T0 = tally(0), TX = tally(9);
const c1amt = votes.find(v => v.id === H.c1).amount;
const linkedCount = votes.filter(v => v.inFavour && linkedAt[v.id]).length;
const yesCount = votes.filter(v => v.inFavour).length;
const cryptoHot = cy => cy.edges().filter(e => e.source().data("k") === "crypto" || e.target().data("k") === "crypto").addClass("hot");

const steps = [
  {t: "The proposal", h: "A vote that passes", story: 0, focus: [H.estate],
   p: `${N[H.debtor].name} proposed a personal insolvency agreement. ${votes.length} creditors voted. Creditors holding ${pct(T0.share)} of the value voting said yes, so the special resolution passes: it needs a majority in number and at least 75% by value of the creditors voting.`,
   f: "On the face of the vote, nothing is wrong.",
   m: "<b>What a table shows.</b> Names, amounts and votes. Open the table view to see it."},
  {t: "Same inbox", h: "Two creditors, one email domain", story: 1, focus: H.invoice,
   p: `Velmora Plant Hire and Quindale Fitouts lodged invoices for ${fmt$(38500)} and ${fmt$(27000)}. Both invoices were sent from varrowbuild.example, the debtor's own business domain.`,
   f: "Two yes votes are supported by invoices from the debtor's own email domain.",
   m: "<b>A rules check catches this.</b> It is a direct match between a detail of the debtor's and a detail of the creditor's."},
  {pr: ["direct", "Votes carried by connected creditors"], t: "Four hops out", h: "The largest creditor", story: 2, focus: [H.c1, H.director, H.spouse], hot: [H.debtor],
   p: `Tarrowin Civil holds the largest claim, ${fmt$(c1amt)}. On the company register, its director, ${N[H.director].name}, gives the same residential address as the debtor's spouse, ${N[H.spouse].name}.`,
   f: `Without Tarrowin's vote, ${pct(tally(3).share)} of the value voting is in favour, and the special resolution fails.`,
   m: "<b>A rules check misses this.</b> Tarrowin shares no detail with the debtor. The connection runs company, director, address, spouse, debtor: four relationships."},
  {pr: ["indirect", "Evidence split across registers"], t: "41 days before", h: "Security over the ute", story: 3, focus: [H.reg, H.vin], hot: [H.c1, H.debtor],
   p: `Forty-one days before the proposal, Tarrowin registered a security interest on the PPSR over the debtor's 2022 dual-cab ute. A registered security interest generally ranks ahead of unsecured creditors.`,
   f: "A company connected to the debtor took security over the main asset 41 days before the proposal.",
   m: "<b>Across two registers.</b> The PPSR registration only stands out once Tarrowin is known to be connected."},
  {pr: ["indirect", "The adviser is never a party"], t: "The adviser", h: "The phone number for correspondence", story: 4, focus: [H.adv_phone, H.adviser], dense: true,
   decorate: cy => cy.nodes("[k='estate']").filter(n => n.id() !== H.estate).addClass("small"),
   p: `The statement of affairs gives a contact phone number for correspondence. It belongs to a debt adviser, Corvin Halley. The same number is the contact on ${H.ring} other estates. ${H.ring_with_address} of those also give his office address, and ${H.ring_with_friendly} have claims from the same small set of trade creditors. Ressa Morlan, another yes vote, gives the same phone number.`,
   f: `One adviser, who is not a party on any form, connects ${H.ring + 1} estates.`,
   m: `<b>Graph algorithms.</b> Community detection (Louvain) places ${RES.louvain.ring_found} of the ${RES.louvain.ring_estates} estates in one community. On the graph of people, companies and identifiers, his phone number ranks first by both degree and betweenness.`},
  {pr: ["indirect", "Assets move before the vote"], t: "Follow the money", h: "Crypto missing from the statement of affairs", story: 5, focus: [H.xa_spouse, H.deposit], decorate: cryptoHot, radial: false,
   p: `The statement of affairs declares no cryptocurrency. Bank statements show ${fmt$(86000)} sent to an exchange 70 days before the proposal. The exchange's response to a notice shows 31.2 ETH withdrawn to a private wallet. On chain, the funds pass through four wallets, losing small amounts at each, and reach a deposit address of an exchange account in ${N[H.spouse].name}'s name, 58 days before the proposal.`,
   f: "Funds the statement of affairs did not mention reached the spouse two months before the vote.",
   m: "<b>Time-ordered paths.</b> Each transfer must happen after the one before it. The path ends at an exchange account, which tells the trustee where to send the next notice."},
  {pr: ["direct", "Should the vote stand?"], t: "The recount", h: "The vote without the connected creditors", story: 3, focus: [H.c1, H.ostlen, H.morlan].concat(H.invoice),
   p: `${linkedCount} of the ${yesCount} yes votes, worth ${fmt$(T0.f - TX.f)}, came from creditors connected to the debtor or to the adviser. Without them, ${pct(TX.share)} of the value voting is in favour.`,
   f: "These are the claims a trustee would test before admitting them to vote.",
   m: "<b>Back to the record.</b> The table view now shows each connection found, and the step that found it."}
];

function renderTable(cur){
  const rows = votes.map(v => {
    const step = linkedAt[v.id];
    const found = step && step <= cur + 1;
    return `<tr><td>${v.name}</td><td class="num">${fmt$(v.amount)}</td><td><span class="pill ${v.inFavour ? "for" : ""}">${v.inFavour ? "Yes" : "No"}</span></td>
      <td>${found ? `<span class="pill risk">Step ${step}</span> ${linkWhy[step]}` : '<span style="color:var(--muted)">None found</span>'}</td></tr>`;
  }).join("");
  const absentRows = absent.map(r => `<tr><td>${N[r.source_id].name}</td><td class="num">${fmt$(r.amount)}</td><td><span class="pill">Did not vote</span></td><td></td></tr>`).join("");
  const last = cur === steps.length - 1, t = last ? TX : T0;
  return `<table><thead><tr><th>Creditor</th><th class="num">Claim</th><th>Vote</th><th>Connection to the debtor</th></tr></thead><tbody>${rows}${absentRows}</tbody></table>
    <div class="tally"><div><b>${pct(t.share)}</b><span>${last ? "of value in favour, without connected creditors" : "of value voting in favour"}</span></div>
    <div><b>${t.nf} : ${t.na}</b><span>yes : no by number</span></div><div><b>${t.share >= .75 && t.nf > t.na ? "Passes" : "Fails"}</b><span>special resolution (majority in number, 75% by value)</span></div></div>`;
}

window.runCase({steps, stories: G.story, renderTable, root: H.estate});
})();
