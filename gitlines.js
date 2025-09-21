const container = document.querySelector('.BorderGrid.about-margin');

if (container) {
    const newDiv = document.createElement('div');
    newDiv.classList.add('BorderGrid-row');

    async function getBranches(repo_owner, repo_name) {
        // This func gives all branches in the repo
        const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/branches`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Failed to get branches");
        }
        const branches = await response.json();
        return branches.map(b => b.name);
    }

    async function init() {
        // extract repo name and owner from repo-link
        const repo_url = window.location.href;
        const repo_parts = repo_url.split('/');
        const repo_owner = repo_parts[3];
        const repo_name = repo_parts[4];

        // get branches
        const branches = await getBranches(repo_owner, repo_name);

        // if there is 1 branch
        if (branches.length === 1) {
            const branch = branches[0];

            // build repo tree
            const repo_tree_url = `https://api.github.com/repos/${repo_owner}/${repo_name}/git/trees/${branch}?recursive=1`;
            console.log(`Only one branch: ${branch}`);

            // load repo tree
            const response = await fetch(repo_tree_url);
            if (!response.ok) {
                throw new Error("Failed to get repo tree");
            }
            const tree = await response.json();

            // number of files in repo
            console.log("Tree entries:", tree.tree.length);
            num_files = tree.tree.length;

            // check if it´s code or not
            tree.tree.forEach((item, index) => {
                // prints the index with the path (name) from the tree object
                console.log(`Index ${index} ${item.path}`)
                const path = item.path

                if (path.endsWith('.py')) {
                    console.log("It is py!")
                }
                if (path.endsWith('.html')) {
                    console.log("It is html!")
                }
                if (path.endsWith('.js')) {
                    console.log("It is js!")
                }
                if (path.endsWith('.css')) {
                    console.log("It is css!")
                }
            });
        } else {
            // if there are more than one branches
            console.log(`There are ${branches.length} branches: ${branches.join(", ")}`);
        }

        // Dummy-Daten (hier kannst du später echte Daten einfügen)
        const data = [
            { lang: "Python", color: "#3572A5", lines: 5300, link: "/CodeProTech/DropSend/search?l=python" },
            { lang: "HTML", color: "#e34c26", lines: 2700, link: "/CodeProTech/DropSend/search?l=html" },
            { lang: "CSS", color: "#563d7c", lines: 2400, link: "/CodeProTech/DropSend/search?l=css" },
            { lang: "JavaScript", color: "#f1e05a", lines: 1600, link: "/CodeProTech/DropSend/search?l=javascript" }
        ];

        const totalLines = data.reduce((sum, item) => sum + item.lines, 0);

        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const viewBoxSize = 44;
        const center = viewBoxSize / 2;

        // CSS Styles einfügen
        const style = document.createElement('style');
        style.textContent = `
          #loc-chart-svg { display:block; }
          .loc-segment {
            cursor: pointer;
            transition: stroke-width 0.18s ease-in-out, transform 0.18s ease-in-out;
            transform-origin: center;
          }
          .loc-overlay {
            stroke-opacity: 0.01;
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

        // Segmente erzeugen
        let cumulative = 0;
        const svgSegments = data.map((item, index) => {
            const fraction = item.lines / totalLines;
            const strokeDasharray = `${fraction * circumference} ${circumference}`;
            const strokeDashoffset = -cumulative * circumference;
            cumulative += fraction;

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

            const overlay = `<circle r="${radius}" cx="${center}" cy="${center}"
                      fill="transparent"
                      stroke="#000"
                      stroke-width="28"
                      stroke-dasharray="${strokeDasharray}"
                      stroke-dashoffset="${strokeDashoffset}"
                      data-index="${index}"
                      data-lang="${item.lang}"
                      data-lines="${item.lines.toLocaleString()}"
                      data-link="${item.link}"
                      class="loc-overlay overlay-seg-${index}"
                    />`;

            return { visible, overlay };
        });

        // HTML ins Repo-UI einfügen
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
        const visibleNodes = Array.from(newDiv.querySelectorAll('.loc-segment'));
        const overlayNodes = Array.from(newDiv.querySelectorAll('.loc-overlay'));

        function showTooltip(evt, lang, lines) {
            tooltip.textContent = `${lang} — ${lines} lines`;
            tooltip.style.display = 'block';
            const offsetX = 12;
            const offsetY = 12;
            let left = evt.clientX + offsetX;
            let top = evt.clientY + offsetY;
            const rect = tooltip.getBoundingClientRect();
            if (left + rect.width > window.innerWidth) left = evt.clientX - rect.width - offsetX;
            if (top + rect.height > window.innerHeight) top = evt.clientY - rect.height - offsetY;
            tooltip.style.left = `${left}px`;
            tooltip.style.top = `${top}px`;
        }

        overlayNodes.forEach(ov => {
            const idx = ov.getAttribute('data-index');
            const visible = newDiv.querySelector('.visible-seg-' + idx);

            ov.addEventListener('mouseenter', (evt) => {
                svg.appendChild(visible);
                visible.style.strokeWidth = "10";
                visible.style.transform = "scale(1.06)";
                showTooltip(evt, ov.getAttribute('data-lang'), ov.getAttribute('data-lines'));
            });
            ov.addEventListener('mousemove', (evt) => {
                showTooltip(evt, ov.getAttribute('data-lang'), ov.getAttribute('data-lines'));
            });
            ov.addEventListener('mouseleave', () => {
                visible.style.strokeWidth = "8";
                visible.style.transform = "scale(1)";
                tooltip.style.display = 'none';
            });
            ov.addEventListener('click', () => {
                const link = ov.getAttribute('data-link');
                if (link) window.open(link, "_blank");
            });
        });

        visibleNodes.forEach(vis => {
            vis.addEventListener('mouseenter', (evt) => {
                svg.appendChild(vis);
                vis.style.strokeWidth = "10";
                vis.style.transform = "scale(1.06)";
                showTooltip(evt, vis.getAttribute('data-lang'), vis.getAttribute('data-lines'));
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

    init();
}
