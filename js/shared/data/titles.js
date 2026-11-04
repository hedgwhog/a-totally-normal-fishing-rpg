// Titles: shown in front of a player's name in the chat, like "[Developer] Hedgwhog".
// You can own several, and wear one (Account button on the start screen).
// staff: true = only admins can give it (in the admin panel). The others are earned in the game (server/titles.js).
// Titles are rare on purpose, and how to earn one isn't told anywhere in the game.
export const titles = {
    developer: { name: "Developer", staff: true },
    moderator: { name: "Moderator", staff: true },
    ostProducer: { name: "OST Producer", staff: false },
    legendaryAngler: { name: "100% Hooked" },
};

export const titleName = id => (titles[id] ? titles[id].name : null);
