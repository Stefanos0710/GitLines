document.addEventListener("DOMContentLoaded", function() {
    const apiKeyInput = document.getElementById("apikey");
    const saveButton = document.getElementById("save");
    const statusToggle = document.getElementById("status");
    const helpButton = document.getElementById("helpBtn");
    const concurrentFilesSlider = document.getElementById("concurrentFiles");
    const concurrentValue = document.getElementById("concurrentValue");
    const branchSelectionInput = document.getElementById("branchSelection");

    // get accses to local storage
    const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

    if (!storage) {
        console.error("Browser storage API not available");
        return;
    }

    // load saved settings
    storage.local.get(['apiKey', 'enabled', 'concurrentFiles', 'branchSelection'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }

        // Extension is enabled by default if no setting exists
        if (result.enabled !== undefined) {
            statusToggle.checked = result.enabled;
        } else {
            statusToggle.checked = true; // Default to enabled
        }

        if (result.concurrentFiles) {
            concurrentFilesSlider.value = result.concurrentFiles;
            concurrentValue.textContent = result.concurrentFiles;
        }

        if (result.branchSelection) {
            branchSelectionInput.value = result.branchSelection;
        }
    });

    // update displayed value for slider
    concurrentFilesSlider.addEventListener("input", () => {
        concurrentValue.textContent = concurrentFilesSlider.value;
    });

    saveButton.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showStatus("Enter a valid GitHub API key!", "error");
            return;
        }

        const concurrentFiles = parseInt(concurrentFilesSlider.value);
        const branchSelection = branchSelectionInput.value.trim() || "main";

        storage.local.set({
            apiKey,
            concurrentFiles,
            branchSelection,
            enabled: statusToggle.checked
        }, () => {
            showStatus("Settings saved successfully!", "success");
        });
    });

    // handle toggle switch
    statusToggle.addEventListener("change", () => {
        const enabled = statusToggle.checked;
        storage.local.set({ enabled }, () => {
            showStatus(enabled ? "Extension enabled" : "Extension disabled", enabled ? "success" : "error");
        });
    });

    helpButton.addEventListener("click", () => {
        try {
            // for Firefox
            if (typeof browser !== "undefined") {
                browser.tabs.create({ url: "https://github.com/Stefanos0710/GitLines/blob/main/README.md" });
            }
            // for Chrome
            else if (typeof chrome !== "undefined") {
                chrome.tabs.create({ url: "https://github.com/Stefanos0710/GitLines/blob/main/README.md" });
            }
            else {
                window.open("https://github.com/Stefanos0710/GitLines/blob/main/README.md", "_blank");
            }
        } catch (error) {
            console.error("Error opening help page:", error);
            window.open("https://github.com/Stefanos0710/GitLines/blob/main/README.md", "_blank");
        }
    });

    // helper function to show status messages
    function showStatus(message, type) {
        // remove current message
        const existingStatus = document.querySelector(".status-message");
        if (existingStatus) {
            existingStatus.remove();
        }

        const status = document.createElement("div");
        status.textContent = message;
        status.className = `status-message status-${type}`;
        document.body.appendChild(status);

        setTimeout(() => {
            status.remove();
        }, 3000);
    }
});
