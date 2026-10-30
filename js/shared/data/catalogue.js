import { backpackUpgrades } from "./merchant.js";
import { birds } from "./birds.js";
import { lostGearPercent } from "./merchant.js";
import { routeChartPrice } from "./transport.js";
import { boatman } from "./areas/pointDriftt.js";

export const mechanics = [
    { title: "Time", text: [
        "Every day has 4 times: morning, afternoon, evening and night. Every catch (or miss) moves the time forward. Rest skips one time of the day.",
        "You can only sleep in the evening or at night. Most fish only bite during the day, so sleep when it gets dark.",
    ] },
    { title: "Fishing", text: [
        "Press Fish. Reel in when your line (|) is on the fish (===). Hit it enough times within the rounds, and you catch it.",
        "Your rod decides which waters you can fish in (seen by the brackets behind the rod). Some fish only bite at certain times: check the fish species page.",
    ] },
    { title: "Gear and stats", text: [
        "You wear a hat, a cloak and a fishing rod. Other gear goes in your backpack: click it (or press its number key) to wear it.",
        "The box at the bottom left shows the resonances of your rod first, then all your effects. Scroll it to see everything.",
    ] },
    { title: "Resonance", text: [
        "You get resonance from every fish you catch. Spend it to resonate a rod. The higher the rank, the better the resonances.",
        "Some resonances only show up from a certain rank. A rod with resonances can't be resonated again: use dissonance first to remove them.",
        "These are the resonances you could possible get.",
        "- Luck:", "Increases your luck, one level equals to 0.5% luck, max level is 10", "'",
        "- Focus:", "Makes your rod go slower, one level equals to 2.5%, max level is 10", "'",
        "- Resonity:", "Increases resonance gain, one level equals +0.1, max level is 10", "'",
        "- Hitbox:", "Increases the size of your hitbox by one, max level is 2", "'",
        "- Rewind:", "Gives you the chance to go back a round, one level is one rewind, max level is 3", "'",
        "- Temptation:", "The fish slows down when it touches your line, one level slows the fish for 10%, max level is 5", "'",
    ] },
    { title: "Buying and selling gear", text: [
        "Gear you sell is sold again by the shop you sold it to, for the full price. It isn't sold where it came from anymore, until you buy it back.",
    ] },
    { title: "Backpack and items", text: [
        "Your backpack starts with 2 slots. The merchant sells bigger ones, up to " + Math.max(...backpackUpgrades.map(upgrade => upgrade.slots)) + " slots.",
        "Get gear with a full backpack, and you choose what to drop. Dropped gear is gone (0 coins).",
        "Dropped gear that no shop sells (like gear from events) ends up with the merchant. He sells it back for " + lostGearPercent + "% of its worth.",
        "Trinkets double something for 5 catches. Bottles of resonance give resonance right away. Supplies are for trading and traveling.",
    ] },
    { title: "Traveling", show: save => (save.visited || []).includes("pointDriftt"), text: [
        "There is a ferry system, so you can travel between areas. You need coins as payment.",
        "Every ferry office sells a route chart (" + routeChartPrice + " coins). It draws the route on your map and shows where the ferry is, but only on waters you know."
    ] },
    { title: "The map and your carrier pigeon", text: [
        "The world map only shows the tiles you know. Everything else are clouds.",
        "You only know where you are when you have the map piece of that spot.",
        "With a carrier pigeon, you can send it out to discover new waters (" + birds.discoverFood + " birdfood), or bring a letter to a friend (" + birds.mailFood + " birdfood). It flies in real time, also while you're offline.",
    ] },
];