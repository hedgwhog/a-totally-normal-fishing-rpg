export function loadSave(key, fallback) {
    try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
        return fallback;
    }
}

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
