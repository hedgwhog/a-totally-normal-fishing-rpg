export const characters = {
    researcher: { name: "Ichthyologist", portrait: "ascii/characters/researcher.txt" },
    sailor: { name: "Old sailor", portrait: "ascii/characters/sailor.txt" },
    keeper: { name: "Ritual keeper", portrait: "ascii/characters/keeper.txt" },
    merchant: { name: "Merchant", portrait: "ascii/characters/merchant.txt" },
    trader: { name: "Trader", portrait: "ascii/characters/trader.txt" },
    fishmonger: { name: "Fishmonger", portrait: "ascii/characters/fishmonger.txt" },
    chef: { name: "Chef", portrait: "ascii/characters/chef.txt" },
    fortuneTeller: { name: "Fortune teller", portrait: "ascii/characters/fortuneTeller.txt" },
    boatman: { name: "Boatman" },
};

export const lines = {
    // Ichthyologist
    researcher: {
        greeting: {
            morning: ["Is it morning already? I haven't slept yet. Again. Who cares, I have fish to study!"],
            afternoon: ["Afternoon? I took a nap at six. In the morning. Or was it yesterday? Anyway, hi!"],
            evening: ["Finally evening. My brain only really wakes up now. Coffee number nine, let's go."],
            night: ["Oh, you're up too?! Nights are the best for research. Nobody interrupts me. I love it."],
        },

        questIntro: ["Could you bring me one of each of these? Pretty please? I need it for science!"],
        stillStudying: ["I'm still studying your fish!"],
        missingFish: [
            "Hmm, hmm, hmm... nope! You're missing some.",
        ],

        thanks: [
            ["OH! You actually brought them.", "Here, take this! And come back soon, I already have a new list."],
            ["You're back! Was I asleep? I don't think I was asleep. Here is your reward:"],
            ["You brought me a Catfish and a Muskie!? Thank you so much! You deserve this reward."],
        ],

        phoneCall: [
            { who: "", text: "Somewhere under a mountain of notes, a phone starts ringing." },
            { who: "researcher", text: "Hellooo? Oh, hi Gramps! ...You need help with your research at Point Driftt?" },
            { who: "researcher", text: "I can't come, I'm busy with these fish! But I know someone who can help you..." },
            { who: "", text: "She points at you. Nobody asked you." },
            { who: "researcher", text: "Great! See you in 11 days! Well, not me, them! Bye!" },
            { who: "", text: "She hangs up." },
            { who: "researcher", text: "Gramps will pick you up with his ship, the Ramlaris. It will be at the dock in 11 days. He'll wait until you're ready." },
        ],
    },

    // Sailor
    sailor: {
        arrival: [
            { who: "", text: "A deep ship horn sounds over Freshwater Haven." },
            { who: "", text: "An old ship is waiting at the dock. Its name is painted on the side: Ramlaris." },
        ],
        
        firstMeeting: [
            "So you're the one she volunteered.",
            "Welcome to the Ramlaris. Oldest ship on these waters, and she still floats. Most of the days.",
            "We're sailing to Point Driftt. The price for the trip: {payment}. We need food and drinks for the crossing.",
            "And no fish on board. They rot, so we can't bring it with us.",
            "No rush, the Ramlaris waits at the dock until you're ready.",
        ],
        hasFish: ["I can smell the fish. You can't board with fish.\n\nSell every last one of them first."],
        // {have} = what you have of the supplies
        shortSupplies: ["You're short on supplies. I need {payment}.\n\nYou've got {have}."],
        askBoard: "Ready to sail? Once we leave, there's no ship back to Freshwater Haven.",
        notYet: ["The Ramlaris isn't going anywhere without you. Take your time."],
        paid: [{ who: "", text: "You hand over the supplies. The old sailor looks satisfied." }],
        arrived: [
            { who: "", text: "After a long trip, the Ramlaris arrives at its destination, Point Driftt." },
            { who: "sailor", text: "That's it for now, off you go. Thanks for your help." },
        ],
    },

    keeper: {
        announcement: [
            { who: "", text: "Bells ring all over Freshwater Haven. Today is the annual ritual!" },
            { who: "", text: "Everyone is heading to the dock, so everything else on the island is closed today." },
        ],
        intro: [
            { who: "", text: "The whole island has gathered at the dock." },
            { who: "keeper", text: "Every {every} days we cast for The charm. Nobody has ever pulled it up. Not once." },
            { who: "keeper", text: "Every fisher gets ONE attempt. No second tries, no excuses." },
        ],
        askAttempt: "Will you take your one attempt?",
        notReady: ["The ritual lasts all day. Come back when you're ready."],
        win: [
            { who: "", text: "The charm, you managed to actually get it." },
            { who: "keeper", text: "After all these years someone finally did it!" },
            { who: "", text: "You got the charm, a Charm cloak and a piece of map!" },
        ],
        lose: [
            { who: "", text: "Your line comes back up. Empty." },
            { who: "keeper", text: "Nobody catches it. That's why it's a ritual. See you in {every} days." },
        ],
    },

    merchant: {
        arrival: [{ who: "", text: "A merchant has arrived in Freshwater Haven. He is staying until the evening." }],
        // at the top of his shop
        welcome: ["Welcome, welcome my friend! Check out my items and prices!"],
        noCoinsUpgrade: ["No coins, no upgrade. That one's {price}, friend."],
        upgraded: ["Your backpack now has {slots} slots!"],
        noCoinsItem: ["That's {price}. I don't do discounts."],
        soldOut: ["Sold out! Come back next time. Bring more coins."],
        nothingToSell: ["I only buy trinkets, bottles and supplies. You have none."],
    },

    trader: {
        // {item} = the gear, {price} = what he pays
        sellOffer: "*looks at your {item}*\nI'll give you {price} for it.\n\nDo you want to sell it?",
    },

    fishmonger: {
        nothingSelected: ["Select the fish you want to sell with + and - first."],
        sellOffer: "*checks your fish*\n{list}\nI'll give you {price} for those.",
    },

    chef: {
        greeting: {
            morning: ["Morning! The kitchen is hot yet. Come back later"],
            afternoon: ["Lunch rush is over. Now we plan the evening menu."],
            evening: ["Busy, busy, busy! Everyone wants food at the same time."],
            night: ["Last orders... Then I clean this mess."],
        },

        request: ["I need a {fish} for tonight's special. Can you catch one before the end of day {day}?"],
        waiting: ["That {fish} was perfect! Come back on day {nextDay}, I'll have a new order."],
        missingFish: ["No {fish}? Then no special. Bring me one before the end of day {day}!"],
        thanks: ["Look at this {fish}! The guests will love it. Here's your pay."],
    },

    fortuneTeller: {
        firstMeeting: [
            "Ah... I saw you at the ritual. The tides told me you would come.",
            "I can read your fortune. But the spirits don't work for free, so neither do I.",
        ],
        request: ["Bring me {amount} luck trinkets, and I will tell you what the future holds."],
        // {have} = how many luck trinkets you have
        notEnough: ["{have} luck trinkets? I want {amount}. Come back when you have them."],
        askGive: "Will you give me {amount} luck trinkets?",
        notNow: ["The future can wait. A little."],
        fortune: [
            "She stares into a glass ball for a long time",
            "I see... water. Lots of water. And luck. So much luck!",
            "Your fortune is a lucky one. Here, take this. It was always meant to be yours.",
        ],
        goodbye: ["Our time is over. Farewell."],
    },

    boatman: {
        askSail: "A small fishing boat is about to leave for Freshwater Haven.\nDo you want to sail back?",
        back: [{ who: "", text: "You're back in Freshwater Haven." }],
    },
};
