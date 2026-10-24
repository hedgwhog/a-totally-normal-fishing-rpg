// SAVING: small helpers to read and write saves in localStorage.
// They never crash on a broken or old save, they just give the fallback back.
//
// Every save has a name (key), like "saveCoin" or "saveFish".
// Never rename an existing key, or players lose that part of their save.
// To see the saves: F12 > Application (Chrome) or Storage (Firefox) > Local Storage.

export function loadSave(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

// for saves that should be an object like { cod: 3 }
export function loadObject(key) {
    const value = loadSave(key, {});
    return (value && typeof value === "object" && !Array.isArray(value)) ? value : {};
}

export function loadList(key) {
    const value = loadSave(key, []);
    return Array.isArray(value) ? value : [];
}

export function loadNumber(key, fallback = 0) {
    const value = parseFloat(localStorage.getItem(key));
    return isNaN(value) ? fallback : value;
}

export function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
