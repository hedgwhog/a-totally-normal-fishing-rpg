export const characters = {
    researcher: { name: "Professor Sam" },
    sailor: { name: "Old sailor Pete" },
    keeper: { name: "Mr. Moon" },
    merchant: { name: "Monty" },
    trader: { name: "Tucker" },
    fishmonger: { name: "Fishmonger Finn" },
    chef: { name: "Pierre Crumble" },
    fortuneTeller: { name: "Madame Crystal" },
    boatman: { name: "Kaya" },
    mayor: { name: "Mayor Navi" },
    altarKeeper: { name: "Mr/Miss. ?" },
    director: { name: "Dr. Director" },
    ferryClerk: { name: "Ticket Tim" },
    lockerKeeper: { name: "Mr. Bartholomew Lock" },
    stationResearcher: { name: "Dr. Sparky" },
    shopkeeper: { name: "Miss Lovett" },
};

export const lines = {
    // tutorial popup
    intro: {
        title: "A totally normal fishing rpg",
        text: [
            "You were born with a (weird) curse: the only thing you're able to do is fishing.",
            "So to fulfill your dream of exploring the world, you'll have to use your fishing rod for everything.",
            "Today is your first day. You start in Freshwater Haven, a quiet town located at the bay, with an old hat, an old cloak and an old fishing rod.",
            "Everything you learn along the way is written down in the catalogue (at the top of the screen). Lost? Check the catalogue.",
            "Every area also has their own chat, so feel free to be social with others by opening the chat.",
            "Good luck.",
        ],
        lostGear: ["Look what I found! Yours? Not anymore. You can buy it back, of course. At my price."],
    },

    // Fish researcher
    researcher: {
        greeting: {
            morning: [ "Is it morning already? I haven't slept yet. Ah who cares, I have more fish to study!" ],
            afternoon: [ "Hi hi hi! I reorganized my whole desk while you were gone. By smell. Don't ask why." ],
            evening: [ "Finally, it's evening. I'm almost awake now. Coffee number nine, let's go." ],
            night: [ "Oh, you're up too?! Nights are the best for research. Nobody interrupts me. I love it." ],
        },
        questIntro: [ "Could you bring me one of each of these? Pretty please? That would be amazing!" ],
        stillStudying: [ "I'm still studying your fish. Gramps will be here any minute now." ],
        missingFish: [ "Hmm, hmm, hmm... nope! You're missing some." ],
        thanks: [
            ["Oh! You actually brought them.", "I will put them away immediately!", "Here is your reward:"],
            ["You're back! Was I asleep? I don't think I was asleep.", "Here is your reward:"],
            ["You already got all of them? Amazing. Let me take care of them.", "Here is your reward:"],
            ["You brought me a Catfish and a Muskie!? Thank you so much!", "Here is your reward:"],
        ],
        phoneCall: [
            { who: "", text: "Somewhere under a mountain of notes, a phone starts ringing." },
            { who: "researcher", text: "Hellooo? Oh, hi Gramps! You need help someone to help research at Point Driftt?" },
            { who: "researcher", text: "I can't come, I'm busy with these fish I got. But I know someone who can help you..." },
            { who: "", text: "She points at you and without asking you she says:" },
            { who: "researcher", text: "Oh it's fine, I know someone who can go with you!" },
            { who: "researcher", text: "See you in 11 days gramps!"},
            { who: "", text: "She hangs up." },
            { who: "researcher", text: "Gramps will pick you up with his ship, the Ramlaris. It will be at the dock in 11 days. He'll wait until you're ready to leave" },
            { who: "researcher", text: "I already told him you said yes. You were going to say yes, right? Right?!" },
        ],
    },

    // Gramps
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
            "Don't forget to have enough backpack space, you might need it.",
            "No rush, the Ramlaris waits at the dock until you're ready.",
        ],
        hasFish: ["I can smell the fish. You can't board with fish.\n\nSell every last one of them first."],
        shortSupplies: ["You're short on supplies. I need {payment}.\n\nYou've got {have}."],
        askBoard: "Ready to sail? Once we leave, there's no ship back to Freshwater Haven.",
        notYet: ["The Ramlaris isn't going anywhere without you. Take your time."],
        paid: [{ who: "", text: "You hand over the supplies. Old sailor Pete looks satisfied." }],
        arrived: [
            { who: "", text: "After a long trip, the Ramlaris arrives at its destination: Point Driftt." },
            { who: "", text: "It isn't an island. It's a raft. A huge one, built by people, floating above the darkest and deepst place your eyes have ever met." },
            { who: "sailor", text: "That's it for now, off you go. Kaya will show you around. Thanks for your help." },
            { who: "", text: "Pete waves one last time, turns the Ramlaris around and sails on." },
        ],
    },

    // ritual
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
            { who: "", text: "You got the charm, a Charm cloak and a piece of a map!" },
        ],
        lose: [
            { who: "", text: "Your line comes back up. Empty." },
            { who: "keeper", text: "Nobody catches it. That's why it's a ritual. See you in {every} days." },
        ],
    },

    // Merchant
    merchant: {
        arrival: [{ who: "", text: "Monty the merchant has arrived in Freshwater Haven. He is staying until the evening." }],
        welcome: [ "Welcome, welcome my friend! Check out my items and prices!" ],
        noCoinsUpgrade: ["No coins, no upgrade. That one's {price}, friend.", "{price}. Not a coin less."],
        upgraded: ["Your backpack now has {slots} slots. More room to buy more things. From me."],
        noCoinsItem: ["That's {price}. I don't do discounts.", "{price}, my friend. Discounts are for people who don't like money."],
        soldOut: ["Sold out! Come back next time. Bring more coins."],
        nothingToSell: ["I only buy trinkets, bottles and supplies. You have none. Come back when your richer."],
    },

    // marketplace
    trader: {
        greeting: [ "Good day! Have a look around, take your time." ],
        sellOffer: "looks at your {item}\nThis is good work. I can give you {price} for it.\n\nWould that be all right?",
    },

    // fishmonger
    fishmonger: {
        nothingSelected: ["Select the fish you want to sell with + and - first."],
        sellOffer: "checks your fish\n{list}\nI'll give you {price} for those.",
    },

    // chef
    chef: {
        greeting: {
            morning: [ "Morning! We aren't open yet, but we are busy preparing!" ],
            afternoon: [ "Quick, smell this! ...Good, right? Okay, back to work." ],
            evening: [ "Busy, busy, busy! Everyone wants food at the same time." ],
            night: [ "Kitchen's almost closed. Almost. Then I clean this mess." ],
        },
        request: [ "I need a {fish} for tonight's special. Can you catch one before the end of day {day}?" ],
        waiting: [ "That {fish} was perfect! Come back on day {nextDay}, I'll have a new order." ],
        missingFish: ["No {fish}? Bring me one before the end of day {day}.", "No {fish}, no dish. Day {day}, latest."],
        thanks: [ "Beautiful. Look at that colour. Okay, no time, here's your pay and something from the pantry. Thank you!" ],
    },

    // fortune teller
    fortuneTeller: {
        firstMeeting: [ "Ah... I saw you at the ritual. The water told me you would come.", "I can read your fortune. But the spirits don't work for free." ],
        request: ["Bring me {amount} luck trinkets, and I will tell you what the future holds."],
        notEnough: ["{have} luck trinkets? The spirits want {amount}. Come back when you have them."],
        askGive: "Will you give me {amount} luck trinkets?",
        notNow: ["The future can wait. A little."],
        fortune: [
            "She stares into a glass ball for a long time",
            "I see... water. Lots of water. And luck. So much luck!",
            "Your fortune is a lucky one. Here, take this. It was always meant to be yours.",
        ],
        goodbye: ["Our time is over. The spirits have spoken... and so have I. Farewell."],
    },

    // Altar keeper
    altarKeeper: {
        greeting: [
            "...Welcome back.",
            "The altar listens. Choose a rod.",
            "It has been quiet. Good that you came.",
        ],
    },

    // Arrival message
    drifttArrival: [
        { who: "boatman", text: "You're the help Gramps brought? Huh. Thought you'd smell a lot more fishy." },
        { who: "boatman", text: "Welcome to Point Driftt. It's build for research, not for comfort. Mind the gaps between the planks." },
        { who: "", text: "Kaya walks you across the raft, to a building full of antennas and loud machines." },
        { who: "director", text: "Good, you're here. Welcome to the research facility. Let's not waste our time." },
        { who: "director", text: "We study the deep sea. Under this raft is the deepest ocean in the world." },
        { who: "director", text: "Down there live the hadal fish. Rare, and very hard to catch. We need them for our research." },
        { who: "director", text: "This is a deep fishing rod. It reaches ocean waters and hadal waters." },
        { who: "", text: "You got the Deep fishing rod (Ocean & Hadal)!\nEquip it from your backpack." },
        { who: "director", text: "The rod comes with a contract. Sign here, please." },
        { who: "", text: "She slides a contract over the table. Somehow the pen is already in your hand. You don't remember agreeing to anything." },
        { who: "director", text: "Thank you. The terms: you use our rod, you bring us {fish} hadal fish. There is no deadline. You stay on Point Driftt until it's done." },
        { who: "boatman", text: "Here's the catch. Hadal fish don't bite here. You need to go out to the deepest point, one stretch north of the raft. That's where I come in." },
        { who: "boatman", text: "One trip costs {price}. Fuel, supplies, repairs: my boat isn't getting any younger. One trip, one try, then I bring you back." },
        { who: "director", text: "For coins. The ocean around the raft is full of fish. The inconvenience store buys them. When it's open." },
        { who: "director", text: "Storage lockers and a resonance station are available to you as well. The details are in your catalogue. Good luck." },
        { who: "boatman", text: "See you on the water." },
    ],

    // Boatman
    boatman: {
        askTrip: "The deepest point is one stretch north. {price} for the trip: {days} days there, one cast, {days} days back.\n\nShall we go?",
        noCoins: ["{price} for the trip, and not a coin less. Fuel doesn't grow on trees."],
        wrongRod: ["With that rod? It won't even get halfway down. Equip the right rod first."],
        notNow: ["Suit yourself. The sea isn't going anywhere."],
        leaving: [{ who: "", text: "The engine coughs twice, and the little boat heads north." }],
        arrived: [
            { who: "", text: "The water here is pitch black. Your line will have to go down a long, long way." },
            { who: "boatman", text: "This is it. The deepest point in the sea. You got one attempt, so make it count." },
        ],
        caught: ["Well, I didn't expect that. Hold on to that one, we're heading back."],
        missed: ["Just as I thought. Most lines come up empty out here. Let's head back."],
        askReturn: "Head back without casting?\nThe trip is paid, there's no refund.",
        back: [{ who: "", text: "The boat drifts back to Point Driftt." }],
    },

    // Research director.
    director: {
        greeting: [ "Thank you for stopping by. What can you deliver today?" ],
        noHadalFish: ["You don't have any hadal fish yet. The boatman can take you to the deepest point."],
        thanks: ["Received, thank you. {left} more to go.", "Excellent specimen. {left} left on your contract."],
        done: [ 
            "That completes your contract. Thank you for your work.", 
            "As agreed, a bonus: our map of the Hadal Deep. It's on your world map now.",
            "Now that our research has its fish, the Blue Line Cooperation will start sailing between Point Driftt and Freshwater Haven. Their office is on the raft.",
        ],
        afterContract: ["Your contract is complete. Our research is going well, thanks to you.", "No open business between us. You're always welcome, of course."],
        donated: ["Received. Every specimen helps the research. Thank you."],
    },

    // Storage locker
    lockerKeeper: {
        greeting: ["Lockers! Mostly dry and safe.", "One piece of gear per locker. Rules are rules."],
        firstLocker: [
            "Oh, there's already something in this one. Someone left the map of Point Driftt.",
            "Keep it, it's yours now. Better than walking off the edge of the raft.",
            { who: "", text: "You got the map of Point Driftt! Now you know where you are on your world map." },
        ],
        bought: ["It's yours. For good. Don't lose the key. Actually, there is no key. Don't worry about it."],
        allBought: ["You have every locker we've got. Lucky you."],
    },

    // Resonance station
    stationResearcher: {
        greeting: [ "Hello! Every visit helps our research. Really. We keep a chart and everything." ],
        // shown in the popup until rank V is unlocked
        research: "We're so close to rank V. Every rod you resonate with rank IV gives us new data. ({count} / {wanted})",
        upgraded: [
            "We did it! WE DID IT. That was the data we needed.",
            "Rank V is unlocked, starting right now. Thank you so much for helping us!",
        ],
        afterUpgrade: "Rank V is open, and it wouldn't be without you. Thank you for helping us!",
    },

    // Shop keeper
    shopkeeper: {
        greeting: [
            "We're open. Unfortunately.",
            "Don't ask me how my day is. It was fine until you came in.",
        ],
        sellOffer: "barely looks at your {item}\n{price}. Take it or leave it.\n\nWell?",
        fishSellOffer: "sighs and counts your fish\n{list}\n{price}. Don't try to haggle, I'm tired.",
        nothingSelected: ["Pick your fish with + and - first. I'm not doing it for you.\n\nAnd no, I don't buy those weird deep sea things. Never seen one, don't want to."],
    },

    // mayor (about the bird request)
    mayor: {
        welcome: [
            "Ah, a new face in Freshwater Haven! Welcome, welcome. I'm the mayor.",
            "We're a small town, but we work hard and look after each other. The chef at the tavern always needs fish, for example.",
            "Help the tavern {helps} times and donate {donation} coins to the town, and I'll give you something special.",
            "Come see me in the town hall when you're done. I want to hear everything!",
            "Oh, and did you see a sawfish? Saw fish? What kind of fish tho?",
        ],
        greeting: [ "Good to see you! How's the fishing?" ],
        request: [ "Help out the tavern and donate to the town, and the pigeon is yours." ],
        thanks: ["{donation} coins! The town thanks you. The fountain will finally get fixed."],
        gift: [
            "You did it, thank you!",
            "This is for you: a carrier pigeon.",
            "Send it out to find new waters, and it'll draw them on your map. Or let it bring a letter to your friends.",
            "It eats birdfood. Shops usually sell it. Take good care of it!",
        ],
        afterGift: [
            "How is {bird} doing? I hope it's doing well.",
        ],
    },

    // Pigeon
    pigeon: {
        discovered: ["{bird} is back! It found new waters {direction} of {town}: {place}.\nIt's on your map now."],
        delivered: ["{bird} is back! {friend} got your letter."],
        letter: ["A pigeon lands next to you with a letter from {friend}!{gifts}\nRead it in Mail."],
    },
    ferryClerk: {
        notToday: ["The next Blue Line ferry to {place} leaves on day {day}, in {wait} days. A ticket is {price}, and the crossing takes {days} days.\n\nThe {chart} is {chartPrice}, if you want to follow the ferry on your map."],
        askBoard: "The Blue Line ferry to {place} leaves today!\nA ticket is {price}. The crossing takes {days} days.\n\nAll aboard?",
        notNow: ["Suit yourself. The next one is a long wait."],
        noCoins: ["No ticket, no trip. It's {price}."],
        arrived: [{ who: "", text: "After {days} days at sea, the ferry docks at {place}." }],
        chartBought: ["Here's the {chart}. It shows our route on your map, and where the ferry is. As far as you know those waters, at least."],
    },
};