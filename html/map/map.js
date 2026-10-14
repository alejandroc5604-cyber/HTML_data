
// first fetch the database thing data
const base_url = 'http://192.168.100.22:8000';
async function fetch_databases() {

    const FindDB = '/DB_FindDB'
    try {
    const find_db_response = await fetch(`${base_url}${FindDB}`);

    if (!find_db_response.ok) {
        throw new Error(`at fetch_databaseFailed Connection: ${find_db_response.status}`);
    }
    
    const data = await find_db_response.json();
    console.log(`At fetch_databases:`, data);
    return data
  } catch (error) {
    console.error('Failed to fetch data:', error.message);
  };
  // const cookie_value = encodeURIComponent(JSON.stringify(data));
  
  //document.cookie = `Found_DB=${cookie_value}; path=/;`;


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
        count = 0
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

///////////////////////////////////////////////////////////////////////

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function myFunction() {
  document.getElementById("myDropdown").classList.toggle("show");
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
} 




async function populateSelectDatabaseDropdown() {
  // we are going to use the  name (filename) structure
  recv_data = await fetch_databases();
  console.log(`At populateselectdatabase dropdown, we have this returned data`, recv_data)
  if (recv_data == undefined){
    console.log("At populateSelectDatabaseDropdown, no data has been return from fetch_databases");
    return 0
  };
  data = recv_data;
  // now we have the data, so then populate it
  dropdown_div = document.getElementById('myDropdown');
  // now go through each of the things one at the time, and add it
for (const database_pair of data.Databases) {
    const newAtag = document.createElement('a');

    console.log(
        "Database:",
        database_pair.Database_Name,
        database_pair.Database_filename
    );

    newAtag.textContent =
        `${database_pair.Database_Name} (${database_pair.Database_filename})`;

      newAtag.addEventListener('click', (event) => {
        event.preventDefault();
        
      })

    dropdown_div.append(newAtag);
    // :)
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
  fetch_database_data('TVlORVdUQUJMRQ==_e0c6b7aa-f4a8-4819-aa36-b1bc8c29b051');
  populateSelectDatabaseDropdown();
});
