import { getState, onState } from "../core/state.js";

export function timesCaught(id) {
    return getState().fishLog[id] || 0;
}

export function isDiscovered(id) {
    return timesCaught(id) > 0;
}

onState((state, previous) => {
    if (previous && JSON.stringify(state.fishLog) !== JSON.stringify(previous.fishLog)) {
        document.dispatchEvent(new Event("fishLogChanged"));
    }
});
