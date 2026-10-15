
import * as maplibregl from "https://unpkg.com/maplibre-gl@6.14.0/dist/maplibre-gl.mjs";

// first fetch the database thing data
const base_url = 'http://192.168.100.22:8000';
let activeMap;
async function fetch_databases() {
    const FindDB = '/DB_FindDB';
    try {
        const find_db_response = await fetch(`${base_url}${FindDB}`);

        if (!find_db_response.ok) {
            throw new Error(`Failed Connection: ${find_db_response.status}`);
        }

        const response_data = await find_db_response.json();
        console.log('At fetch_databases:', response_data);
        return response_data;
    } catch (error) {
        console.error('Failed to fetch databases:', error.message);
        throw error;
    }
}
async function fetch_database_data(database_name){
    //at this point, the user has selected the database they want, so then the hotspot should be loaded
    const FetchData = `/DB_GetDatabase/${encodeURIComponent(database_name)}?limit=1000`;
    try {
        const fetch_db_response = await fetch(`${base_url}${FetchData}`);

        if (!fetch_db_response.ok) {
            throw new Error(`Failed Connection: ${fetch_db_response.status}`);
        }

        const response_data = await fetch_db_response.json();
        if (!Array.isArray(response_data.FoundData)) {
            throw new Error('Invalid database response: FoundData must be an array');
        }

        console.log("SUCCESFUL: ");
        var count = 0
        for (const found_trash of response_data.FoundData) {
            count ++;
        }
        console.log(`Found a total of ${count} items in ${database_name}`)
        return response_data.FoundData;
    } catch (error) {
        console.error('Failed to fetch data from the database:', error.message);
        throw error;
    }
};

async function SetupMap(database_filename) {
  var data;
  data = await fetch_database_data(database_filename);
  if (activeMap) {
    activeMap.remove();
  }

  const map = new maplibregl.Map({
      container: "map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [36.8219, -1.2921],
      zoom: 11
  });
  activeMap = map;

  map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
  );

  // Add the markers
  console.log("At setup map, we have: ", data)
  for (const found_trash of data){
    var latitude; 
    var longitude;
    var ConfidenceScore;
    var type;

    latitude = found_trash.latitude
    longitude = found_trash.longitude
    ConfidenceScore = found_trash.confidence_score
    new maplibregl.Marker()
        .setLngLat([longitude, latitude])
        .setPopup(
            new maplibregl.Popup()
                .setText(`Confidence Score: ${ConfidenceScore}\n`)
        )
        .addTo(map);
        break
    }


}


async function populateSelectDatabaseDropdown() {
  const response_data = await fetch_databases();
  if (!Array.isArray(response_data.Databases)) {
    throw new Error('Invalid database list response: Databases must be an array');
  }

  const dropdown = document.getElementById('myDropdown');
  if (!dropdown) {
    throw new Error('Database dropdown element was not found');
  }

  for (const database of response_data.Databases) {
    const databaseLink = document.createElement('a');
    databaseLink.href = '#';
    databaseLink.textContent =
      `${database.Database_Name} (${database.Database_filename})`;
    databaseLink.addEventListener('click', async (event) => {
        event.preventDefault();
        dropdown.classList.remove('show');
        try {
          await SetupMap(database.Database_filename);
        } catch (error) {
          console.error(`Failed to load database "${database.Database_Name}":`, error.message);
        }
    });
    dropdown.append(databaseLink);
  }
}
function getCookie(name) {
  const cookies = document.cookie.split('; ');
  for (let i = 0; i < cookies.length; i++) {
    const [key, value] = cookies[i].split('=');
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}


//fetch_databases();

document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('myDropdown');
  const dropdownButton = document.getElementById('databaseDropdownButton');

  dropdownButton.addEventListener('click', () => {
    dropdown.classList.toggle('show');
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.dropdown')) {
      dropdown.classList.remove('show');
    }
  });

  SetupMap('TVlORVdUQUJMRQ==_e0c6b7aa-f4a8-4819-aa36-b1bc8c29b051')
    .catch((error) => console.error('Failed to load the initial database:', error.message));
  populateSelectDatabaseDropdown()
    .catch((error) => console.error('Failed to populate the database dropdown:', error.message));
});
