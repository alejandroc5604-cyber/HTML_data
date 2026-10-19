
const API_BASE_URL = "https://fidgety-zeppelin-finally.ngrok-free.dev/api";
const PMTILES_URL = "/pmtiles_map/kenya.pmtiles";

const dropdownButton = document.getElementById("DatabasesDropdownButton");
const dropdownMenu = document.getElementById("DatabaseDropdownMenu");
const dropdownLabel = document.getElementById("DatabasesDropdownLabel");
const loadButton = document.getElementById("LoadDatabaseButton");

let selectedDatabase = null;
let map = null;

let hotspots = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: {
                location: "Nairobi",
                wasteType: "Plastic",
                modelConfidence: "12.34",
                Source: "RaspberryPi5-4jf",
                sampleReports: 24,
                intensity: 1.0,
                itemID: "d551e949-d18f-4e67-ac95-44109d678164",
                itempath: "trash.jpg",
            },
            geometry: {
                type: "Point",
                coordinates: [36.8219, -1.2921]
            }
        },
        {
            type: "Feature",
            properties: {
                location: "Mombasa",
                wasteType: "Mixed waste",
                modelConfidence: "12.34",
                Source: "RaspberryPi5-4jf",
                sampleReports: 16,
                intensity: 0.7,
                itemID: "1ec88b05-d3bd-426e-9d45-2ab43dd53107",
                itempath: "trash.jpg",
            },
            geometry: {
                type: "Point",
                coordinates: [39.6682, -4.0435]
            }
        },
        {
            type: "Feature",
            properties: {
                location: "Kisumu",
                wasteType: "Organic waste",
                modelConfidence: "12.34",
                Source: "RaspberryPi5-4jf",
                sampleReports: 9,
                intensity: 0.5,
                itemID: "1ec98b05-d3bd-426e-9d45-2ab43dd53107",
                itempath: "trash.jpg",
            },
            geometry: {
                type: "Point",
                coordinates: [34.7617, -0.0917]
            }
        }
    ]
};
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
async function fetchDatabaseById(databaseId) {
    const response = await fetch(
        `${API_BASE_URL}/DB_GetDatabase/${encodeURIComponent(databaseId)}?limit=1000`,
        {
            method: "GET",
            headers: {
                "ngrok-skip-browser-warning": "true"
            }
        }
    );

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.FoundData)) {
        throw new Error("The API response does not contain a FoundData array.");
    }

    return data.FoundData;
}

function makeHotspotFeature(item) {
    if (!item || typeof item !== "object") {
        console.warn("Skipping invalid database item:", item);
        return null;
    }

    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);

    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
    ) {
        console.warn("Skipping database item with invalid coordinates:", item);
        return null;
    }

    const confidence = Number(item.confidence_score);
    const confidenceWeight = Number.isFinite(confidence)
        ? Math.max(
            0,
            Math.min(1, confidence > 1 ? confidence / 100 : confidence)
        )
        : 1;

    return {
        type: "Feature",
        properties: {
            location: "Kenya",
            wasteType: item.type ?? "Unknown",
            modelConfidence: item.confidence_score ?? "N/A",
            Source: item.source ?? "N/A",
            intensity: confidenceWeight,
            itemID: item.ID ?? "Unknown",
            itempath: item.image_path ?? ""
        },
        geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
        }
    };
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
        if (navigator.onLine) {
            const webpage_url = window.location.href
            const test_in_1 = "198.168"
            const test_in_2 = "localhost"
            const hasSubstringnumber = webpage_url.includes(test_in_1)
            const hasSubstringlocalhost = webpage_url.includes(test_in_2)
            if (hasSubstringnumber || hasSubstringlocalhost) {
                console.warn("CORS Detected!")
            }
        }
        
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
    const originalButtonText = loadButton.textContent;
    loadButton.textContent = "Loading...";

    try {
        const items = await fetchDatabaseById(
            selectedDatabase.Database_filename
        );
        const nextHotspots = {
            type: "FeatureCollection",
            features: items
                .map(makeHotspotFeature)
                .filter(feature => feature !== null)
        };

        hotspots = nextHotspots;
        const hotspotSource = map && map.getSource("hotspots");
        if (hotspotSource) {
            hotspotSource.setData(hotspots);
        }

        console.log(
            `Loaded ${hotspots.features.length} hotspot(s) from ${selectedDatabase.Database_Name}.`
        );
    } catch (error) {
        console.error("Could not load selected database:", error);
    } finally {
        loadButton.textContent = originalButtonText;
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
                const archive = new pmtiles.PMTiles(
                    `${location.origin}${PMTILES_URL}`
                );

                const metadata = await archive.getMetadata();

                console.log("PMTiles metadata:", metadata);

                const vectorLayers = metadata.vector_layers || [];
                const availableLayers = new Set(
                    vectorLayers.map(layer => layer.id)
                );

                console.log(
                    "Available vector layer names:",
                    [...availableLayers]
                );

                map.addLayer({
                    id: "map-background",
                    type: "background",
                    paint: {
                        "background-color": "#f2efe9"
                    }
                });
                map.addSource("hotspots", {
                    type: "geojson",
                    data: hotspots
                });

                function addLayerIfAvailable(layerId, definition) {
                    if (!availableLayers.has(layerId)) {
                        console.warn(
                            `Shortbread layer not found: ${layerId}`
                        );
                        return;
                    }

                    map.addLayer({
                        ...definition,
                        source: "kenya",
                        "source-layer": layerId
                    });
                }

                addLayerIfAvailable("ocean", {
                    id: "ocean",
                    type: "fill",
                    paint: {
                        "fill-color": "#a9d5e8"
                    }
                });

                addLayerIfAvailable("water_polygons", {
                    id: "water-polygons",
                    type: "fill",
                    paint: {
                        "fill-color": "#a9d5e8"
                    }
                });

                addLayerIfAvailable("water_lines", {
                    id: "water-lines",
                    type: "line",
                    paint: {
                        "line-color": "#8bc5df",
                        "line-width": 1.2
                    }
                });

                addLayerIfAvailable("land", {
                    id: "land",
                    type: "fill",
                    paint: {
                        "fill-color": "#e7e5d8",
                        "fill-opacity": 0.65
                    }
                });

                addLayerIfAvailable("buildings", {
                    id: "buildings",
                    type: "fill",
                    minzoom: 13,
                    paint: {
                        "fill-color": "#d0c8bb",
                        "fill-outline-color": "#b9b0a4"
                    }
                });

                addLayerIfAvailable("boundaries", {
                    id: "boundaries",
                    type: "line",
                    paint: {
                        "line-color": "#a58a9d",
                        "line-width": 1
                    }
                });

                addLayerIfAvailable("streets", {
                    id: "streets",
                    type: "line",
                    paint: {
                        "line-color": [
                            "match",
                            ["get", "kind"],
                            "motorway", "#d87570",
                            "trunk", "#e7ad70",
                            "primary", "#e7ad70",
                            "secondary", "#f2d7a1",
                            "#ffffff"
                        ],
                        "line-width": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            5, 0.4,
                            10, 1.2,
                            15, 4
                        ]
                    }
                });
                map.addLayer({
                    id: "hotspot-heatmap",
                    type: "heatmap",
                    source: "hotspots",

                    paint: {
                        "heatmap-weight": [
                            "interpolate",
                            ["linear"],
                            ["get", "intensity"],
                            0, 0,
                            1, 1
                        ],

                        "heatmap-intensity": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            5, 1,
                            10, 3
                        ],

                        "heatmap-radius": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            5, 15,
                            10, 35
                        ],

                        "heatmap-opacity": 0.8,

                        "heatmap-color": [
                            "interpolate",
                            ["linear"],
                            ["heatmap-density"],
                            0, "rgba(0, 0, 255, 0)",
                            0.2, "#00ffff",
                            0.4, "#00ff00",
                            0.6, "#ffff00",
                            0.8, "#ff8000",
                            1, "#ff0000"
                        ]
                    }
                });

                map.addLayer({
                    id: "hotspot-points",
                    type: "circle",
                    source: "hotspots",
                    paint: {
                        "circle-radius": [
                            "interpolate",
                            ["linear"],
                            ["zoom"],
                            5, 5,
                            10, 9
                        ],
                        "circle-color": "#c2410c",
                        "circle-stroke-color": "#ffffff",
                        "circle-stroke-width": 2
                    }
                });

                const hotspotPopup = new maplibregl.Popup({
                    closeButton: false,
                    closeOnClick: false,
                    offset: 12
                });

                function showHotspotPopup(event) {
                    const feature = event.features && event.features[0];
                    if (!feature) {
                        return;
                    }

                    const properties = feature.properties || {};
                    const content = document.createElement("div");
                    const title = document.createElement("strong");
                    title.textContent = properties.itemID || "Waste hotspot";
                    content.appendChild(title);

                    const wasteType = document.createElement("p");
                    wasteType.textContent = `Waste type: ${properties.wasteType || "Unknown"}`;
                    content.appendChild(wasteType);

                    const source = document.createElement("p");
                    source.textContent = `Found by Source ${properties.Source ?? "N/A"}`;
                    content.appendChild(source);

                    const confidence_score = document.createElement("p");
                    confidence_score.textContent = `Source model had a confidence of ${properties.modelConfidence ?? "N/A"}`;
                    content.appendChild(confidence_score);

                    if (properties.itempath) {
                        const image = document.createElement("img");
                        image.src = properties.itempath;
                        image.alt = "Trash image";
                        image.style.maxWidth = "100%";
                        image.style.maxHeight = "160px";
                        content.appendChild(image);
                    }


                    hotspotPopup
                        .setLngLat(feature.geometry.coordinates.slice())
                        .setDOMContent(content)
                        .addTo(map);
                }

                map.on("mouseenter", "hotspot-points", event => {
                    map.getCanvas().style.cursor = "pointer";
                    showHotspotPopup(event);
                });

                map.on("mousemove", "hotspot-points", showHotspotPopup);

                map.on("mouseleave", "hotspot-points", () => {
                    map.getCanvas().style.cursor = "";
                    hotspotPopup.remove();
                });

                console.log("Available Shortbread layers styled.");

            } catch (error) {
                console.error(
                    "Could not load or style the PMTiles archive:",
                    error
                );
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
