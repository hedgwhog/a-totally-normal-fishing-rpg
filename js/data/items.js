// category: where it shows up in the items list and the marketplace
// "Trinkets" can be used, they double something for a few catches
// "Bottles" can be used, they give you something right away
// "Supplies" are only for trading
//  Special" are rare items with no use (yet)

// boost/catches: (trinkets) what it doubles, and for how many catches.
//   The boosts the game knows: "luck" (actions.js), "resonance" (actions.js), "focus" and "slow-fish" (fishing.js)
// effect: what players see it does (in the merchant and your items list)
// info: what the info button (i) in your items list says
// resonance: (bottles) how much resonance you get when you use it
// fishChance: % chance to fish it up with a catch
// price: what it costs to buy
export const items = [
    { id: "luckCharm", name: "Luck trinket", category: "Trinkets", boost: "luck", catches: 5, fishChance: 2, price: 35, effect: "rare fish 2x as often",
      info: "Use it, and rare fish show up 2x as often for your next 5 catches." },
    { id: "resonanceCharm", name: "Resonance trinket", category: "Trinkets", boost: "resonance", catches: 5, fishChance: 2, price: 35, effect: "2x resonance per fish",
      info: "Use it, and you get 2x the resonance for your next 5 catches." },
    { id: "focusCharm", name: "Focus trinket", category: "Trinkets", boost: "focus", catches: 5, fishChance: 2, price: 35, effect: "2x focus (at least +5)",
      info: "Use it, and your focus is 2x as strong for your next 5 catches. Your line moves slower. (at least +5) " },
    { id: "slowCharm", name: "Slow trinket", category: "Trinkets", boost: "slow-fish", catches: 5, fishChance: 2, price: 35, effect: "fish move 2x slower",
      info: "Use it, and the fish move 2x slower for your next 5 catches." },

    { id: "resonanceBottle", name: "Bottle of resonance", category: "Bottles", resonance: 10, price: 15,
      info: "Use it, and you get 10 resonance right away." },

    { id: "fishCan", name: "Cans of processed fish", category: "Supplies", price: 4,
      info: "Food for long trips. Sailors want these, and you can trade them with other players." },
    { id: "waterBottle", name: "Bottles of fresh water", category: "Supplies", price: 1,
      info: "Water for long trips. Sailors want these, and you can trade them with other players." },
    { id: "beer", name: "Beer", category: "Supplies", price: 3.5,
      info: "For a sailor who needs a drink. You can also trade it with other players." },
    { id: "birdFood", name: "Birdfood", category: "Supplies", price: 3, effect: "for your carrier pigeon",
      info: "Your carrier pigeon eats this before every flight. They need it to explore new waters or to bring a letter to a friend." },

    { id: "theCharm", name: "The charm", category: "Special",
      info: "Caught at the annual ritual." },
];

export const itemCategories = ["Trinkets", "Bottles", "Supplies", "Special", "Fossils"];

export function findItem(id) {
    return items.find(item => item.id === id);
}
