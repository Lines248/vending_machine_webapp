import { initThreeModel } from "./three-loader.js";
import { initScene } from "./scene.js";
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as accessibility from "./accessibility.js";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const state = {
  initialized: false,
};

async function init() {
  try {
    const elements = {
      balance: $("[data-balance]"),
      message: $("#message"),
      svg: $("#ui"),
      threeRoot: $("#three-root"),
      volumeControl: $("#volume-slider"),
      muteButton: $("#mute-btn"),
    };

    initThreeModel();
    initScene(elements.threeRoot);
    ui.initUI(elements);
    accessibility.initAccessibility(elements);

    wireControls(elements);

    await refreshInventoryAndUI();

    state.initialized = true;
    ui.setMessage("Ready.");
    accessibility.announce("Vending machine ready");
  } catch (error) {
    console.error("Initialization error:", error);
    ui.setMessage("Failed to initialize application.", true);
  }
}

function wireControls(elements) {
  $("#feed-1")?.addEventListener("click", () => handleFeed(1.0));
  $("#feed-5")?.addEventListener("click", () => handleFeed(5.0));
  $("#finish")?.addEventListener("click", handleFinish);

  document.addEventListener("keydown", (e) => {
    if (e.key === "1" && !e.ctrlKey && !e.metaKey) {
      handleFeed(1.0);
    } else if (e.key === "5" && !e.ctrlKey && !e.metaKey) {
      handleFeed(5.0);
    } else if (e.key === "f" || e.key === "F") {
      if (document.activeElement.tagName !== "INPUT") {
        handleFinish();
      }
    }
  });
}

async function handleFeed(amount) {
  try {
    const res = await api.feedMoney(amount);
    ui.updateBalance(res.balance);
    ui.setMessage(`Added $${amount.toFixed(2)}.`);
    accessibility.speak(`Added ${amount} dollars`);
    accessibility.announce(`Balance updated to ${res.balance}`);
  } catch (err) {
    ui.setMessage(err.message || "Feed failed.", true);
    accessibility.announce(err.message || "Feed failed", "assertive");
  }
}

async function handleSlotClick(slotId) {
  try {
    const res = await api.purchaseProduct(slotId);

    if (res?.product?.sound) {
      accessibility.speak(res.product.sound);
    }

    await refreshInventoryAndUI();

    const message = `Dispensed ${res.product.name} for $${res.product.price}. Balance: $${res.balance}`;
    ui.setMessage(message);
    accessibility.announce(message);
  } catch (err) {
    ui.setMessage(err.message || "Purchase failed.", true);
    accessibility.announce(err.message || "Purchase failed", "assertive");
  }
}

async function handleFinish() {
  try {
    const res = await api.finishTransaction();
    await ui.refreshBalance();
    
    const coins = ui.formatCoinString(res.change);
    const message = `Returned $${res.change.change_total} in change (${coins}).`;
    ui.setMessage(message);
    accessibility.speak(message);
    accessibility.announce(message);
  } catch (err) {
    ui.setMessage(err.message || "Finish failed.", true);
    accessibility.announce(err.message || "Finish failed", "assertive");
  }
}

async function refreshInventoryAndUI() {
  try {
    const { inventory } = await api.getInventory();
    ui.renderInventoryGrid(inventory, handleSlotClick);
    await ui.refreshBalance();
  } catch (err) {
    console.error("Failed to refresh inventory:", err);
    ui.setMessage("Failed to load inventory.", true);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
