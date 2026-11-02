import { altar } from "../quests.js";

export const pantryIslands = ["heathland", "tableland", "mangal"]; // the islands with fish, a market and a station

export const mayorRewards = [
    { id: "trinkets", label: "4 trinkets (one of each)", items: { luckCharm: 1, resonanceCharm: 1, focusCharm: 1, slowCharm: 1 } },
    { id: "bottles", label: "5 bottles of resonance", items: { resonanceBottle: 5 } },
    { id: "birdFood", label: "15 birdfood", items: { birdFood: 15 } },
];

export const trains = {
    trackerPrice: 40,
    fromCapital: "morning", arriveIsland: "afternoon",
    fromIsland: "evening", arriveCapital: "night",
    lines: [
        { id: "heathlandLine", name: "Heathland line", island: "heathland" },
        { id: "tablelandLine", name: "Tableland line", island: "tableland" },
        { id: "mangalLine", name: "Mangal line", island: "mangal" },
    ],
};

export const markets = {
    heathland: { keeper: "heathMarket", gear: ["rodPeat", "rodMoorland", "heatherHat"], ingredients: ["matcha", "jasmine", "heatherHoney", "elderflowerSyrup"] },
    tableland: { keeper: "tableMarket", gear: ["rodRidge", "rodMesa", "strawHat"], ingredients: ["udonFlour", "ryeFlour", "sourdough", "panko"] },
    mangal: { keeper: "mangalMarket", gear: ["rodRoot", "rodDelta", "leafHat"], ingredients: ["bananas", "cashews", "acaiBerries", "blackSesame"] },
};
export const marketDays = { open: 5, closed: 1 };

export const islandQuests = {
    heathland: { giver: "heathWarden", fish: "europeanEel", tile: "heathland_1_0" },
    tableland: { giver: "miller", fish: "huchen", tile: "tableland_1_0" },
    mangal: { giver: "ranger", fish: "tarpon", tile: "mangal_1_0" },
};

// id:          unique, it's in the save (don't change it once players have it)
// name, owner: what players see
// greeting:    what the owner says when you come in
// open:        the times it's open: "morning", "afternoon", "evening", "night"
// closed:      (optional) day => true on days it's closed. Example: closed: day => day % 7 === 0 (closed every 7th day)
// ingredients: { itemId: amount } it wants. Item ids are in data/items.js (category "Ingredients")
// reward:      { coins, tile } tile (optional) = the id of a map tile from data/world.js (source: "restaurant")
// dish:        the delicacy you can buy after the quest (item id from data/items.js, category "Delicacies")
export const restaurants = [
    { id: "goldenCrust", name: "Banana Bread", owner: "Baker Luna", open: ["morning", "afternoon"],
      greeting: "Smell that? Fresh out of the oven.",
      ingredients: { ryeFlour: 8, sourdough: 2, bananas: 10 }, reward: { coins: 150, tile: "tableland_0_0" }, dish: "bananaBread" },

    { id: "steamAndLeaf", name: "Matcha boba tea", owner: "Madame Mia", open: ["afternoon", "evening"],
      greeting: "Sit, sit. A good cup of tea takes patience.",
      ingredients: { matcha: 4, heatherHoney: 4, jasmine: 6 }, reward: { coins: 150, tile: "heathland_0_1" }, dish: "matchaBoba" },

    { id: "nutcracker", name: "Açaí bowl", owner: "Chef Mason", open: ["evening", "night"],
      greeting: "Welcome to the best bar in the Capital!",
      ingredients: { acaiBerries: 5, cashews: 6, blackSesame: 8 }, reward: { coins: 150, tile: "mangal_1_1" }, dish: "acaiBowl" },

    { id: "neonPlate", name: "Neon udon soup", owner: "Chef Luca", open: ["evening", "night"], closed: day => day % 4 === 0,
      greeting: "The broth is starting to look good.",
      ingredients: { udonFlour: 10, jasmine: 4, blackSesame: 6 }, reward: { coins: 250 }, dish: "neonUdon" },

    { id: "byteAndBun", name: "Black sesame boa", owner: "Nox", open: ["morning", "evening"],
      greeting: "Welcome costumer.",
      ingredients: { panko: 6, heatherHoney: 3, blackSesame: 10 }, reward: { coins: 250 }, dish: "sesameBao" },

    { id: "grandTable", name: "The Grand Table", owner: "Maître", open: ["night"], closed: day => day % 7 === 0,
      greeting: "You interested in a course?",
      ingredients: { sourdough: 3, matcha: 4, elderflowerSyrup: 4, cashews: 8, acaiBerries: 4 }, reward: { coins: 500 }, dish: "tastingMenu" },

    { id: "nekoNoodleLab", name: "Jasmine ramen", owner: "Chef Miso", open: ["night"],
      greeting: "We have soom good noodles, please come try!",
      ingredients: { udonFlour: 8, jasmine: 6, cashews: 5 }, reward: { coins: 200, tile: "tableland_2_1" }, dish: "jasmineRamen" },

    { id: "glazeAndCircuit", name: "Matcha Cronut", owner: "Donna", open: ["morning"], closed: day => day % 5 === 0,
      greeting: "Matcha!",
      ingredients: { ryeFlour: 6, matcha: 5, heatherHoney: 3 }, reward: { coins: 200 }, dish: "matchaCronut" },

    { id: "dumplingDistrict", name: "Cashew dumplings", owner: "Miss Ivy", open: ["afternoon", "evening"],
      greeting: "Come eat first, we can talk later.",
      ingredients: { udonFlour: 6, cashews: 8, elderflowerSyrup: 3 }, reward: { coins: 250 }, dish: "cashewDumplings" },

    { id: "mochiMainframe", name: "Sesame mochi ice cream", owner: "Zayn", open: ["afternoon", "night"],
      greeting: "Hello, welcome. Get some ice cream!",
      ingredients: { blackSesame: 8, heatherHoney: 4, acaiBerries: 4 }, reward: { coins: 250 }, dish: "mochiIceCream" },

    { id: "katsuKiosk", name: "Panko tofu katsu", owner: "Zuri", open: ["morning", "afternoon", "evening", "night"], closed: day => day % 3 === 0,
      greeting: "Open day until night. ",
      ingredients: { panko: 10, cashews: 6, blackSesame: 6 }, reward: { coins: 200, tile: "mangal_0_1" }, dish: "tofuKatsu" },

    { id: "synthSushi", name: "Synth Sushi Bar", owner: "Skylar", open: ["evening", "night"],
      greeting: "Greetings!",
      ingredients: { blackSesame: 6, elderflowerSyrup: 4, panko: 8 }, reward: { coins: 300 }, dish: "synthSushi" },
];

// Old ingredient & dish ids (before they were renamed), so saves keep what they had (server/game.js uses this)
export const renamedItems = {
    wheat: "udonFlour", rye: "ryeFlour", teaLeaves: "matcha", wildHerbs: "elderflowerSyrup",
    mangroveNuts: "cashews", wildBerries: "acaiBerries", seeds: "blackSesame",
    goldenLoaf: "bananaBread", moorlandBrew: "matchaBoba", nutcrackerBowl: "acaiBowl",
    neonPlatter: "neonUdon", byteBun: "sesameBao", grandFeast: "tastingMenu",
};

// The shop: sells supplies (same price as the marketplace) and bottles (more expensive), buys only delicacies.
export const capitalShop = {
    open: ["afternoon", "evening"],
    supplies: ["birdFood", "waterBottle", "fishCan"],
    bottles: ["resonanceBottle"],
    bottleMultiplier: 2,
    delicacyPercent: 60, // what it pays for a delicacy, % of its price
};

// The resonance library: always open, only rank I and II.
export const library = {
    levels: altar.levels.slice(0, 2),
    dissonanceCost: altar.dissonanceCost,
};