import { connect } from "../core/net.js";
import { showOfferForm, offerText } from "./offerForm.js";

const params = new URLSearchParams(location.search);
const socket = connect("trade", { sessionId: params.get("id") });
const el = id => document.getElementById(id);
let formShown = false;

socket.on("connect_error", error => el("tradeError").textContent = error.message);
socket.on("trade:error", message => el("tradeError").textContent = message);

socket.on("trade:state", trade => {
    el("title").textContent = "Trade with " + trade.other;
    el("theirTitle").textContent = trade.other + " offers";
    el("myOffer").textContent = offerText(trade.myOffer);
    el("theirOffer").textContent = offerText(trade.theirOffer);

    if (!formShown || trade.done || trade.cancelled) {
        showOfferForm(el("myOfferForm"), trade.inventory, trade.myOffer, async offer => {
            const result = await socket.emitWithAck("trade:offer", offer);
            el("tradeError").textContent = result.error || "";
        });
        formShown = true;
    }

    if (trade.done) {
        el("status").textContent = "Trade complete! You can close this window.";
    } else if (trade.cancelled) {
        el("status").textContent = "The trade was cancelled. You can close this window.";
    } else {
        el("status").textContent = (trade.iConfirmed ? "You confirmed. " : "") + (trade.theyConfirmed ? trade.other + " confirmed." : "Waiting for " + trade.other + " to confirm.");
    }
    const finished = trade.done || trade.cancelled;
    el("confirm").disabled = finished || trade.iConfirmed;
    el("cancel").disabled = finished;
    el("myOfferForm").querySelectorAll("input, button").forEach(input => input.disabled = finished);
});

el("confirm").addEventListener("click", async () => {
    const result = await socket.emitWithAck("trade:confirm", {});
    el("tradeError").textContent = result.error || "";
});
el("cancel").addEventListener("click", () => socket.emit("trade:cancel"));
