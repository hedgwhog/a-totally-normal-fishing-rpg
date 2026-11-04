// Everything the legal pages, the moderation messages and the sign-up use. Used by the game and the server.
//
// UPDATING THE TERMS OF SERVICE (players have to accept again):
//   1. Change public/terms.html (and public/privacy.html or public/rules.html if needed),
//      and update the "Version" and "Last updated" lines at the top of the page.
//   2. Raise tosVersion below by 1 (for example 2 -> 3).
//   3. Upload the files, and restart the Node app (the server reads this file when it starts).
// What players then see, automatically:
//   - On the start screen: the "Update your account" panel, with the checkbox to accept. They can't play before that.
//   - Players who were playing during the restart: their game reconnects, the server refuses it,
//     and they're sent to the start screen with a message (js/main.js), where they see the same panel.
//   - New players accept the newest version when they sign up.
// Small fixes (typos, clearer wording) don't need a new version: only change the page.

export const legal = {
    tosVersion: 2,
    developer: "Lucas Bouwmeester", // change this to your full name (also in public/terms.html and public/privacy.html)
    country: "Sweden",
    email: "hedgwhog@gmail.com",
    minimumAge: 13, // younger players can't make an account
    chatAge: 16,    // younger players can't use the chat (text and voice)
};

// The rules of the game. Moderation messages and reports refer to them by number.
// Also shown on public/rules.html (keep both the same).
export const gameRules = [
  {
    number: 1,
    title: "Be respectful",
    text: "Harassment, bullying, insults, threats, and discrimination (that includes racism, sexism, homophobia, and transphobia) will not be tolerated."
  },
  {
    number: 2,
    title: "Be appropriate",
    text: "Keep all content appropriate for all audiences. Sexual messages, names, jokes, and explicit material are strictly forbidden."
  },
  {
    number: 3,
    title: "Respect privacy",
    text: "Don't share personal information and respect each others privacy. Do not share or ask real names, adresses, phone numbers, social media accounts, and photos."
  },
  {
    number: 4,
    title: "No Spam and related",
    text: "Spam, advertising, scams and hyperlinks are strictly forbidden."
  },
  {
    number: 5,
    title: "Play fair",
    text: "Cheating, using bots, and exploiting bugs are strictly forbidden. If you discover a bug please report it immediately."
  },
  {
    number: 6,
    title: "Don't force believes",
    text: "Do not act badly upon players with different believes. (for example, politics and religion)"
  },
  {
    number: 7,
    title: "Authenticity",
    text: "Do not impersonate admins, moderators, and other players in general. Usernames and Displaynames must also comply with all community guidelines."
  },
  {
    number: 8,
    title: "Legal issues",
    text: "Do not share illegal content or encourage activities that are dangerous or unlawfu."
  },
  {
    number: 9,
    title: "Age Restrictions",
    text: "You must be 13 or older to play, and tell the truth about your age. Playing with others (chat, voice, friends, letters, trading and duels), are only for players aged 16 and above."
  },
  {
    number: 10,
    title: "Language Policy",
    text: "To help moderation and to keep the community safe, all text communication, voice chat, letters, and usernames must be in English only."
  },
  {
    number: 11,
    title: "Other reason",
    text: "For if a situation isn't noted down in any of the above, but still needs to be taken action upon."
  }
];


export const ruleText = number => {
    const rule = gameRules.find(item => item.number === Number(number));
    return rule ? "Rule " + rule.number + ": " + rule.title : "Other";
};
