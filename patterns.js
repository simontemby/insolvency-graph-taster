(function(){
"use strict";
const {G, N, RL, RES, $, fmt$, mini} = window.T;

const V = G.vexatious, chk = RES.vexatious_check;
const vx = mini($("#mini-vex"), V.nodes, V.rels,
  {name: "concentric", concentric: n => n.id() === V.person ? 3 : (n.data("k") === "ppsr" ? 2 : 1), levelWidth: () => 1, minNodeSpacing: 4, padding: 12}, [V.person]);
vx.nodes("[k='ppsr']").addClass("small");
vx.nodes("[k='person']").filter(n => n.id() !== V.person).style("label", "");
$("#cap-vex").textContent = `${N[V.person].name}, a private individual, holds ${V.registrations} registrations over all present and after-acquired property, against ${V.grantors} people. Apart from those registrations, the graph shows no connection between this secured party and any of them within six relationships (${chk.grantors_linked_within_6_hops} found), and no claim by the secured party in any estate (${chk.claims_by_secured_party} found). A query for this shape runs across the whole register and gives the Registrar a short list to review.`;

const P = G.poc;
const pc = mini($("#mini-poc"), P.nodes, P.rels, {name: "breadthfirst", directed: false, padding: 24, spacingFactor: 1.1, roots: [P.nodes[0]]}, [P.nodes[0], P.nodes[2]]);
pc.edges().addClass("lab hot");
const asset = P.nodes.map(id => N[id]).find(n => n.kind === "RestrainedAsset");
const sale = P.nodes.map(id => N[id]).find(n => n.kind === "Sale");
$("#cap-poc").textContent = `A forfeited ${asset.description} was sold for ${fmt$(sale.price)}. The buyer is ${N[P.nodes[2]].name}, and its director is the respondent's brother. The two facts come from different records: the restraining order material names the brother, and the company register names the director. A path check between buyer and respondent can run before settlement.`;
})();
