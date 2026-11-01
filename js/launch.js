// Runs before the page is drawn (a normal script in the <head>, not a module).
// When the game is opened with "Launch game", hide the start screen right away, so it doesn't flash
// before the title animation is ready. js/screens/titleScreen.js shows it again.
if (location.hash === "#launch") {
    document.documentElement.classList.add("launching");
    setTimeout(() => document.documentElement.classList.remove("launching"), 8000); // just in case
}
