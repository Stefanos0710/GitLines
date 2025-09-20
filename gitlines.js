const container = document.querySelector('.BorderGrid.about-margin');

if (container) {
    const newDiv = document.createElement('div');
    newDiv.classList.add('BorderGrid-row');

    const data = [
        {lang: "Python", color: "#3572A5", lines: 5300, link: "/CodeProTech/DropSend/search?l=python"},
        {lang: "HTML", color: "#e34c26", lines: 2700, link: "/CodeProTech/DropSend/search?l=html"},
        {lang: "CSS", color: "#563d7c", lines: 2400, link: "/CodeProTech/DropSend/search?l=css"},
        {lang: "JavaScript", color: "#f1e05a", lines: 1600, link: "/CodeProTech/DropSend/search?l=javascript"}
    ];

    const totalLines = data.reduce((sum, item) => sum + item.lines, 0);

    const radius = 16;
    const circumference = 2 * Math.PI * radius;

    let cumulative = 0;
    const circles = data.map((item, index) => {
        const fraction = item.lines / totalLines;
        const strokeDasharray = `${fraction * circumference} ${circumference}`;
        const strokeDashoffset = -cumulative * circumference;
        cumulative += fraction;

        return `<circle r="${radius}" cx="20" cy="20"
                  fill="transparent"
                  stroke="${item.color}"
                  stroke-width="8"
                  stroke-dasharray="${strokeDasharray}"
                  stroke-dashoffset="${strokeDashoffset}"
                  data-lang="${item.lang}"
                  data-lines="${item.lines.toLocaleString()}"
                  data-link="${item.link}"
                  class="loc-segment"
                  style="cursor:pointer; transition: transform 0.2s ease; transform-origin: center;"
                />`;
    }).join('');

    newDiv.innerHTML = `
      <div class="BorderGrid-cell">
        <h2 class="h4 mb-1" style="font-weight:600;">Lines of Code</h2>
        <p class="f6 color-fg-muted mb-3">Total: ${totalLines.toLocaleString()}</p>
        
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:10px;">
          <svg width="100" height="100" viewBox="0 0 40 40">
            <circle r="${radius}" cx="20" cy="20"
              fill="transparent"
              stroke="#e1e4e8"
              stroke-width="8"/>
            ${circles}
            <text id="tooltip" x="20" y="22" text-anchor="middle" class="f6 color-fg-muted"></text>
          </svg>

          <ul class="list-style-none" style="margin:0; padding:0;">
            ${data.map(item => `
              <li class="mb-1">
                <a href="${item.link}" target="_blank" 
                   class="d-inline-flex flex-items-center flex-nowrap Link--secondary no-underline text-small">
                  <svg style="color:${item.color}" aria-hidden="true" height="12" width="12" class="octicon octicon-dot-fill mr-2">
                    <circle cx="6" cy="6" r="6" fill="${item.color}"></circle>
                  </svg>
                  <span class="color-fg-default text-bold mr-1">${item.lang}</span>
                  <span class="color-fg-muted">${item.lines.toLocaleString()}</span>
                </a>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    container.appendChild(newDiv);

    // --- Interaktion für Hover + Klick ---
    const tooltip = newDiv.querySelector('#tooltip');
    newDiv.querySelectorAll('.loc-segment').forEach(seg => {
        seg.addEventListener('mouseover', () => {
            const lang = seg.getAttribute('data-lang');
            const lines = seg.getAttribute('data-lines');
            tooltip.textContent = `${lang} (${lines})`;
            seg.setAttribute("stroke-width", "10"); // größerer Strich
        });
        seg.addEventListener('mouseout', () => {
            tooltip.textContent = "Lines";
            seg.setAttribute("stroke-width", "8"); // zurücksetzen
        });
        seg.addEventListener('click', () => {
            const link = seg.getAttribute('data-link');
            if (link) window.open(link, "_blank");
        });
    });
}
