// category: where it shows up in the items list and the marketplace
// "Trinkets" can be used, they double something for a few tries (a fish that gets away counts too)
// "Bottles" can be used, they give you something right away
// "Supplies" are only for trading
//  Special" are rare items with no use (yet)

// boost/tries: (trinkets) what it doubles, and for how many tries to catch a fish (caught or not).
//   The boosts the game knows: "luck" (actions.js), "resonance" (actions.js), "focus" and "slow-fish" (fishing.js)
// effect: what players see it does (in the merchant and your items list)
// info: what the info button (i) in your items list says
// resonance: (bottles) how much resonance you get when you use it
// fishChance: % chance to fish it up with a catch
// price: what it costs to buy
export const items = [
    { id: "luckCharm", name: "Luck trinket", category: "Trinkets", boost: "luck", tries: 5, fishChance: 0.75, price: 60, effect: "rare fish 2x as often",
      info: "Use it, and rare fish show up 2x as often for your next 5 tries." },
    { id: "resonanceCharm", name: "Resonance trinket", category: "Trinkets", boost: "resonance", tries: 5, fishChance: 0.75, price: 60, effect: "2x resonance per fish",
      info: "Use it, and you get 2x the resonance for your next 5 tries." },
    { id: "focusCharm", name: "Focus trinket", category: "Trinkets", boost: "focus", tries: 5, fishChance: 0.75, price: 60, effect: "2x focus (at least +5)",
      info: "Use it, and your focus is 2x as strong for your next 5 tries. Your line moves slower. (at least +5) " },
    { id: "slowCharm", name: "Slow trinket", category: "Trinkets", boost: "slow-fish", tries: 5, fishChance: 0.75, price: 60, effect: "fish move 2x slower",
      info: "Use it, and the fish move 2x slower for your next 5 tries." },

    { id: "resonanceBottle", name: "Bottle of resonance", category: "Bottles", resonance: 10, price: 15,
      info: "Use it, and you get 10 resonance right away." },

    { id: "fishCan", name: "Cans of processed fish", category: "Supplies", price: 4,
      info: "Food for long trips. Sailors want these, and you can trade them with other players." },
    { id: "waterBottle", name: "Bottles of fresh water", category: "Supplies", price: 1,
      info: "Water for long trips. Sailors want these, and you can trade them with other players." },
    { id: "beer", name: "Pint of beer", category: "Supplies", price: 3.5,
      info: "For a sailor who needs a drink. You can also trade it with other players." },
    { id: "birdFood", name: "Birdfood", category: "Supplies", price: 3, effect: "for your carrier pigeon",
      info: "Your carrier pigeon eats this before every flight. They need it to explore new waters or to bring a letter to a friend." },

    { id: "theCharm", name: "The charm", category: "Special",
      info: "Caught at the annual ritual." },

    // The District Isles
    // Tableland: wheat & bread
    { id: "udonFlour", name: "Bag of udon flour", category: "Ingredients", island: "tableland", price: 7, info: "From the Tablelands." },
    { id: "ryeFlour", name: "Bag of rye flour", category: "Ingredients", island: "tableland", price: 6, info: "From the Tablelands." },
    { id: "sourdough", name: "Jar of sourdough starter", category: "Ingredients", island: "tableland", price: 14, info: "From the Tablelands." },
    { id: "panko", name: "Bag of panko", category: "Ingredients", island: "tableland", price: 5, info: "From the Tablelands." },
    // Heathland: tea & flora
    { id: "matcha", name: "Tin of matcha powder", category: "Ingredients", island: "heathland", price: 12, info: "From the Heathlands." },
    { id: "jasmine", name: "Bundle of jasmine blossoms", category: "Ingredients", island: "heathland", price: 8, info: "From the Heathlands." },
    { id: "heatherHoney", name: "Jar of heather honey", category: "Ingredients", island: "heathland", price: 10, info: "From the Heathlands." },
    { id: "elderflowerSyrup", name: "Bottle of elderflower syrup", category: "Ingredients", island: "heathland", price: 7, info: "From the Heathlands." },
    // Mangal: nuts, berries & seeds
    { id: "bananas", name: "Bunch of bananas", category: "Ingredients", island: "mangal", price: 5, info: "From the Mangal." },
    { id: "cashews", name: "Bag of cashews", category: "Ingredients", island: "mangal", price: 9, info: "From the Mangal." },
    { id: "acaiBerries", name: "Pack of açaí berries", category: "Ingredients", island: "mangal", price: 11, info: "From the Mangal." },
    { id: "blackSesame", name: "Pouch of black sesame", category: "Ingredients", island: "mangal", price: 6, info: "From the Mangal." },

    // Delicacies: dishes from the restaurants in the Capital, after you finished their quest.
    { id: "bananaBread", name: "Banana bread", category: "Delicacies", price: 40, info: "Banana bread" },
    { id: "matchaBoba", name: "Matcha boba tea", category: "Delicacies", price: 40, info: "Matcha boba tea" },
    { id: "acaiBowl", name: "Açaí bowl", category: "Delicacies", price: 45, info: "Açaí bowl" },
    { id: "neonUdon", name: "Neon udon soup", category: "Delicacies", price: 60, info: "Neon udon soup" },
    { id: "sesameBao", name: "Black sesame bao", category: "Delicacies", price: 50, info: "Black sesame bao" },
    { id: "tastingMenu", name: "Twelve-course tasting menu", category: "Delicacies", price: 120, info: "Twelve-course tasting menu" },
    { id: "jasmineRamen", name: "Jasmine ramen", category: "Delicacies", price: 55, info: "Jasmine ramen" },
    { id: "matchaCronut", name: "Matcha cronut", category: "Delicacies", price: 45, info: "Matcha cronut" },
    { id: "cashewDumplings", name: "Cashew dumplings", category: "Delicacies", price: 50, info: "Cashew dumplings" },
    { id: "mochiIceCream", name: "Sesame mochi ice cream", category: "Delicacies", price: 45, info: "Sesame mochi ice cream" },
    { id: "tofuKatsu", name: "Panko tofu katsu", category: "Delicacies", price: 50, info: "Panko tofu katsu" },
    { id: "synthSushi", name: "Synth-sushi roll", category: "Delicacies", price: 65, info: "Synth-sushi roll" },
];

export const itemCategories = ["Trinkets", "Bottles", "Supplies", "Ingredients", "Delicacies", "Special", "Fossils"];

export function findItem(id) {
    return items.find(item => item.id === id);
}