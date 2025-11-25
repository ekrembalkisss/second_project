# Source Fusion Studio

A lightweight, front-end only scaffold for collecting sources, extracting metadata, and validating channel inputs before running a motion-graphic style analysis pipeline.

## Features
- **Source capture:** Upload files, add web search and deep search queries, or paste raw text.
- **Metadata gate:** Requires metadata extraction before channel name, title, and script inputs are accepted; adding new sources automatically re-locks the details form until metadata is refreshed.
- **Validation:** Enforces minimum lengths for channel name, title, and script content.
- **Pipeline visualization:** Motion-graphic inspired progress bar with animated orbital indicator and real-time log updates.
- **Report output:** Combines user inputs and a human-like analysis narrative grounded in gathered sources.

## Running locally
Open `src/index.html` in a browser. No build tooling is required.

### Can’t find it on your computer?
1. Note where you placed the project folder (it should be named `second_project`).
2. Open that folder and navigate into `src/`—you should see `index.html`, `styles.css`, and `main.js`.
3. Double-click `index.html` (or drag it into a browser window) to launch the app directly. Alternatively, run `python -m http.server 8000 --directory src` from the project root and visit <http://localhost:8000>.
4. If you don’t see the files, re-extract or re-clone the project, ensuring the path includes the `src/` directory with `index.html` inside.
