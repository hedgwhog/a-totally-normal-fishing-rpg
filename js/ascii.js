// Loads ASCII art from a .txt file into an element.
// If the file doesn't exist, the element just stays empty.
export async function showArt(element, path) {
    element.textContent = "";
    if (!path) return;
    try {
        const response = await fetch(path);
        if (response.ok) element.textContent = await response.text();
    } catch {
        // couldn't load the file, show no art
    }
}
