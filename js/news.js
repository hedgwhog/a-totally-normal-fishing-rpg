import { birds } from "./data/birds.js";
import { lines } from "./data/dialogue.js";
import { findTile, towns } from "./data/world.js";
import { direction } from "./rules/birds.js";
import { getState, onState, act } from "./state.js";
import { say, pick, fill, whenFree } from "./dialogue.js";
import { giftText } from "./mail.js";

let busy = false;

function newsLine(news) {
    const bird = getState().bird;
    const name = bird ? bird.name : birds.defaultName;
    if (news.type === "discovered") {
        const tile = findTile(news.tile);
        const town = towns[news.from] || towns.freshwaterHaven;
        return fill(pick(lines.pigeon.discovered), {
            bird: name,
            place: tile ? tile.name : "new waters",
            direction: tile ? direction(town, tile) : "somewhere",
            town: town.name,
        });
    }
    if (news.type === "delivered") return fill(pick(lines.pigeon.delivered), { bird: name, friend: news.toName });
    if (news.type === "letter") {
        const gifts = giftText(news.gifts || {});
        return fill(pick(lines.pigeon.letter), { friend: news.fromName, gifts: gifts ? "\nIt also brought: " + gifts + "." : "" });
    }
    return null;
}

async function showNews() {
    if (busy || !getState().news || getState().news.length === 0) return;
    busy = true;
    let seen = false;
    try {
        await whenFree();
        const news = getState().news;
        const text = news.map(newsLine).filter(Boolean);
        if (text.length > 0) await say(text);
        seen = !(await act("news.seen", { count: news.length })).error;
    } finally {
        busy = false;
    }
    if (seen) showNews();
}

onState(showNews);
showNews();
