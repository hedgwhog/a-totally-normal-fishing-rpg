// The word filter. Filtered words are replaced with *** (only the word, not the whole message).
// The list is data/filter.json, so it stays private (it's not in the public repository).
// The first time the server starts without that file, it makes one with a small starter list.
//
// data/filter.json: { "words": ["word", "word*"] }
//   "word"   matches the word itself, and with a simple ending (word, words, wordy, worded, wording, worder(s)).
//   "word*"  matches every word that starts with it (word, wordsmith, ...). Use it with care.
// Matching ignores capitals, accents, repeated letters (wooord) and common look-alikes (w0rd, w@rd).
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";

const file = path.join(path.resolve(config.dataDir), "filter.json");

// a starter list of obvious words. Grow it in data/filter.json.
const starter = [
    "fuck*", "shit*", "bitch*", "cunt*", "dick", "dickhead*", "cock", "pussy", "whore*", "slut*", "bastard*",
    "asshole*", "motherfuck*", "wank*", "twat*", "porn*", "nigger*", "nigga*", "faggot*", "fag", "retard*",
    "kike*", "chink*", "spic", "tranny*", "rape*", "rapist*", "nazi*", "kys",
];

let entries = [];

const lookalikes = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i", "|": "i" };

// lowercase, no accents, look-alikes replaced, repeated letters squeezed ("fuuuck" -> "fuck")
function simplify(word) {
    return word.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
        .replace(/[01345789@$!|]/g, character => lookalikes[character] || character)
        .replace(/[^a-z]/g, "")
        .replace(/(.)\1+/g, "$1");
}

function load() {
    let words = starter;
    try {
        words = JSON.parse(fs.readFileSync(file, "utf8")).words || [];
    } catch {
        try {
            fs.writeFileSync(file, JSON.stringify({ words: starter }, null, 2));
        } catch {
            // no data folder yet: the starter list is used
        }
    }
    entries = words.map(word => ({ prefix: word.endsWith("*"), base: simplify(word.replace(/\*$/, "")) })).filter(entry => entry.base);
}
load();
fs.watchFile(file, { interval: 5000 }, load); // changes in data/filter.json work without a restart

const endings = ["", "s", "es", "y", "ed", "ing", "er", "ers"];

function isFiltered(word) {
    const simple = simplify(word);
    if (!simple) return false;
    return entries.some(entry => (entry.prefix ? simple.startsWith(entry.base) : endings.some(ending => simple === entry.base + ending)));
}

// a "word" is a run of letters, digits and look-alike characters (! and | only count inside a word: "sh!t", not "hi!")
const wordPattern = /[\p{L}\p{N}@$]+(?:[!|]+[\p{L}\p{N}@$]+)*/gu;

// Links, email addresses and phone numbers are hidden too: they're how scams start, and how people
// move others to private places outside the game. (Rule 4: keep personal info private.)
const contactPatterns = [
    /\b(?:https?:\/\/|www\.)\S+/gi,                                   // links
    /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g,                                // email addresses
    /\b[\w-]+(?:\.[\w-]+)*\.(?:com|net|org|gg|io|me|tv|co|se|uk|de|nl|fr|eu|us|xyz|app|link|ly|to|info|biz|ru|be|dev|site|online|shop|store|live|chat|club)\b(?:\/\S*)?/gi, // example.com, discord.gg/abc
    /(?:\+|\b)\d(?:[\s().-]*\d){7,}\b/g,                                   // phone numbers (8+ digits)
];

function hideContacts(text) {
    return contactPatterns.reduce((result, pattern) => result.replace(pattern, "***"), text);
}

// replaces every filtered word, link, email address and phone number with ***
export function censor(text) {
    return hideContacts(String(text)).replace(wordPattern, word => (isFiltered(word) ? "***" : word));
}

// true when a name contains a filtered word (also when it's glued to other words: "BigFuckFish")
export function hasFilteredWord(text) {
    if (hideContacts(String(text)) !== String(text)) return true;
    if (String(text).match(wordPattern)?.some(isFiltered)) return true;
    const simple = simplify(String(text));
    // glued words: only "word*" entries of 4+ letters, so names like "Dickens" or "Scunthorpe" stay allowed
    return entries.some(entry => entry.prefix && entry.base.length >= 4 && simple.includes(entry.base));
}
