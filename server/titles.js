// Titles (the list is in js/shared/data/titles.js). Stored in the account: owned titles, and the one you wear.
import { config } from "./config.js";
import * as store from "./store.js";
import { titles, titleName } from "../js/shared/data/titles.js";
import { gameCompletion } from "../js/shared/rules/completion.js";

function titlesOf(userId) {
    const account = store.getAccount(userId);
    account.titles ??= [];
    return account;
}

// gives earned titles: Legendary Angler for a save at 100%
export function checkEarnedTitles(userId) {
    const account = titlesOf(userId);
    if (account.titles.includes("legendaryAngler")) return;
    for (let slot = 1; slot <= config.saveSlots; slot++) {
        const save = store.loadSave(userId, slot);
        if (save && gameCompletion(save) >= 0.9999) { // 100% (allowing for rounding)
            account.titles.push("legendaryAngler");
            store.saveAccounts();
            return;
        }
    }
}

export const ownedTitles = userId => titlesOf(userId).titles.filter(id => titles[id]);

// the title someone wears, as text ("Developer"), or null
export function wornTitle(userId) {
    const account = titlesOf(userId);
    return account.titles.includes(account.title) ? titleName(account.title) : null;
}

export function wearTitle(userId, id) {
    const account = titlesOf(userId);
    if (id && !account.titles.includes(id)) throw new Error("You don't have that title.");
    account.title = id || null;
    store.saveAccounts();
}

// admins give or take staff titles
export function setStaffTitle(userId, id, give) {
    if (!titles[id] || !titles[id].staff) throw new Error("That title can't be given by admins.");
    const account = titlesOf(userId);
    account.titles = account.titles.filter(owned => owned !== id);
    if (give) account.titles.push(id);
    else if (account.title === id) account.title = null;
    store.saveAccounts();
}
