// Ages from a birth date ("YYYY-MM-DD"). Used by the game and the server.
import { legal } from "../data/legal.js";

export function parseBirthDate(text) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text || ""));
    if (!match) return null;
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
    if (year < 1900 || date.getTime() > Date.now()) return null;
    return { year, month, day };
}

export function ageOf(birthDate, now = new Date()) {
    const birth = parseBirthDate(birthDate);
    if (!birth) return null;
    let age = now.getUTCFullYear() - birth.year;
    const hadBirthday = now.getUTCMonth() + 1 > birth.month || (now.getUTCMonth() + 1 === birth.month && now.getUTCDate() >= birth.day);
    if (!hadBirthday) age--;
    return age;
}

export const oldEnoughToPlay = birthDate => (ageOf(birthDate) ?? -1) >= legal.minimumAge;
export const oldEnoughToChat = birthDate => (ageOf(birthDate) ?? -1) >= legal.chatAge;

// the date someone turns the chat age ("YYYY-MM-DD")
export function chatDate(birthDate) {
    const birth = parseBirthDate(birthDate);
    if (!birth) return null;
    return (birth.year + legal.chatAge) + "-" + String(birth.month).padStart(2, "0") + "-" + String(birth.day).padStart(2, "0");
}
