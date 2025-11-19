import { initThreeModel } from "./three-loader.js";
import { initScene } from "./scene.js";
import * as api from "./api.js";
import * as ui from "./ui.js";
import * as accessibility from "./accessibility.js";

const $ = (sel, el = document) => el.querySelector(sel);

const state = {
  initialized: false,
};

function handleError(err, defaultMessage) {
  const message = err.message || defaultMessage;
  ui.setMessage(message, true);
  accessibility.announce(message, "assertive");
}

async function handleFeed(amount) {
  try {
    const res = await api.feedMoney(amount);
    ui.updateBalance(res.balance);
    ui.setMessage(`Added $${amount.toFixed(2)}.`);
    accessibility.speak(`Added ${amount} dollars`);
    accessibility.announce(`Balance updated to ${res.balance}`);
  } catch (err) {
    handleError(err, "Feed failed.");
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
    handleError(err, "Purchase failed.");
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
    handleError(err, "Finish failed.");
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

function wireControls() {
  const feedButtons = [
    { id: "feed-1", amount: 1.0 },
    { id: "feed-5", amount: 5.0 },
  ];
  
  feedButtons.forEach(({ id, amount }) => {
    const btn = $(`#${id}`);
    if (btn) {
      btn.addEventListener("click", () => handleFeed(amount));
    }
  });
  
  const finishBtn = $("#finish");
  if (finishBtn) {
    finishBtn.addEventListener("click", handleFinish);
  }

  document.addEventListener("keydown", (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    
    if (e.key === "1" && !e.ctrlKey && !e.metaKey) {
      handleFeed(1.0);
    } else if (e.key === "5" && !e.ctrlKey && !e.metaKey) {
      handleFeed(5.0);
    } else if (e.key === "f" || e.key === "F") {
      handleFinish();
    }
  });
}

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
    wireControls();

    await refreshInventoryAndUI();

    state.initialized = true;
    ui.setMessage("Ready.");
    accessibility.announce("Vending machine ready");
  } catch (error) {
    console.error("Initialization error:", error);
    ui.setMessage("Failed to initialize application.", true);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
