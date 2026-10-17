
const API_BASE_URL = "https://fidgety-zeppelin-finally.ngrok-free.dev/api";
const PMTILES_URL = "/pmtiles_map/kenya.pmtiles";

const dropdownButton = document.getElementById("DatabasesDropdownButton");
const dropdownMenu = document.getElementById("DatabaseDropdownMenu");
const dropdownLabel = document.getElementById("DatabasesDropdownLabel");
const loadButton = document.getElementById("LoadDatabaseButton");

let selectedDatabase = null;

function setDropdownOpen(isOpen) {
    dropdownMenu.classList.toggle("show", isOpen);
    dropdownButton.setAttribute("aria-expanded", String(isOpen));
}

function populateDatabaseDropdown(databaseList) {
    dropdownMenu.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "menu-heading";
    heading.textContent = "Databases";
    dropdownMenu.appendChild(heading);

    if (!Array.isArray(databaseList) || databaseList.length === 0) {
        const empty = document.createElement("div");
        empty.className = "DatabaseOption";
        empty.textContent = "No databases found";
        dropdownMenu.appendChild(empty);

        selectedDatabase = null;
        dropdownLabel.textContent = "Databases ▼";
        loadButton.disabled = true;
        return;
    }

    databaseList.forEach(database => {
        if (!database.Database_Name || !database.Database_filename) {
            console.warn("Skipping invalid database entry:", database);
            return;
        }

        const option = document.createElement("button");
        option.type = "button";
        option.className = "DatabaseOption";
        option.textContent = database.Database_Name;

        option.addEventListener("click", () => {
            selectedDatabase = database;

            dropdownLabel.textContent = `${database.Database_Name} ▼`;

            dropdownMenu.querySelectorAll(".DatabaseOption")
                .forEach(item => item.classList.remove("selected"));

            option.classList.add("selected");
            loadButton.disabled = false;
            setDropdownOpen(false);

            console.log("Selected database:", selectedDatabase);
        });

        dropdownMenu.appendChild(option);
    });
}

async function fetchDatabases() {
    loadButton.disabled = true;
    dropdownLabel.textContent = "Loading databases...";

    try {
        const response = await fetch(`${API_BASE_URL}/DB_FindDB`, {
            method: "GET",
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data.Databases)) {
            throw new Error("The API response does not contain a Databases array.");
        }

        console.log("Databases received:", data.Databases);
        populateDatabaseDropdown(data.Databases);
    } catch (error) {
        console.error("Could not load databases:", error);

        dropdownMenu.replaceChildren();

        const message = document.createElement("div");
        message.className = "DatabaseOption";
        message.textContent = "Could not load databases";
        dropdownMenu.appendChild(message);

        dropdownLabel.textContent = "Database loading failed";
        loadButton.disabled = true;
    }
}

dropdownButton.addEventListener("click", () => {
    setDropdownOpen(!dropdownMenu.classList.contains("show"));
});

document.addEventListener("click", event => {
    if (!event.target.closest(".dropdown-container")) {
        setDropdownOpen(false);
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        setDropdownOpen(false);
    }
});

loadButton.addEventListener("click", async () => {
    if (!selectedDatabase) {
        console.warn("Select a database first.");
        return;
    }

    loadButton.disabled = true;

    try {
        console.log("Requesting selected database:", {
            name: selectedDatabase.Database_Name,
            filename: selectedDatabase.Database_filename
        });

    } finally {
        loadButton.disabled = !selectedDatabase;
    }
});

// Initialize the map independently of the database request.
document.addEventListener("DOMContentLoaded", () => {
    if (typeof L === "undefined" || typeof pmtiles === "undefined") {
        console.error("Leaflet or the PMTiles library failed to load.");
        return;
    }

    const map = L.map("map");

    const p = new pmtiles.PMTiles(PMTILES_URL);

    p.getHeader()
        .then(header => {
            const layer = pmtiles.leafletRasterLayer(p, {
                maxNativeZoom: header.maxZoom
            });

            layer.addTo(map);
            map.fitBounds([
                [header.minLat, header.minLon],
                [header.maxLat, header.maxLon]
            ]);

            map.fitBounds([
                [header.minLat, header.minLon],
                [header.maxLat, header.maxLon]
            ]);
        })
        .catch(error => {
            console.error("Could not load the PMTiles map:", error);
        });
});

// Fetching databases does not need to block map initialization.
fetchDatabases();
