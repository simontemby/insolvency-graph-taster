/* "Carried forward": a quiet running tally of what the change gives back, added to as the story moves on.
   Every figure is read from the synthetic data (data.js), never written by hand. */
(function(){
  const el = document.getElementById("carried");
  if (!el || !window.GRAPH) return;
  const R = window.GRAPH.now.results.roc;
  const ITEMS = [
    [1, R.related_on_day_one, "related proposals in view on the first day"],
    [1, R.earlier_complaints_connected, "earlier complaints connected instead of closed apart"],
    [1, R.lookups_not_repeated, "lookup not repeated"],
    [1, 1, "complaint moved to the front of the queue"],
    [2, R.found_without_complaint, "proposals found with no complaint at all"],
    [2, R.false_alarms_avoided, "false alarms avoided"],
    [2, R.a_lead_days, "days earlier than the first complaint, for the largest group"]
  ];
  const upto = el.dataset.upto === "all" ? 9 : +el.dataset.upto;
  const shown = ITEMS.filter(([stage]) => stage <= upto);
  const fresh = stage => el.dataset.upto !== "all" && stage === upto;
  el.innerHTML = `<span class="carried-label">Carried forward</span><ul>${shown.map(([stage, n, text]) =>
    `<li class="${fresh(stage) ? "fresh" : ""}"><b>${n.toLocaleString("en-AU")}</b> ${text}</li>`).join("")}</ul>${el.dataset.note ? `<p class="carried-note">${el.dataset.note}</p>` : ""}`;
})();
