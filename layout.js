/* Shared header and footer. The header follows the story in order; supporting pages sit in the footer. */
(function(){
  const STORY = [
    ["index.html", "The situation"],
    ["complaint.html", "Use case 1"],
    ["debt-agreements.html", "Use case 2"],
    ["vote.html", "Use case 3"],
    ["why-graph.html", "Why graph"],
    ["hume.html", "Hume"],
    ["where.html", "Where this leads"]
  ];
  const BACKGROUND = [
    ["priorities.html", "AFSA's priorities"],
    ["patterns.html", "Other patterns"],
    ["about.html", "About the data and sources"]
  ];
  const here = document.body.dataset.page;
  const pos = STORY.findIndex(([href]) => href === here);
  const head = document.getElementById("site-header");
  head.className = "mast";
  head.innerHTML = `<div class="wrap">
    <a class="mark" href="index.html" style="color:inherit;text-decoration:none">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="6" cy="19" r="3.4" fill="var(--accent)"/><circle cx="20" cy="19" r="3.4" fill="var(--ink)"/><circle cx="13" cy="6" r="3.4" fill="var(--risk)"/><path d="M8.6 17.2 11 9.1M17.4 17.2 15 9.1M9.4 19h7.2" stroke="var(--muted)" stroke-width="1.6" fill="none"/></svg>
      <span>Who's Behind the Vote</span></a>
    <nav aria-label="Story">${STORY.map(([href, name], i) =>
      `<a href="${href}"${href === here ? ' aria-current="page"' : ""}${pos >= 0 && i < pos ? ' class="seen"' : ""}>${name}</a>`).join("")}</nav>
    <span class="synthetic">Synthetic data</span></div>
    <div class="progress" aria-hidden="true"><span style="width:${pos >= 0 ? Math.round((pos + 1) / STORY.length * 100) : 0}%"></span></div>`;
  const foot = document.getElementById("site-footer");
  foot.innerHTML = `<div class="wrap">
    <h3>Who's Behind the Vote</h3>
    <p class="bg-links">Background: ${BACKGROUND.map(([href, name]) => `<a href="${href}">${name}</a>`).join(" · ")}</p>
    <hr class="rule">
    <p>An independent demonstration. It was not produced, reviewed or endorsed by the Australian Financial Security Authority. Statements about AFSA's priorities and statistics are taken from public sources, listed on the <a href="about.html" style="color:#FFFFFF">About the data</a> page.</p>
    <p>Hume is GraphAware's intelligence analysis platform. Neo4j is a trademark of Neo4j, Inc. Every person, company, identifier and record in the graph on this site is synthetic.</p></div>`;
})();
