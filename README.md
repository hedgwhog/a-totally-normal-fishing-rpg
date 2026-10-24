# A totally normal fishing rpg

To play it online, here is the link: [game](https://a-totally-normal-fishing-rpg.hedgwhog.com/).

## Running it locally

The game uses JavaScript modules and loads the ASCII art with `fetch`, and browsers block both when you open
`index.html` straight from your files (`file://`). Start a small local server in the project folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

Your saves from the website and from localhost won't be the same, because saves are stored in your browser's local storage per site.

## Music

Browsers don't allow music to start before you have clicked or pressed a key on the page. After a refresh,
the music starts as soon as you click anywhere or press a key. The "Refresh OST" button in the settings reloads the track.

## How the code is organized

Every file starts with a comment that says what it does and how to change it.

```
index.html             start page (update list), opens introduction.html
introduction.html      the story, opens game.html
game.html              the game screen (one <div class="island"> per island)
css/style.css          all the styling, split into sections
ost/                   music
ascii/
  gear/hats|cloaks|rods/   art for every piece of gear (<id>.txt)
  map/<island>/            the world map squares of each island (10 x 6 characters)
  map/icon.txt             the map icon in your inventory
js/
  main.js          starts the game, loads everything
  data/            ALL THE NUMBERS: fish, gear, items, enchants, map pieces, merchant
  islands/<island>/  one file per event on that island + index.js that adds them
  dialogue.js      the event box: say(), ask(), askYesNo() (instead of alert/confirm)
  fishing.js       the fishing mini game
  actions.js       Fishing, Sleeping & Rest buttons
  time.js          day & time of day
  islands.js       which island you're on, which events are open
  travel.js        traveling to another island (with the loading bar)
  map.js           the world map
  catalogue.js     the catalogue pages
  fishLog.js       which fish species you discovered
  gear.js          equipped gear, backpack and stats
  itemBag.js       items list (trinkets, bottles, supplies, special items)
  fishBag.js       your fish and selling them
  wallet.js / resonance.js   coins and resonance
  settings.js / audio.js     settings (including the reset button) and music
  save.js / ui.js / ascii.js / helpers.js   small helpers
```

### Adding things
- A new fish, item, piece of gear or enchant: add it to the right file in `js/data/`.
- A new map piece: add a `.txt` file in `ascii/map/<island>/` and add it to `js/data/mapPieces.js`.
- A new event: add a button to the island's event list in `game.html`, make a file in `js/islands/<island>/`, and add it in that island's `index.js`.
- A new island: see the comment at the top of `js/islands.js`.

### Temporary things
- `js/islands/pointDriftt/backToHaven.js`: a boat back to Freshwater Haven, until Point Driftt has its own events.

### Resetting your save
Settings → "Remove localStorage" deletes all progress and settings.
