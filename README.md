# A totally normal fishing rpg

**Play it online:** [a-totally-normal-fishing-rpg.hedgwhog.com](https://a-totally-normal-fishing-rpg.hedgwhog.com/)

## Run it on your own computer 
By running this on your own computer, VoIP only works for people on the same network.

1. Install [Node.js](https://nodejs.org) (version 22 or newer).
2. Download this code and open the folder in a terminal.
3. Run `npm install` (only the first time).
4. Run `npm start`.
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

Your saves are stored in the `data` folder on your own computer, so they're separate from your saves on the website.

## Admins and moderation
Admins are set in `data/admins.json`. It is made that the first time the server starts, that `hedgwhog` is the admin. Add more usernames like this
(they need an account first):
```json
{ "admins": ["hedgwhog", "anotherusername"] }
```
Admins get an Admin button on the start screen to handle reports, warn, time out, ban, delete messages and accounts, and send an emergency notice to everyone. Every action is written to `data/modlog.json`.

The word filter is `data/filter.json` (also made on the first start, with a small starter list). Everything in `data/` is private and is never uploaded to GitHub (see `.gitignore`).

## Found a security problem, or something about another player?
Please don't open a public issue. Email hedgwhog@gmail.com instead.

## License
All rights reserved, see [LICENSE](LICENSE). You may look at the code and run it on your own computer, but not host the game,
use the music, or use its art for profit.

## Use of AI
AI is during the development of coding, but it will never be used for art and music. 
I am trying to use AI as little as possible, but I want to release updates often, so people have enough content to keep enjoying.

## Credits
Developer: [Hedgwhog](https://github.com/hedgwhog)
OST producer: [SilteTheFloof](https://github.com/siltefluff-glitch)
