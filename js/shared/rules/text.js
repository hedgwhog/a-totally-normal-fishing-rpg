const controlCharacters = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const invisibleCharacters = /[\u200B-\u200D\u2060-\u2064\uFEFF\u00AD\u180E]/g;
const directionCharacters = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
const stackedMarks = /(\p{M}{2})\p{M}+/gu;

export function cleanText(input, { newLines = false, maxLines = 1, maxLength = 1000 } = {}) {
    let text = String(input ?? "").normalize("NFC");
    text = text.replace(/\r\n?/g, "\n").replace(/\t/g, " ");
    text = text.replace(controlCharacters, "").replace(invisibleCharacters, "").replace(directionCharacters, "");
    text = text.replace(stackedMarks, "$1");
    if (newLines) {
        text = text.replace(/[ \u00A0]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
        const lines = text.split("\n");
        if (lines.length > maxLines) text = lines.slice(0, maxLines).join("\n") + " " + lines.slice(maxLines).join(" ");
    } else {
        text = text.replace(/\n/g, " ");
    }
    return text.replace(/[ \u00A0]{2,}/g, " ").trim().slice(0, maxLength);
}

export const reservedWords = ["admin", "moderator", "staff", "official", "system", "server", "owner", "developer", "support"];

export function isReservedName(name) {
    const lookalikes = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", "$": "s", "|": "i", "!": "i" };
    const simple = name.toLowerCase().replace(/[013457@$|!]/g, character => lookalikes[character]).normalize("NFD").replace(/[^a-z]/g, "");
    return reservedWords.some(word => simple.includes(word));
}
