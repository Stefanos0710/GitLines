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

    // ViewBox-Grösse + Mittelpunkt
    const viewBoxSize = 44;
    const center = viewBoxSize / 2; // 22

    // CSS Styles (füge sie dynamisch ein)
    const style = document.createElement('style');
    style.textContent = `
      #loc-chart-svg { display:block; }
      .loc-segment {
        cursor: pointer;
        transition: stroke-width 0.18s ease-in-out, transform 0.18s ease-in-out;
        transform-origin: center;
      }
      .loc-overlay {
        stroke-opacity: 0.01; /* sehr gering, aber nicht 0 - damit pointer events zuverlässig funktionieren */
        pointer-events: stroke;
        cursor: pointer;
      }
      #loc-tooltip {
        position: fixed;
        display: none;
        pointer-events: none;
        padding: 6px 8px;
        border-radius: 6px;
        font-size: 12px;
        background: rgba(10,10,10,0.9);
        color: white;
        box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        z-index: 9999;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    // Tooltip erstellen
    const tooltip = document.createElement('div');
    tooltip.id = 'loc-tooltip';
    document.body.appendChild(tooltip);

    // Erzeuge Segmente (sichtbar) + Overlays (unsichtbar, breiter)
    let cumulative = 0;
    const visibleSegments = [];
    const overlaySegments = [];

    const svgSegments = data.map((item, index) => {
        const fraction = item.lines / totalLines;
        const strokeDasharray = `${fraction * circumference} ${circumference}`;
        const strokeDashoffset = -cumulative * circumference;
        cumulative += fraction;

        // sichtbares Segment
        const visible = `<circle r="${radius}" cx="${center}" cy="${center}"
                  fill="transparent"
                  stroke="${item.color}"
                  stroke-width="8"
                  stroke-dasharray="${strokeDasharray}"
                  stroke-dashoffset="${strokeDashoffset}"
                  data-index="${index}"
                  data-lang="${item.lang}"
                  data-lines="${item.lines.toLocaleString()}"
                  data-link="${item.link}"
                  class="loc-segment visible-seg-${index}"
                />`;

        // overlay: größerer stroke, sehr leicht transparent damit pointer-events greifen
        const overlayStrokeWidth = 28; // je nach Bedarf anpassen
        const overlay = `<circle r="${radius}" cx="${center}" cy="${center}"
                  fill="transparent"
                  stroke="#000"
                  stroke-width="${overlayStrokeWidth}"
                  stroke-dasharray="${strokeDasharray}"
                  stroke-dashoffset="${strokeDashoffset}"
                  data-index="${index}"
                  data-lang="${item.lang}"
                  data-lines="${item.lines.toLocaleString()}"
                  data-link="${item.link}"
                  class="loc-overlay overlay-seg-${index}"
                />`;

        return {visible, overlay};
    });

    // Build HTML
    newDiv.innerHTML = `
      <div class="BorderGrid-cell">
        <h2 class="h4 mb-1" style="font-weight:600;">Lines of Code</h2>
        <p class="f6 color-fg-muted mb-3">Total: ${totalLines.toLocaleString()}</p>
        
        <div style="display:flex; align-items:center; gap:20px; margin-bottom:10px;">
          <svg width="100" height="100" viewBox="0 0 ${viewBoxSize} ${viewBoxSize}" id="loc-chart-svg">
            <circle r="${radius}" cx="${center}" cy="${center}"
              fill="transparent"
              stroke="#e1e4e8"
              stroke-width="8"/>
            ${svgSegments.map(s => s.visible).join('')}
            ${svgSegments.map(s => s.overlay).join('')}
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

    const svg = newDiv.querySelector('#loc-chart-svg');

    // NodeLists
    const visibleNodes = Array.from(newDiv.querySelectorAll('.loc-segment'));
    const overlayNodes = Array.from(newDiv.querySelectorAll('.loc-overlay'));

    function resetAllVisuals() {
        visibleNodes.forEach(n => {
            n.style.strokeWidth = "8";
            n.style.transform = "scale(1)";
        });
    }

    overlayNodes.forEach(ov => {
        const idx = ov.getAttribute('data-index');
        const visible = newDiv.querySelector('.visible-seg-' + idx);

        ov.addEventListener('mouseenter', (evt) => {
            // bring sichtbares Segment nach vorne
            svg.appendChild(visible);
            visible.style.strokeWidth = "10";
            visible.style.transform = "scale(1.06)";

            // Tooltip anzeigen
            const lang = ov.getAttribute('data-lang');
            const lines = ov.getAttribute('data-lines');
            tooltip.textContent = `${lang} — ${lines} lines`;
            tooltip.style.display = 'block';
        });

        ov.addEventListener('mousemove', (evt) => {
            // Tooltip Position: leichte Offset so es die Maus nicht verdeckt
            const offsetX = 12;
            const offsetY = 12;
            let left = evt.clientX + offsetX;
            let top = evt.clientY + offsetY;

            // verhindert dass Tooltip rechts aus dem Fenster läuft
            const rect = tooltip.getBoundingClientRect();
            if (left + rect.width > window.innerWidth) left = evt.clientX - rect.width - offsetX;
            if (top + rect.height > window.innerHeight) top = evt.clientY - rect.height - offsetY;

            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        });

        ov.addEventListener('mouseleave', () => {
            // reset sichtbares Segment
            visible.style.strokeWidth = "8";
            visible.style.transform = "scale(1)";
            tooltip.style.display = 'none';
        });

        ov.addEventListener('click', () => {
            const link = ov.getAttribute('data-link');
            if (link) window.open(link, "_blank");
        });
    });

    // Fallback: falls jemand trotzdem auf das sichtbare Segment hovert (z.B. Touch),
    // dann ebenfalls tooltip zeigen / click unterstützen
    visibleNodes.forEach(vis => {
        vis.addEventListener('mouseenter', (evt) => {
            svg.appendChild(vis);
            vis.style.strokeWidth = "10";
            vis.style.transform = "scale(1.06)";
            tooltip.textContent = `${vis.getAttribute('data-lang')} — ${vis.getAttribute('data-lines')} lines`;
            tooltip.style.display = 'block';
            // Position near center of svg segment if possible:
            const rect = svg.getBoundingClientRect();
            tooltip.style.left = `${rect.right + 8}px`;
            tooltip.style.top = `${rect.top + 8}px`;
        });
        vis.addEventListener('mouseleave', () => {
            vis.style.strokeWidth = "8";
            vis.style.transform = "scale(1)";
            tooltip.style.display = 'none';
        });
        vis.addEventListener('click', () => {
            const link = vis.getAttribute('data-link');
            if (link) window.open(link, "_blank");
        });
    });
}