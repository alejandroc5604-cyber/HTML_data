
const API_BASE_URL = "https://fidgety-zeppelin-finally.ngrok-free.dev/api";
const PMTILES_URL = "/pmtiles_map/kenya.pmtiles";

const dropdownButton = document.getElementById("DatabasesDropdownButton");
const dropdownMenu = document.getElementById("DatabaseDropdownMenu");
const dropdownLabel = document.getElementById("DatabasesDropdownLabel");
const loadButton = document.getElementById("LoadDatabaseButton");

let selectedDatabase = null;
let map = null;

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

    let validCount = 0;

    databaseList.forEach(database => {
        if (!database.Database_Name || !database.Database_filename) {
            console.warn("Skipping invalid database entry:", database);
            return;
        }

        validCount++;

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

    if (validCount === 0) {
        const empty = document.createElement("div");
        empty.className = "DatabaseOption";
        empty.textContent = "No valid databases found";
        dropdownMenu.appendChild(empty);

        selectedDatabase = null;
        dropdownLabel.textContent = "Databases ▼";
        loadButton.disabled = true;
    }
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
        console.log("Selected database:", {
            name: selectedDatabase.Database_Name,
            filename: selectedDatabase.Database_filename
        });

    } catch (error) {
        console.error("Could not load selected database:", error);
    } finally {
        loadButton.disabled = !selectedDatabase;
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof maplibregl === "undefined") {
        console.error("maplibre-gl.js failed to load.");
        return;
    }

    if (typeof pmtiles === "undefined") {
        console.error("pmtiles.js failed to load.");
        return;
    }

    try {
        const protocol = new pmtiles.Protocol();
        maplibregl.addProtocol("pmtiles", protocol.tile);

        const archiveUrl = `${location.origin}${PMTILES_URL}`;

        map = new maplibregl.Map({
            container: "map",

            style: {
                version: 8,
                sources: {
                    kenya: {
                        type: "vector",
                        url: `pmtiles://${archiveUrl}`
                    }
                },
                layers: []
            },

            center: [37.9062, -0.0236],
            zoom: 5
        });

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        map.on("load", async () => {
            console.log("MapLibre initialized successfully.");

            try {
                const archive = new pmtiles.PMTiles(archiveUrl);
                const header = await archive.getHeader();
                const metadata = await archive.getMetadata();

                console.log("PMTiles header:", header);
                console.log("PMTiles metadata:", metadata);

                if (metadata.vector_layers) {
                    console.log("Available vector layers:", metadata.vector_layers);
                }
            } catch (error) {
                console.error("Could not read PMTiles metadata:", error);
            }
        });

        map.on("error", event => {
            console.error("MapLibre error:", event.error || event);
        });

    } catch (error) {
        console.error("Could not initialize the map:", error);
    }
});

fetchDatabases();
