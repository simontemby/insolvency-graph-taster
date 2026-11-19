/* Shared header and footer, so every page carries the same navigation and disclaimer. */
(function(){
  const PAGES = [
    ["index.html", "Overview"],
    ["complaint.html", "Use case 1: Complaints"],
    ["debt-agreements.html", "Use case 2: Proposals"],
    ["vote.html", "Use case 3: Votes (future)"],
    ["priorities.html", "AFSA's priorities"],
    ["why-graph.html", "Why graph"],
    ["hume.html", "Hume"],
    ["patterns.html", "Other patterns"],
    ["about.html", "About the data"]
  ];
  const here = document.body.dataset.page;
  const head = document.getElementById("site-header");
  head.className = "mast";
  head.innerHTML = `<div class="wrap">
    <a class="mark" href="index.html" style="color:inherit;text-decoration:none">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="6" cy="19" r="3.4" fill="var(--accent)"/><circle cx="20" cy="19" r="3.4" fill="var(--ink)"/><circle cx="13" cy="6" r="3.4" fill="var(--risk)"/><path d="M8.6 17.2 11 9.1M17.4 17.2 15 9.1M9.4 19h7.2" stroke="var(--muted)" stroke-width="1.6" fill="none"/></svg>
      <span>Who's Behind the Vote</span></a>
    <nav aria-label="Pages">${PAGES.map(([href, name]) =>
      `<a href="${href}"${href === here ? ' aria-current="page"' : ""}>${name}</a>`).join("")}</nav>
    <span class="synthetic">Synthetic data</span></div>`;
  const foot = document.getElementById("site-footer");
  foot.innerHTML = `<div class="wrap">
    <h3>Who's Behind the Vote</h3><hr class="rule">
    <p>An independent demonstration. It was not produced, reviewed or endorsed by the Australian Financial Security Authority. Statements about AFSA's priorities and statistics are taken from public sources, listed on the <a href="about.html" style="color:#FFFFFF">About the data</a> page.</p>
    <p>Hume is GraphAware's intelligence analysis platform. Neo4j is a trademark of Neo4j, Inc. Every person, company, identifier and record in the graph on this site is synthetic.</p></div>`;
})();
