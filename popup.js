/********************************************************
 * GLOBAL: We'll store the entire list of search results
 * (with Jufo_ID, Level, Name, etc.) in-memory, so we can:
 *  - Show all items at once
 *  - Filter by level (including combined 2 & 3)
 *  - Export as CSV
 ********************************************************/
let cachedSearchResults = [];

/********************************************************
 * 1) UTILITY: fetch selected text from the current tab
 ********************************************************/
function getSelection() {
  return window.getSelection().toString();
}

/********************************************************
 * 2) Attempt multiple queries in sequence:
 *    (1) ?issn=<query>
 *    (2) ?nimi=<query>
 *    (3) ?nimi=*<query>*
 * Returns the first non-empty array found, or null if none.
 ********************************************************/
async function tryQueriesInSequence(query) {
  // Helper that attempts to fetch + parse; returns array or null
  async function doFetch(url) {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const text = await resp.text();
    if (!text) return null;
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      return null;
    }
    return null;
  }

  // 1) ISSN
  let url =
    "https://jufo-rest.csc.fi/v1.1/etsi.php?issn=" + encodeURIComponent(query);
  let data = await doFetch(url);
  if (data) return data;

  // 2) ?nimi=<query>
  url =
    "https://jufo-rest.csc.fi/v1.1/etsi.php?nimi=" + encodeURIComponent(query);
  data = await doFetch(url);
  if (data) return data;

  // 3) ?nimi=*<query>*
  url =
    "https://jufo-rest.csc.fi/v1.1/etsi.php?nimi=" +
    encodeURIComponent(`*${query}*`);
  data = await doFetch(url);
  if (data) return data;

  // If all failed
  return null;
}

/********************************************************
 * 3) After search, we fetch the 'kanava/<Jufo_ID>' details
 *    for each item so we have Name and Level.
 ********************************************************/
async function augmentSearchResult(item) {
  if (!item.Jufo_ID) return item;

  try {
    const detailsUrl = "https://jufo-rest.csc.fi/v1.1/kanava/" + item.Jufo_ID;
    const resp = await fetch(detailsUrl);
    if (!resp.ok) return item;

    const detailJson = await resp.json();
    if (Array.isArray(detailJson) && detailJson.length > 0) {
      item.Level = detailJson[0].Level;
      item.Name = detailJson[0].Name;
    }
    return item;
  } catch {
    return item;
  }
}

/********************************************************
 * 4) RENDERING: Filter "cachedSearchResults" by level
 *    and build the HTML
 ********************************************************/
function renderAllResults(filterLevel = null) {
  const container = document.getElementById("resultsContainer");
  container.innerHTML = "";

  let filteredItems = cachedSearchResults;

  // "2 & 3" combined filter
  if (filterLevel === "2_3") {
    filteredItems = cachedSearchResults.filter(
      (it) => it.Level === 2 || it.Level === 3
    );
  } else if (filterLevel !== null) {
    // normal numeric level (0,1,2,3,...)
    filteredItems = cachedSearchResults.filter(
      (it) => it.Level === filterLevel
    );
  }

  if (!filteredItems.length) {
    container.innerHTML = '<div class="result-item">No results found</div>';
    return;
  }

  // Build HTML from each item
  const htmlPieces = filteredItems.map((item) => {
    const jufoID = item.Jufo_ID || "";
    const level = item.Level != null ? item.Level : "N/A";
    const name = item.Name || item.Title || item.Nimi || "Unknown";

    return `
      <div class="result-item">
        <div><strong>Name:</strong> ${name}</div>
        <div><strong>Level:</strong> ${level}</div>
        <div>
          <a target="_blank" href="https://jfp.csc.fi/jufoportal?Jufo_ID=${jufoID}">
            Open in JUFO portal
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = htmlPieces.join("");
}

/********************************************************
 * 5) RENDERING: Create level filter buttons
 *    (All, 2 & 3, then each numeric level)
 ********************************************************/
function renderLevelFilters() {
  const filterContainer = document.getElementById("levelFilters");
  filterContainer.innerHTML = "";

  // Gather unique numeric levels
  const levels = [
    ...new Set(
      cachedSearchResults.map((r) => r.Level).filter((l) => l != null)
    ),
  ];

  if (!levels.length) {
    filterContainer.classList.add("hide");
    return;
  }

  filterContainer.classList.remove("hide");

  const labelSpan = document.createElement("span");
  labelSpan.id = "filterLabel";
  labelSpan.textContent = "Levels:";
  filterContainer.appendChild(labelSpan);

  // "All" button
  const showAllBtn = document.createElement("button");
  showAllBtn.textContent = "All";
  showAllBtn.onclick = () => renderAllResults(null);
  filterContainer.appendChild(showAllBtn);

  // Combined 2 & 3 if they exist
  if (levels.includes(2) || levels.includes(3)) {
    const combBtn = document.createElement("button");
    combBtn.textContent = "2 & 3";
    combBtn.onclick = () => renderAllResults("2_3");
    filterContainer.appendChild(combBtn);
  }

  // One button per unique level (0,1,2,3,...)
  levels.forEach((level) => {
    const btn = document.createElement("button");
    btn.textContent = `${level}`;
    btn.onclick = () => renderAllResults(level);
    filterContainer.appendChild(btn);
  });
}

/********************************************************
 * 6) CSV EXPORT
 ********************************************************/
function exportToCSV() {
  if (!cachedSearchResults.length) {
    alert("No results to export!");
    return;
  }
  // Columns: "Jufo_ID,Name,Level"
  let csvContent = "Jufo_ID,Name,Level\n";
  for (const item of cachedSearchResults) {
    const jufoID = item.Jufo_ID || "";
    const name = (item.Name || "").replace(/"/g, '""');
    const level = item.Level != null ? item.Level : "";
    csvContent += `${jufoID},"${name}",${level}\n`;
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/********************************************************
 * 7) After final search results:
 *    - For each item, fetch detail => store Name, Level
 *    - Then store globally
 *    - Render filter buttons + show "Export CSV" + results
 ********************************************************/
async function processSearchResults(resultsArray) {
  const augmented = await Promise.all(resultsArray.map(augmentSearchResult));
  cachedSearchResults = augmented;

  // Build level filter buttons
  renderLevelFilters();
  // Display all items by default
  renderAllResults(null);

  // Show the "Export CSV" button
  const exportBtn = document.getElementById("exportButton");
  exportBtn.classList.remove("hide");
}

/********************************************************
 * 8) MAIN SEARCH
 ********************************************************/
async function initiateSearch(query) {
  // Reset
  document.getElementById("error").innerText = "";
  document.getElementById("resultsContainer").innerHTML = "";
  document.getElementById("highlighted").innerText = query;
  document.getElementById("levelFilters").classList.add("hide");
  document.getElementById("exportButton").classList.add("hide");

  // Show spinner
  document.getElementById("spinner").classList.remove("hide");

  try {
    const data = await tryQueriesInSequence(query);
    if (!data) {
      throw new Error("No results found");
    }
    // Fetch details for each item
    await processSearchResults(data);
  } catch (error) {
    document.getElementById("error").innerText =
      "Search error: " + error.message;
  } finally {
    // Reveal results area, hide spinner
    document.getElementById("results").classList.remove("hide");
    document.getElementById("spinner").classList.add("hide");
  }
}

/********************************************************
 * 9) AUTO-SEARCH: Use the selected text from the active tab
 ********************************************************/
async function doJufoSearch() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    chrome.scripting.executeScript(
      { target: { tabId: tab.id }, func: getSelection },
      async (results) => {
        const selected = ((results && results[0].result) || "").trim();
        if (selected.length > 0) {
          initiateSearch(selected);
        } else {
          document.getElementById("error").innerText =
            "No text selected in the page.";
        }
      }
    );
  } catch (error) {
    document.getElementById("error").innerText =
      "Could not detect selected text: " + error.message;
  }
}

/********************************************************
 * 10) MANUAL SEARCH
 ********************************************************/
async function manualSearch() {
  const query = document.getElementById("searchInput").value.trim();
  if (!query) {
    document.getElementById("error").innerText =
      "Please enter an ISSN or a journal name.";
    return;
  }
  initiateSearch(query);
}

/********************************************************
 * 11) On popup load
 ********************************************************/
document.addEventListener("DOMContentLoaded", () => {
  // Try auto-search for selected text
  doJufoSearch();

  // Manual search event
  document
    .getElementById("searchButton")
    .addEventListener("click", manualSearch);

  // **ENTER KEY** triggers the same manualSearch()
  document.getElementById("searchInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      manualSearch();
    }
  });

  // Export CSV event
  document
    .getElementById("exportButton")
    .addEventListener("click", exportToCSV);
});
