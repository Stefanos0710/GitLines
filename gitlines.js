// Check if extension is enabled before running
async function checkIfEnabled() {
    try {
        const result = await browser.storage.local.get(['enabled']);
        // Extension is enabled by default if no setting exists
        return result.enabled !== false;
    } catch (err) {
        console.error("Error checking extension status:", err);
        return true; // Default to enabled if there's an error
    }
}

const container = document.querySelector('.BorderGrid.about-margin');
let got_line = 0;
let data = [];
let GITHUB_TOKEN = null;
let BRANCH_SELECTION = "main"; // Default branch selection

// Configuration for parallel processing
const CONFIG = {
    MAX_CONCURRENT_REQUESTS: 5, // Adjustable number of parallel requests
    REQUEST_DELAY_MS: 100,      // Small delay between batches to avoid rate limits
    MAX_RETRY_ATTEMPTS: 3,      // Number of retry attempts for failed requests
    RETRY_DELAY_MS: 1000        // Delay before retrying a failed request
};

async function getApiKey() {
    try {
        const result = await browser.storage.local.get(['apiKey', 'concurrentFiles', 'branchSelection']);

        // Load concurrent files setting and update CONFIG
        if (result.concurrentFiles) {
            CONFIG.MAX_CONCURRENT_REQUESTS = parseInt(result.concurrentFiles);
            console.log(`Concurrent files setting loaded: ${CONFIG.MAX_CONCURRENT_REQUESTS}`);
        } else {
            console.log(`Using default concurrent files setting: ${CONFIG.MAX_CONCURRENT_REQUESTS}`);
        }

        // Load branch selection setting
        if (result.branchSelection) {
            BRANCH_SELECTION = result.branchSelection.trim();
            console.log(`Branch selection loaded: ${BRANCH_SELECTION}`);
        } else {
            console.log(`Using default branch selection: ${BRANCH_SELECTION}`);
        }

        if (result.apiKey) {
            GITHUB_TOKEN = result.apiKey;
            console.log("API key loaded successfully");
            return true;
        } else {
            console.error("No API Key found. Add api key in popup!");

            if (newDiv) {
                newDiv.innerHTML = `
                    <div class="BorderGrid-cell">
                        <div class="flash flash-warn" style="border-left: 4px solid #e36209;">
                            <div style="display:flex; align-items:center;">
                                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" class="octicon octicon-alert mr-2">
                                    <path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path>
                                </svg>
                                <h3 class="mb-1">GitHub API Key Missing</h3>
                            </div>
                            <p class="mb-0">To see the lines of code breakdown, please add a GitHub API key:</p>
                            <ol class="ml-4 mt-2">
                                <li>Click the extension icon in your browser toolbar</li>
                                <li>Enter your GitHub personal access token</li>
                                <li>Save and refresh this page</li>
                            </ol>
                            <p class="mt-2">
                                <a href="https://github.com/settings/tokens" target="_blank" class="text-bold">
                                    Get a GitHub token here →
                                </a>
                                <span class="color-fg-muted">(Select at least 'repo' scope)</span>
                            </p>
                        </div>
                    </div>
                `;
                container.appendChild(newDiv);
            }
            return false;
        }
    } catch (err) {
        console.error("Error getting API key:", err);

        if (newDiv) {
            newDiv.innerHTML = `
                <div class="BorderGrid-cell">
                    <div class="flash flash-error">
                        <h3>Extension Error</h3>
                        <p>Failed to access browser storage. Error: ${err.message}</p>
                        <p>Try reloading the page or reinstalling the extension.</p>
                    </div>
                </div>
            `;
            container.appendChild(newDiv);
        }
        return false;
    }
}

// Helper function to delay execution (for rate limiting)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Retry mechanism for API requests
async function fetchWithRetry(url, options, retries = CONFIG.MAX_RETRY_ATTEMPTS) {
    try {
        const response = await fetch(url, options);

        // Check if we're hitting rate limits
        if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
            const resetTime = parseInt(response.headers.get('X-RateLimit-Reset')) * 1000;
            const waitTime = Math.max(resetTime - Date.now(), 1000);
            console.warn(`Rate limit hit. Waiting ${waitTime/1000} seconds before retry.`);
            await delay(waitTime);
            return fetchWithRetry(url, options, retries);
        }

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        return response;
    } catch (error) {
        if (retries > 0) {
            console.warn(`Request failed, retrying... (${retries} attempts left)`, error);
            await delay(CONFIG.RETRY_DELAY_MS);
            return fetchWithRetry(url, options, retries - 1);
        } else {
            throw error;
        }
    }
}

if (container) {
    // Check if extension is enabled before running
    checkIfEnabled().then(isEnabled => {
        if (!isEnabled) {
            console.log("GitLines extension is disabled");
            return;
        }
        
        console.log("GitLines extension is enabled, starting analysis...");
        
        const newDiv = document.createElement('div');
        newDiv.classList.add('BorderGrid-row');

        async function getBranches(repo_owner, repo_name) {
            const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/branches`;
            const response = await fetchWithRetry(url, {
                headers: {
                    "Authorization": `token ${GITHUB_TOKEN}`,
                    "Accept": "application/vnd.github+json"
                }
            });

            const branches = await response.json();
            return branches.map(b => b.name);
        }

        // Process a batch of files in parallel
        async function processFileBatch(batch, repo_owner, repo_name, branch, languageMap) {
            const results = await Promise.all(batch.map(async (item) => {
                const path = item.path;
                const fileExtension = path.slice(path.lastIndexOf('.'));

                if (!languageMap[fileExtension]) {
                    return null;
                }

                try {
                    console.log(`Processing file: ${path}`);
                    const url_to_code = `https://api.github.com/repos/${repo_owner}/${repo_name}/contents/${path}?ref=${branch}`;

                    const r = await fetchWithRetry(url_to_code, {
                        headers: {
                            "Authorization": `token ${GITHUB_TOKEN}`,
                            "Accept": "application/vnd.github+json"
                        }
                    });

                    const content_json = await r.json();
                    const content_base64 = content_json.content;
                    const content = atob(content_base64);
                    const lines = content.split("\n").length;
                    const link = `https://github.com/${repo_owner}/${repo_name}/blob/${branch}/${path}`;

                    console.log(`Lines for ${path}: ${lines}`);

                    const { lang, color } = languageMap[fileExtension];
                    return { lang, color, lines, link };
                } catch (e) {
                    console.error(`Error processing file ${path}:`, e);
                    return null;
                }
            }));

            return results.filter(result => result !== null);
        }

        async function init() {
            const hasApiKey = await getApiKey();
            if (!hasApiKey) return;

            // Get repository information from URL
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

            // Language mapping with colors
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
                const branches = await getBranches(repo_owner, repo_name);

                // Determine which branches to analyze based on user setting
                let branchesToAnalyze = [];

                if (BRANCH_SELECTION.toLowerCase() === "all") {
                    branchesToAnalyze = branches;
                    console.log(`Analyzing all branches: ${branches.join(", ")}`);
                } else {
                    // Check if the specified branch exists
                    const specifiedBranch = branches.find(b => b.toLowerCase() === BRANCH_SELECTION.toLowerCase());
                    if (specifiedBranch) {
                        branchesToAnalyze = [specifiedBranch];
                        console.log(`Analyzing specified branch: ${specifiedBranch}`);
                    } else {
                        // Fall back to main/master if specified branch doesn't exist
                        const defaultBranch = branches.find(b => b.toLowerCase() === "main" || b.toLowerCase() === "master") || branches[0];
                        branchesToAnalyze = [defaultBranch];
                        console.log(`Branch '${BRANCH_SELECTION}' not found, using: ${defaultBranch}`);
                    }
                }

                // Add loading indicator with GitHub-style spinner
                newDiv.innerHTML = `
                    <div class="BorderGrid-cell">
                        <h2 class="h4 mb-1" style="font-weight:600;">Lines of Code</h2>
                        <p class="f6 color-fg-muted mb-3">Analyzing ${branchesToAnalyze.length === 1 ? `branch: ${branchesToAnalyze[0]}` : `${branchesToAnalyze.length} branches`}...</p>
                        <div class="d-flex flex-items-center my-3">
                            <svg class="octicon octicon-sync mr-2 color-fg-muted anim-rotate" viewBox="0 0 16 16" width="16" height="16">
                                <path fill-rule="evenodd" d="M8 2.5a5.487 5.487 0 00-4.131 1.869l1.204 1.204A.25.25 0 014.896 6H1.25A.25.25 0 011 5.75V2.104a.25.25 0 01.427-.177l1.38 1.38A7.001 7.001 0 0114.95 7.16a.75.75 0 11-1.49.178A5.501 5.501 0 008 2.5zM1.705 8.005a.75.75 0 01.834.656 5.501 5.501 0 009.592 2.97l-1.204-1.204a.25.25 0 01.177-.427h3.646a.25.25 0 01.25.25v3.646a.25.25 0 01-.427.177l-1.38-1.38A7.001 7.001 0 011.05 8.84a.75.75 0 01.656-.834z"></path>
                            </svg>
                            <span class="color-fg-muted">Initializing analysis...</span>
                        </div>
                        <div id="progress-container" class="mt-2" style="display: none;">
                            <div class="d-flex flex-items-center mb-1">
                                <span class="text-small color-fg-muted" id="progress-text">Scanning files...</span>
                                <span class="text-small color-fg-muted ml-auto" id="progress-percent">0%</span>
                            </div>
                            <div class="Progress">
                                <span class="Progress-item color-bg-success-emphasis" id="progress-bar" style="width: 0%"></span>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(newDiv);

                // Process all specified branches
                data = [];
                let totalFilesAcrossBranches = 0;
                let processedFilesAcrossBranches = 0;

                for (const branch of branchesToAnalyze) {
                    console.log(`Processing branch: ${branch}`);

                    const repo_tree_url = `https://api.github.com/repos/${repo_owner}/${repo_name}/git/trees/${branch}?recursive=1`;
                    console.log("repo_tree_url", repo_tree_url);

                    const response = await fetchWithRetry(repo_tree_url, {
                        headers: {
                            "Authorization": `token ${GITHUB_TOKEN}`,
                            "Accept": "application/vnd.github+json"
                        }
                    });

                    const tree = await response.json();
                    console.log(`Tree entries for ${branch}:`, tree.tree.length);

                    // Only process files (not directories)
                    const files = tree.tree.filter(item => item.type === "blob");
                    totalFilesAcrossBranches += files.length;

                    // Show progress bar after we know how many files we'll process
                    const progressContainer = document.getElementById('progress-container');
                    const progressBar = document.getElementById('progress-bar');
                    const progressText = document.getElementById('progress-text');
                    const progressPercent = document.getElementById('progress-percent');

                    if (progressContainer) {
                        progressContainer.style.display = 'block';
                    }

                    // Process files in batches for this branch
                    for (let i = 0; i < files.length; i += CONFIG.MAX_CONCURRENT_REQUESTS) {
                        const batch = files.slice(i, i + CONFIG.MAX_CONCURRENT_REQUESTS);
                        const batchResults = await processFileBatch(batch, repo_owner, repo_name, branch, languageMap);

                        // Update progress across all branches
                        processedFilesAcrossBranches += batch.length;
                        const progress = Math.floor((processedFilesAcrossBranches / totalFilesAcrossBranches) * 100);
                        console.log(`Processing: ${progress}% complete (${processedFilesAcrossBranches}/${totalFilesAcrossBranches})`);

                        // Update progress bar
                        if (progressBar && progressText && progressPercent) {
                            progressBar.style.width = `${progress}%`;
                            progressText.textContent = `Analyzed ${processedFilesAcrossBranches.toLocaleString()} of ${totalFilesAcrossBranches.toLocaleString()} files`;
                            progressPercent.textContent = `${progress}%`;
                        }

                        // Merge batch results into the main data array
                        batchResults.forEach(result => {
                            const existingLangIndex = data.findIndex(item => item.lang === result.lang);

                            if (existingLangIndex !== -1) {
                                data[existingLangIndex].lines += result.lines;
                            } else {
                                data.push(result);
                            }
                        });

                        // Add a small delay between batches to avoid rate limits
                        if (i + CONFIG.MAX_CONCURRENT_REQUESTS < files.length) {
                            await delay(CONFIG.REQUEST_DELAY_MS);
                        }
                    }
                }

                // Sort languages by line count
                data.sort((a, b) => b.lines - a.lines);

                if (data.length === 0) {
                    newDiv.innerHTML = `
                        <div class="BorderGrid-cell">
                            <div class="flash flash-warn">
                                <h3>No Code Files Found</h3>
                                <p>We couldn't detect any supported code files in the analyzed ${branchesToAnalyze.length === 1 ? 'branch' : 'branches'}.</p>
                                <p>If there are code files, they may be in a format we don't support yet.</p>
                            </div>
                        </div>
                    `;
                    container.appendChild(newDiv);
                    return;
                }

            } catch (err) {
                console.error("Error analyzing repository:", err);

                newDiv.innerHTML = `
                    <div class="BorderGrid-cell">
                        <div class="flash flash-error">
                            <h3>Repository Analysis Failed</h3>
                            <p>Error: ${err.message}</p>
                            <p>This could be due to API rate limits, permission issues, or network problems.</p>
                        </div>
                    </div>
                `;
                container.appendChild(newDiv);
                return;
            }

            // Calculate total lines for the chart
            const totalLines = data.reduce((sum, item) => sum + item.lines, 0);

            const radius = 16;
            const circumference = 2 * Math.PI * radius;
            const viewBoxSize = 44;
            const center = viewBoxSize / 2;

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
              .Progress { 
                display: flex;
                height: 8px;
                overflow: hidden;
                background-color: var(--color-neutral-muted);
                border-radius: 6px;
                outline: 1px solid transparent;
              }
              .Progress-item {
                outline: 2px solid transparent;
                border-radius: 6px;
              }
            `;
            document.head.appendChild(style);

            const tooltip = document.createElement('div');
            tooltip.id = 'loc-tooltip';
            document.body.appendChild(tooltip);

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

            // Add event listener for the config save button
            const saveConfigButton = document.getElementById('save-config');
            const concurrentRequestsInput = document.getElementById('concurrent-requests');

            if (saveConfigButton && concurrentRequestsInput) {
                saveConfigButton.addEventListener('click', () => {
                    const newValue = parseInt(concurrentRequestsInput.value);
                    if (!isNaN(newValue) && newValue > 0) {
                        CONFIG.MAX_CONCURRENT_REQUESTS = newValue;
                        console.log(`Updated MAX_CONCURRENT_REQUESTS to ${newValue}`);
                        // Could save to browser storage here for persistence
                        saveConfigButton.textContent = "Saved!";
                        setTimeout(() => {
                            saveConfigButton.textContent = "Save";
                        }, 1500);
                    }
                });
            }

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
    }).catch(error => {
        console.error("Error checking extension status:", error);
    });
}