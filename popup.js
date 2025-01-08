const cache = new Map();
let searchResults = []; // Store results globally for filtering and exporting

// Helper Functions
function getSelection() {
  return window.getSelection().toString();
}

function showSpinner(query) {
  document.getElementById("spinner").classList.remove("hide");
  document.getElementById("results").classList.add("hide");
}

function hideSpinner() {
  document.getElementById("spinner").classList.add("hide");
  document.getElementById("results").classList.remove("hide");
}

function logError(message, error) {
  console.error(message, error);
  document.getElementById("error").innerText = message;
}

// Fetch and Cache API Requests
async function fetchWithCache(url) {
  if (cache.has(url)) {
    return cache.get(url);
  }
  const response = await fetch(url);
  if (response.ok) {
    const json = await response.json();
    cache.set(url, json);
    return json;
  }
  throw new Error("Fetch failed");
}

// Render Results with Filtering
function renderResults() {
  const levelFilter = document.getElementById("levelFilter").value;
  const resultsContainer = document.getElementById("resultsContainer");
  resultsContainer.innerHTML = "";

  const filteredResults = searchResults.filter(
    (result) => !levelFilter || result.Level === parseInt(levelFilter)
  );

  filteredResults.forEach((result) => {
    const item = document.createElement("div");
    item.classList.add("result-item");
    item.innerText = `${result.Name} - Level: ${result.Level}`;
    item.onclick = () => {
      document.getElementById("name").innerText = result.Name;
      document.getElementById("level").innerText = `Level: ${result.Level}`;
      document.getElementById(
        "link"
      ).innerHTML = `<a target="_blank" href="https://jfp.csc.fi/jufoportal?Jufo_ID=${result.Jufo_ID}">Open in JUFO portal</a>`;
    };
    resultsContainer.appendChild(item);
  });

  hideSpinner();
}

// Export Results to CSV
function exportToCSV() {
  const csvContent = searchResults
    .map((result) => `${result.Name},${result.Level}`)
    .join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "jufo_results.csv";
  link.click();
}

// Save Search to History
function saveToHistory(query) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  if (!history.includes(query)) {
    history.push(query);
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }
  loadHistory();
}

// Load Search History
function loadHistory() {
  const historyContainer = document.getElementById("historyContainer");
  const history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  historyContainer.innerHTML = "";

  history.forEach((query) => {
    const item = document.createElement("div");
    item.classList.add("result-item");
    item.innerText = query;
    item.onclick = () => processSelection(query);
    historyContainer.appendChild(item);
  });
}

// Process Selection
async function processSelection(selectedText) {
  saveToHistory(selectedText);

  const isISSN = /^[0-9]{4}-[0-9]{3}[0-9X]$/.test(selectedText);
  const searchURL = isISSN
    ? `https://jufo-rest.csc.fi/v1.1/etsi.php?issn=${selectedText}`
    : `https://jufo-rest.csc.fi/v1.1/etsi.php?nimi=${selectedText}`;

  try {
    const results = await fetchWithCache(searchURL);
    if (results.length > 0) {
      searchResults = results;
      renderResults();
    } else {
      document.getElementById("error").innerText =
        "No results found. Please refine your search.";
    }
  } catch (error) {
    logError("An unexpected error occurred during the search.", error);
  }
}

// Event Listeners
document
  .getElementById("manualSearchButton")
  .addEventListener("click", async () => {
    const manualInput = document.getElementById("manualInput").value.trim();
    if (manualInput) {
      showSpinner(manualInput);
      await processSelection(manualInput);
    } else {
      document.getElementById("error").innerText =
        "Please enter a valid ISSN or journal name.";
    }
  });

document.getElementById("exportButton").addEventListener("click", exportToCSV);

document
  .getElementById("levelFilter")
  .addEventListener("change", renderResults);

document.addEventListener("DOMContentLoaded", () => {
  loadHistory();
});
