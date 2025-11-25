# Source Fusion Studio

A lightweight, front-end only scaffold for collecting sources, extracting metadata, and validating channel inputs before running a motion-graphic style analysis pipeline.

## Features
- **Source capture:** Upload files (including DOCX text extraction), add web search and deep search queries, or paste raw text.
- **Metadata gate:** Requires metadata extraction before channel name, title, and script inputs are accepted; adding new sources automatically re-locks the details form until metadata is refreshed. Extraction now scans full source text, surfaces per-source word counts, key takeaways, and full-text previews.
- **Validation:** Enforces minimum lengths for channel name, title, and script content.
- **Pipeline visualization:** Motion-graphic inspired progress bar with animated orbital indicator and real-time log updates.
- **Fact-aware accuracy check:** Detects factual sentences (ignoring humor, fiction, or expressive lines), measures coverage against captured sources, and flags only factual statements lacking evidence.
- **Report output:** Combines user inputs, evidence coverage, and a human-like analysis narrative grounded in gathered sources.
- **Exports:** Download the latest run as JSON or plain text to reuse results for training or offline review.

## Factual accuracy logic
- Only sentences containing verifiable claims (numbers, dates, measurements, or declarative fact verbs) are checked for evidence.
- Expressive, humorous, fictional, or very short lines are treated as narrative and never flagged.
- Coverage represents the share of factual sentences that show overlap with captured sources; the flagged list contains only factual sentences missing evidence.

## Exporting results
1. Add sources and run **Extract Metadata**.
2. Provide channel details and click **Run Analysis Pipeline**.
3. After the report renders, use **Export JSON** or **Export Text** in the Report section to download the complete run (inputs, metadata, accuracy stats, and pipeline log) in your preferred format.

## Running locally
You can open the app directly from the file system or serve it with a lightweight local server—no build step or extra tooling required.

### Option A: Open the file directly
1. Locate the project folder (`second_project`) on your machine.
2. Open `second_project/src/` and confirm you see `index.html`, `styles.css`, and `main.js`.
3. Double-click `index.html` (or drag it onto an open browser window). The app will load immediately from the file.

### Option B: Use a simple local server (avoids file:// restrictions some browsers impose)
1. Open a terminal and change into the project folder:
   - macOS/Linux: `cd /path/to/second_project`
   - Windows (PowerShell): `cd "C:\\path\\to\\second_project"`
2. Start the server from the project root:
   - macOS/Linux: `python3 -m http.server 8000 --directory src`
   - Windows (PowerShell): `python -m http.server 8000 --directory src`
3. Visit <http://localhost:8000> in your browser to use the app.

### If you still can’t find the files
1. Re-extract or re-clone the project to a known location (e.g., your Desktop or Documents folder).
2. Repeat the steps above, making sure the `src/` folder contains `index.html`, `styles.css`, and `main.js`.
