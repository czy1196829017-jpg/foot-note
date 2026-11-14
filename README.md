# FOOT NOTE

A Figma-based interactive city-walk web prototype. Opens directly at the login screen; demo sign-in continues to the Shanghai map.

## Preview

On Windows, extract the project and double-click `启动预览.bat`.

Alternatively, run the following command inside `site/`:

```sh
python3 -m http.server 8787 --bind 127.0.0.1
```

Then open http://localhost:8787/ . Use a local HTTP server rather than opening HTML files directly, so the vector map data can load.

## Features

- Demo login flow
- City, street and architectural map views
- Building conversations and task camera prototype
- Editable exploration journal
- Community diary and profile achievements
- Browser-local settings and saved content

The `site/` folder contains the static website and its assets. No production authentication or cloud AI backend is included. Camera access requires browser permission. Saved content stays in each user's browser.

Map data: © OpenStreetMap contributors, OpenFreeMap / OpenMapTiles. Design and other imagery are project-provided assets; no blanket reuse license is granted by this repository.
