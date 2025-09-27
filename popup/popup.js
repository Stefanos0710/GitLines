document.addEventListener("DOMContentLoaded", function() {
    const apiKeyInput = document.getElementById("apikey");
    const saveButton = document.getElementById("save");
    const statusToggle = document.getElementById("status");
    const helpButton = document.getElementById("helpBtn");

    // Correct way to access storage API in Firefox extensions
    const storage = typeof browser !== "undefined" ? browser.storage : chrome.storage;

    if (!storage) {
        console.error("Browser storage API not available");
        return;
    }

    storage.local.get(['apiKey'], (result) => {
        if (result.apiKey) {
            apiKeyInput.value = result.apiKey;
        }
    });

    saveButton.addEventListener("click", () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            alert("Enter a valid GitHub API key!");
            return;
        }

        storage.local.set({ apiKey }, () => {
            const status = document.createElement("div");
            status.textContent = "API Key saved successfully!";
            status.style.color = "green";
            status.style.marginTop = "10px";
            document.body.appendChild(status);

            setTimeout(() => {
                status.remove();
            }, 3000);
        });
    });

    // Handle toggle switch
    statusToggle.addEventListener("change", () => {
        const enabled = statusToggle.checked;
        storage.local.set({ enabled }, () => {
            const status = document.createElement("div");
            status.textContent = enabled ? "Extension enabled" : "Extension disabled";
            status.style.color = enabled ? "green" : "red";
            status.style.marginTop = "10px";
            document.body.appendChild(status);

            setTimeout(() => {
                status.remove();
            }, 1500);
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
});