// This is the file for CPanel
module.exports = import("./server/server.js")
    .then(module => {
        return module.default || module.app; 
    })
    .catch(error => {
        console.error("The game server could not start:", error);
        process.exit(1);
    });
