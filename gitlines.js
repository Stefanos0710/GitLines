
// api key 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

const container = document.querySelector('.BorderGrid.about-margin');
let got_line = 0;
let data = [];
let GITHUB_TOKEN = null;

// get github api key from browser storage
async function getApiKey() {
    try {
        const result = await browser.storage.local.get(['apiKey']);
        if (result.apiKey) {
            // save api key in GITHUB_TOKEN
            GITHUB_TOKEN = result.apiKey;
            console.error(GITHUB_TOKEN);
            return true;
        } else {
            // error handling
            console.error("No API Key found. Add api key in popup!");

            // display an error message in Github
            displayErrorMessage(
                "GitHub API Key Required",
                "This extension needs a GitHub API key to count lines of code in this repository.",
                [
                    "Click the extension icon in your browser toolbar",
                    "Enter your GitHub personal access token in the popup",
                    "Make sure your token has the 'repo' scope permissions",
                    "Click 'Save' to store your API key"
                ],
                "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token"
            );
            return false;
        }
    } catch (err) {
        console.error("Error getting API key:", err);
        return false;
    }
}

if (container) {
    const newDiv = document.createElement('div');
    newDiv.classList.add('BorderGrid-row');

    async function getBranches(repo_owner, repo_name) {
        // gives all branches in the repo
        const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/branches`;
        const response = await fetch(url, {
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github+json"
            }
        });

        if (!response.ok) {
            throw new Error("Failed to get branches");
        }
        const branches = await response.json();
        return branches.map(b => b.name);
    }

    async function init() {
        // get API key before proceeding
        const hasApiKey = await getApiKey();
        if (!hasApiKey) return;

        // extract repo name and owner from repo-link
        const repo_url = window.location.href;
        const repo_parts = repo_url.split('/');
        const repo_owner = repo_parts[3];
        const repo_name = repo_parts[4];


        if (got_line === 0) {
            data = [
                { lang: "Loading...", color: "#3572A5", lines: 123, link: "/CodeProTech/DropSend/" },
                { lang: "Loading...", color: "#f1e05a", lines: 123, link: "/CodeProTech/DropSend/" },
                { lang: "Loading...", color: "#e34c26", lines: 123, link: "/CodeProTech/DropSend/" },
                { lang: "Loading...", color: "#563d7c", lines: 123, link: "/CodeProTech/DropSend/" }
            ];
        }

        // supportet languages with full name and color
        // --- Check if colors match to github colors ---
        const languageMap = {
            ".py":   { lang: "Python", color: "#3572A5" },
            ".js":   { lang: "JavaScript", color: "#f1e05a" },
            ".html": { lang: "HTML", color: "#e34c26" },
            ".css":  { lang: "CSS", color: "#563d7c" },
            ".java": { lang: "Java", color: "#b07219" },
            ".cpp":  { lang: "C++", color: "#f34b7d" },
            ".c":    { lang: "C", color: "#555555" },
            ".h":    { lang: "C Header", color: "#555555" },
            ".ts":   { lang: "TypeScript", color: "#3178c6" },
            ".cs":   { lang: "C#", color: "#178600" },
            ".php":  { lang: "PHP", color: "#4F5D95" },
            ".rb":   { lang: "Ruby", color: "#701516" },
            ".go":   { lang: "Go", color: "#00ADD8" },
            ".rs":   { lang: "Rust", color: "#dea584" },
            ".swift":{ lang: "Swift", color: "#F05138" },
            ".kt":   { lang: "Kotlin", color: "#A97BFF" },
            ".r":    { lang: "R", color: "#198CE7" },
            ".pl":   { lang: "Perl", color: "#0298c3" },
            ".sh":   { lang: "Shell", color: "#89e051" },
            ".bat":  { lang: "Batchfile", color: "#C1F12E" },
            ".ps1":  { lang: "PowerShell", color: "#012456" },
            ".lua":  { lang: "Lua", color: "#000080" },
            ".hs":   { lang: "Haskell", color: "#5e5086" },
            ".scala":{ lang: "Scala", color: "#c22d40" },
            ".dart": { lang: "Dart", color: "#00B4AB" },
            ".m":    { lang: "Objective-C", color: "#438eff" },
            ".mm":   { lang: "Objective-C++", color: "#6866fb" },
            ".matlab": { lang: "MATLAB", color: "#e16737" },
            ".jl":   { lang: "Julia", color: "#a270ba" },
            ".sql":  { lang: "SQL", color: "#e38c00" },
            ".yaml": { lang: "YAML", color: "#cb171e" },
            ".yml":  { lang: "YAML", color: "#cb171e" },
            ".json": { lang: "JSON", color: "#292929" },
            ".xml":  { lang: "XML", color: "#0060ac" },
//            ".md":   { lang: "Markdown", color: "#083fa1" },
            ".tex":  { lang: "TeX", color: "#3D6117" },
            ".ipynb":{ lang: "Jupyter Notebook", color: "#DA5B0B" },
            ".dockerfile": { lang: "Dockerfile", color: "#384d54" },
            ".makefile":   { lang: "Makefile", color: "#427819" },
            ".gradle": { lang: "Gradle", color: "#02303a" },
            ".vb":   { lang: "Visual Basic", color: "#945db7" },
            ".groovy": { lang: "Groovy", color: "#4298b8" },
            ".erl":  { lang: "Erlang", color: "#B83998" },
            ".ex":   { lang: "Elixir", color: "#6e4a7e" },
            ".clj":  { lang: "Clojure", color: "#db5855" },
            ".coffee": { lang: "CoffeeScript", color: "#244776" },
            ".f90":  { lang: "Fortran", color: "#4d41b1" }
        };

        try {
            // get branches
            const branches = await getBranches(repo_owner, repo_name);

            // if there is 1 branch
            if (branches.length === 1) {
                const branch = branches[0];

                // build repo tree
                const repo_tree_url = `https://api.github.com/repos/${repo_owner}/${repo_name}/git/trees/${branch}?recursive=1`;
                console.log(`Only one branch: ${branch}`);
                console.log("repo_tree_url", repo_tree_url);

                // load repo tree
                const response = await fetch(repo_tree_url, {
                    headers: {
                        "Authorization": `token ${GITHUB_TOKEN}`,
                        "Accept": "application/vnd.github+json"
                    }
                });
                if (!response.ok) {
                    throw new Error("Failed to get repo tree");
                }
                const tree = await response.json();

                // number of files in repo
                console.log("Tree entries:", tree.tree.length);
                const num_files = tree.tree.length;


                function getLanguage(path) {
                    for (const ext in languageMap) {
                        if (path.endsWith(ext)) {
                            return languageMap[ext];
                        }
                    }
                    console.log(`The file ${path} is not supportet!`)
                    return null;
                }

                // clear loading data
                data = [];

                // count lines for every code file
                for (const [index, item] of tree.tree.entries()) {
                    if (item.type !== "blob") continue; // Skip if not a file

                    const path = item.path;
                    const fileExtension = path.slice(path.lastIndexOf('.'));

                    // Check if this is a supported file type
                    if (languageMap[fileExtension]) {
                        console.log(`Processing file: ${path}`);

                        const url_to_code = `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${path}?ref=${branch}`;
                        const r = await fetch(url_to_code, {
                            headers: {
                                "Authorization": `token ${GITHUB_TOKEN}`,
                                "Accept": "application/vnd.github+json"
                            }
                        });

                        if (!r.ok) {
                            console.error(`Failed to get content in ${path}`);
                            continue;
                        }

                        try {
                            const content_json = await r.json();
                            const content_base64 = content_json.content;
                            const content = atob(content_base64);
                            const lines = content.split("\n").length;
                            const link = `https://github.com/${repo_owner}/${repo_name}/blob/${branch}/${path}`;

                            console.log(`Lines for ${path}: ${lines}`);

                            // Get language info
                            const { lang, color } = languageMap[fileExtension];

                            // Check if language already exists in data
                            const existingLangIndex = data.findIndex(item => item.lang === lang);

                            if (existingLangIndex !== -1) {
                                // Add lines to existing language entry
                                data[existingLangIndex].lines += lines;
                            } else {
                                // Add new language entry
                                data.push({ lang, color, lines, link });
                            }
                        } catch (e) {
                            console.error(`Error processing file ${path}:`, e);
                        }
                    }
                }

                // sort by numbers of lines of code
                data.sort((a, b) => b.lines - a.lines);

                // If no data was found, show error
                if (data.length === 0) {
                    data = [
                        { lang: "ERROR_404", color: "#67ff00", lines: 123, link: "/CodeProTech/DropSend/" },
                        { lang: "ERROR_404", color: "#67ff00", lines: 123, link: "/CodeProTech/DropSend/" },
                        { lang: "ERROR_404", color: "#67ff00", lines: 123, link: "/CodeProTech/DropSend/" },
                        { lang: "ERROR_404", color: "#67ff00", lines: 123, link: "/CodeProTech/DropSend/" }
                    ];
                }

            } else {
                // if there are more than one branches
                console.log(`There are ${branches.length} branches: ${branches.join(", ")}`);
            }
        } catch (err) {
            console.error("Error analyzing repository:", err);
            data = [
                { lang: "ERROR", color: "#ff0000", lines: 0, link: "#" },
            ];
        }

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
