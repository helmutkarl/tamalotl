# Tamalotl

Tamalotl is a tiny Tamagotchi-inspired axolotl game built as a static web app.
It has no backend, no login, no database, and stores its state only in the
browser with `localStorage`.

## File structure

```text
tamalotl/
|- index.html
|- css/
|  |- styles.css
|- js/
|  |- constants.js
|  |- storage.js
|  |- game.js
|  |- ui.js
|  |- app.js
|- README.md
```

## Local start

### Option 1: open directly

Because this version uses plain HTML, CSS, and classic browser scripts, you can
open `index.html` directly in your browser.

### Option 2: use a tiny local web server

If you prefer running it through a local server, you can use Python:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## How it works

- `js/constants.js` contains balancing values, labels, and text.
- `js/storage.js` loads and saves the game from `localStorage`.
- `js/game.js` handles decay over time, actions, and mood selection.
- `js/ui.js` updates the DOM.
- `js/app.js` wires everything together.

## Core gameplay in v1

- Tamalotl has four values: Hunger, Happiness, Energy, and Cleanliness.
- Values slowly drift down over time.
- The `Feed`, `Play`, `Sleep`, and `Clean` buttons adjust those values.
- Tamalotl reacts with simple states: `happy`, `hungry`, `sleepy`, and `dirty`.
- Reloading the page keeps the current state in the same browser.

## Hosting later on a Raspberry Pi

Because the app is fully static, the Raspberry Pi setup can stay very simple:

1. Copy the project folder onto the Pi.
2. Open a terminal in that folder.
3. Start a basic web server:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

4. On the iPhone, while connected to the same Wi-Fi, open:

```text
http://raspberrypi.local:8080
```

If `raspberrypi.local` does not resolve in your network, use the Pi's local IP
address instead, for example `http://192.168.1.42:8080`.

## Notes

- Save data is per browser and per device because it lives in `localStorage`.
- If you later host it on the Raspberry Pi, each browser keeps its own local
  save.
- This first version is intentionally small so it is easy to extend with things
  like animations, items, sounds, or more moods later.
