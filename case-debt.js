/* Use case 2: contact details shared across debt agreement proposals. */
(function(){
"use strict";
const {G, N, RL} = window.T;
const P = G.now.proposals, W = G.now.results.walk, T = G.now.results.test;
const pc = x => Math.round(x * 100) + "%";
const n = id => N[id];
const rdaaOf = id => N[id].administrator || "";
const contactOf = (id, kind) => { const r = Object.values(RL).find(r => r.type === "PROPOSAL_CONTACT" && r.source_id === id && N[r.target_id].kind === kind); return r ? N[r.target_id].value : ""; };
const keep = [P.p1, P.p2];
const smallOthers = cy => cy.nodes("[k='estate']").filter(x => !keep.includes(x.id())).addClass("small");
const markTerminated = cy => cy.nodes("[k='estate']").filter(x => N[x.id()].status === "terminated").addClass("term");

const steps = [
  {pr: ["indirect", "Harm continues until someone complains"], t: "One proposal", h: "Contact details on a proposal", story: 0, focus: [P.p1],
   p: `${n(P.p1).ref}, lodged with ${rdaaOf(P.p1)}, gives a contact phone and email for correspondence. Nothing on the form says whose they are.`,
   f: "On its own, a contact detail is just a contact detail.",
   m: "<b>What the form holds.</b> The online proposal form records a contact phone and email for correspondence, alongside the debtor's own details. Agreement outcomes are recorded on the NPII."},
  {t: "Same contact", h: "An unrelated debtor, the same contact", story: 1, focus: [P.p2], hot: [P.phone, P.email],
   p: `${n(P.p2).ref}, lodged by a different debtor in ${n(P.p2).region} with ${rdaaOf(P.p2)}, lists the same phone and email.`,
   f: "Two unrelated debtors, one contact.",
   m: "<b>Matching across forms.</b> Identical details link the two proposals in the graph."},
  {pr: ["indirect", "Each administrator sees only part of it"], t: `${W.a_size} proposals`, h: `One contact, ${W.a_size} proposals`, story: 2, focus: [P.phone, P.email], dense: true, hubs: [P.phone, P.email], decorate: smallOthers,
   p: `The same phone and email appear on ${W.a_size} proposals from ${W.a_regions} regions, lodged with ${W.a_admins} different administrators.`,
   f: "Spread across administrators, the pattern is invisible to each of them.",
   m: `<b>Seen across every lodgement.</b> Each administrator holds a few of these proposals. Only a view across all lodgements shows all ${W.a_size}.`},
  {pr: ["direct", "Who is behind these proposals?"], t: "Whose contact", h: "Not a registered administrator", story: 3, focus: [P.adviser], dense: true, hubs: [P.phone, P.email], decorate: smallOthers,
   p: `A public business listing gives this phone and email for ${n(P.adviser).name}. It is not on the register of debt agreement administrators.`,
   f: `The contact for ${W.a_size} debtors is an unregistered business.`,
   m: "<b>Registers as context.</b> Checking a detail against AFSA's own registers separates a registered administrator from someone else. The listing is an outside source, so it is shown as observed."},
  {pr: ["indirect", "Outcomes not traced to their source"], t: "What happened", h: "Outcomes on the NPII", story: 4, focus: [P.phone, P.email], dense: true, hubs: [P.phone, P.email],
   decorate: cy => { smallOthers(cy); markTerminated(cy); },
   p: `${W.a_terminated} of the ${W.a_size} (${pc(W.a_term_rate)}) have been terminated, shown in red. Across the other ${W.other_count} proposals the rate is ${pc(W.other_term_rate)}.`,
   f: "Half of these agreements have already been terminated.",
   m: "<b>Outcomes linked back to the source.</b> In this synthetic data the termination rates are design choices, not AFSA figures."},
  {pr: ["direct", "False alarms use up investigator time"], t: "A busy contact that's fine", h: "An administrator's own office", story: 5, focus: [P.office_admin], dense: true, hubs: [P.office_phone], decorate: smallOthers,
   p: `${n(P.office_admin).name} is the contact for ${W.office_props} of its own clients' proposals. Its phone and email are on the register, so the graph treats them as expected.`,
   f: "Counting shared contacts alone would flag this administrator.",
   m: `<b>Context, not volume.</b> In the test on the Why graph page, counting alone flagged ${T.shared.decoys.admin_office + T.shared.decoys.counsel} innocent proposals.`},
  {pr: ["direct", "Advisers rotate their details"], t: "Hidden in pieces", h: "Three phones, three emails, one operation", story: 6, root: P.story[6].nodes[0], focus: P.e_phones.concat(P.e_emails),
   p: `${W.e_size} proposals use three phones and three emails, rotated so that no detail appears more than ${W.e_max_use} times. Each detail on its own stays below the threshold. The overlaps join them into one group.`,
   f: "Only the connections show that these are one operation.",
   m: "<b>Graph grouping.</b> Joining proposals through any shared detail finds groups that counting each detail on its own misses."}
];

function renderTable(cur){
  const ids = P.story[steps[cur].story].nodes.filter(id => N[id].kind === "Estate");
  const showStatus = cur >= 4;
  const rows = ids.slice(0, 40).map(id => { const x = n(id); return `<tr><td>${x.ref}</td><td>${x.region}</td><td>${rdaaOf(id)}</td>
    <td>${contactOf(id, "Phone")}</td><td>${contactOf(id, "Email")}</td>
    ${showStatus ? `<td>${x.status === "terminated" ? '<span class="pill risk">Terminated</span>' : `<span class="pill">${x.status[0].toUpperCase() + x.status.slice(1)}</span>`}</td>` : ""}</tr>`; }).join("");
  const more = ids.length > 40 ? `<p class="cite" style="margin-top:10px">Showing 40 of ${ids.length} proposals.</p>` : "";
  return `<table><thead><tr><th>Proposal</th><th>Region</th><th>Administrator</th><th>Contact phone</th><th>Contact email</th>${showStatus ? "<th>Status</th>" : ""}</tr></thead><tbody>${rows}</tbody></table>${more}
    <p class="cite" style="margin-top:10px">Contact details as lodged on the proposal form.</p>`;
}

window.runCase({steps, stories: P.story, renderTable, root: P.p1});
})();
