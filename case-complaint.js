/* Use case 1: a complaint arrives. Only data the regulator already receives. */
(function(){
"use strict";
const {G, N, fmt$} = window.T;
const C = G.now.complaint, W = G.now.results.walk, Q = G.now.results.queue;
const pc = x => Math.round(x * 100) + "%";
const n = id => N[id];
const hero = Q.find(q => q.id === C.complaint);
const byDate = Q.slice().sort((a, b) => a.date.localeCompare(b.date));
const dateRank = byDate.findIndex(q => q.id === C.complaint) + 1;
const ordinal = k => ["first", "second", "third", "fourth", "fifth", "sixth"][k - 1] || k + "th";
const fmtDate = d => new Date(d + "T00:00:00").toLocaleDateString("en-AU", {day: "numeric", month: "long", year: "numeric"});
const groupProposals = cy => cy.nodes("[k='estate']").filter(x => x.id() !== C.proposal && !C.earlier.some(e => cy.getElementById(e).neighborhood().has(x))).addClass("small");
const markTerminated = cy => cy.nodes("[k='estate']").filter(x => N[x.id()].status === "terminated").addClass("term");
const earlier = C.earlier.map(id => n(id)), invs = C.investigations.map(id => n(id));

const steps = [
  {t: "The complaint", h: "One complaint, one file", story: 0, focus: [C.complaint],
   p: `${n(C.lender).name} lodged complaint ${n(C.complaint).ref} on ${fmtDate(n(C.complaint).date)} about debt agreement ${n(C.proposal).ref}: "${n(C.complaint).summary}"`,
   f: "Handled on its own, this is a dispute about amounts owed.",
   m: "<b>Today.</b> The complaint becomes one file, and the analyst starts searching separate systems for anything related."},
  {pr: ["direct", "Every complaint starts from scratch"], t: "What is held", h: "Everything already on record", story: 1, focus: [C.proposal], hot: [C.complaint],
   p: `The proposal form gives a contact phone and email for correspondence, and names the administrator. The NPII shows the same debtor was bankrupt in 2018 (${n(C.prior).ref}).`,
   f: "Records that sit in different places, now in one view.",
   m: "<b>Joining what is already held.</b> Each fact links to the record it came from. Nothing new had to be requested."},
  {pr: ["direct", "One complaint looks like one dispute"], t: "Same contact", h: "The contact details are not the debtor's", story: 2, focus: [C.phone, C.email], dense: true, hubs: [C.phone, C.email], decorate: groupProposals,
   p: `The contact phone and email on this proposal also appear on ${hero.linked_proposals} other proposals, for unrelated debtors in ${W.a_regions} regions, lodged with ${W.a_admins} different administrators.`,
   f: `The complaint is about one proposal. The pattern covers ${hero.linked_proposals + 1}.`,
   m: "<b>A shared detail across forms.</b> Use case 2 shows how this pattern can be found without waiting for a complaint."},
  {pr: ["indirect", "The same problem, handled as separate matters"], t: "Seen before", h: "Two earlier complaints, closed separately", story: 3, focus: C.earlier, dense: true, hubs: [C.phone, C.email], decorate: groupProposals,
   p: `${earlier[0].ref} (${fmtDate(earlier[0].date)}) and ${earlier[1].ref} (${fmtDate(earlier[1].date)}) were about proposals in the same group. Each was investigated as a separate matter (${invs[0].ref}, ${invs[1].ref}) and closed with no further action.`,
   f: "The same pattern has reached the regulator twice before.",
   m: "<b>A cost that doesn't show.</b> When complaints are filed one at a time, nothing connects the third to the first two."},
  {pr: ["indirect", "Findings stay in closed files", "next"], t: "Work already done", h: "A finding already on file", story: 4, focus: [C.adviser], hot: [C.investigations[0], C.phone], dense: true, hubs: [C.phone, C.email], decorate: groupProposals,
   p: `During ${invs[0].ref}, an ABR lookup recorded the business behind the phone number: ${n(C.adviser).name}. It is not on the register of debt agreement administrators.`,
   f: "The lookup does not need to be done again.",
   m: "<b>Keeping what investigations learn.</b> A finding recorded once is available to every later case, instead of sitting in a closed file."},
  {pr: ["indirect", "A queue worked in date order"], t: "The queue", h: "Where this complaint sits in the queue", story: 5, focus: [C.complaint], dense: true, hubs: [C.phone, C.email],
   decorate: cy => cy.nodes("[k='estate']").filter(x => !Q.some(q => cy.getElementById(q.id).neighborhood().has(x))).addClass("small"),
   p: `${Q.length} complaints arrived this month. In date order this one is ${ordinal(dateRank)}. Ranked by what each connects to, it is first: ${hero.linked_proposals} related proposals, ${hero.earlier_complaints} earlier complaints and ${hero.investigations} past investigations. The other ${Q.length - 1} connect to nothing else on record.`,
   f: "The same queue, in a different order.",
   m: "<b>Deciding where to look.</b> With few people, the order the queue is worked in matters. The table view shows both orders."},
  {pr: ["indirect", "Hard to show what the work achieved"], t: "One case", h: "What the analyst opens", story: 6, focus: [C.complaint, C.adviser], dense: true, hubs: [C.phone, C.email],
   decorate: cy => { groupProposals(cy); markTerminated(cy); },
   p: `${W.a_size} proposals, ${W.a_terminated} of them already terminated (shown in red), ${fmt$(W.a_debt)} of unsecured debt, ${hero.earlier_complaints} earlier complaints and one identified business.`,
   f: "One complaint opens a case about an adviser, instead of a dispute about one debt.",
   m: "<b>A lead, not a finding.</b> Shared contact details show that someone other than the debtor was the contact. Whether that caused harm is for the investigation to establish."}
];

const FILE = [
  [C.complaint, "Complaint", "Complaints register", 1], [C.proposal, "Debt agreement proposal", "Proposal form and lodgement", 1],
  [C.phone, "Contact phone on the form", "Proposal form", 2], [C.email, "Contact email on the form", "Proposal form", 2],
  [C.prior, "Earlier bankruptcy of the debtor", "NPII", 2],
  [null, `${hero.linked_proposals} other proposals with the same contact details`, "Proposal forms", 3],
  [C.earlier[0], "Earlier complaint", "Complaints register", 4], [C.earlier[1], "Earlier complaint", "Complaints register", 4],
  [C.investigations[0], "Past investigation", "Investigation records", 4], [C.investigations[1], "Past investigation", "Investigation records", 4],
  [C.adviser, "Business behind the contact details", `ABR lookup recorded in ${invs[0].ref}`, 5]
];
function renderTable(cur){
  if (cur >= 5) {
    const rank = Q.map((q, i) => ({...q, r: i + 1}));
    const rows = byDate.map(q => { const r = rank.find(x => x.id === q.id).r; return `<tr><td>${q.ref}</td><td>${fmtDate(q.date)}</td><td>${q.summary}</td>
      <td class="num">${q.linked_proposals}</td><td class="num">${q.earlier_complaints}</td><td class="num">${q.investigations}</td>
      <td>${r === 1 ? '<span class="pill risk">1</span>' : `<span class="pill">${r}</span>`}</td></tr>`; }).join("");
    return `<table><thead><tr><th>Complaint</th><th>Received</th><th>Summary</th><th class="num">Related proposals</th><th class="num">Earlier complaints</th><th class="num">Past investigations</th><th>Rank</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="cite" style="margin-top:10px">Listed in date order. Rank orders the queue by what each complaint connects to.</p>`;
  }
  const rows = FILE.filter(f => f[3] <= cur + 1).map(([id, what, src, step]) => `<tr><td>${what}</td><td>${id ? (n(id).ref || n(id).name || n(id).value) : ""}</td><td>${src}</td><td><span class="pill">Step ${step}</span></td></tr>`).join("");
  return `<table><thead><tr><th>Record</th><th>Reference</th><th>Source</th><th>Found</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="cite" style="margin-top:10px">The case file, as the graph assembles it.</p>`;
}

window.runCase({steps, stories: C.story, renderTable, root: C.complaint});
})();
