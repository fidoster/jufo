# JUFO Quick Check Chrome Extension

This Chrome extension allows you to quickly search the JUFO database for a selected ISSN or journal name on any webpage. You can also manually enter an ISSN or journal title, filter the results by **Level** (including a combined 2 & 3 button), and **export** the results as a CSV file.

## Features

1. **Automatic Search**  
   - Highlights text in the active tab, and the extension auto-searches when opened.
2. **Manual Search**  
   - Type an ISSN or journal name in the provided search box. Press **Enter** or click **Search**.
3. **Level Filters**  
   - The extension fetches more details on each journal channel (via `/kanava/<Jufo_ID>`) to obtain a numeric `Level`.  
   - You can then click the filter buttons (e.g., `All`, `2&3`, `2`, `3`, etc.) to narrow down the results.
4. **Export to CSV**  
   - After results load, click **Export CSV** to download all items as `results.csv`.
5. **Use of Google Fonts**  
   - By default, this project loads the **Lora** font for the results container, providing a more professional look.  
   - You can change or remove the `<link>` for any other fonts you prefer.

## Installation

1. **Clone or Download** the repository to your local machine.
2. Open **Chrome** and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right corner).
4. Click **Load unpacked** and select the folder containing `popup.html`, `popup.js`, and your `manifest.json`.
5. The extension should appear in your toolbar.

## Files

- **popup.html**  
  The main UI layout for the extension’s popup window. Contains references to Google Fonts and custom styling.

- **popup.js**  
  Contains all the logic for:
  - Querying the selected text in the active tab  
  - Performing multiple fallback searches (ISSN, `?nimi=`, `?nimi=*...*`)  
  - Fetching details about each result (Level, Name)  
  - Rendering the filter buttons and results  
  - CSV export  

- **manifest.json**  
  A Chrome extension configuration file. Ensure it has `"permissions": ["activeTab", "scripting"]` and sets `"default_popup": "popup.html"`.

## Usage

1. **Highlight** an ISSN or journal name on any webpage.  
2. Open the extension’s **popup**.  
3. If automatically found, results will appear. Otherwise, enter a search term in the text box and press **Enter** or click **Search**.  
4. Filter results by clicking the level buttons.  
5. Click **Export CSV** to save the data locally.

## Troubleshooting

- **No Results**:  
  The JUFO REST API might not return any data for certain queries, or the item truly doesn’t exist in JUFO.  
- **Spinner Doesn’t Disappear**:  
  Check the console for network errors. Right-click the popup → **Inspect** → Console.  
- **Font Not Displaying**:  
  Confirm the `<link>` to Google Fonts is active and that your connection is valid. Fallback fonts will appear otherwise.

## License

This project is provided as-is; check the [JUFO REST API terms](https://jufo-rest.csc.fi/) before distributing widely.

---

Enjoy using **JUFO Quick Check** for quick searches, level filtering, and CSV exports!
