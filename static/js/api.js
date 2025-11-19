import { CONFIG } from "./config.js";

async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  
  const data = await res.json().catch(() => ({}));
  
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  
  return data;
}

export async function getBalance() {
  return await apiFetch(CONFIG.API.STATUS);
}

export async function getInventory() {
  return await apiFetch(CONFIG.API.INVENTORY);
}

export async function purchaseProduct(slotId) {
  return await apiFetch(CONFIG.API.PURCHASE, {
    method: "POST",
    body: JSON.stringify({ slot_id: slotId }),
  });
}

export async function feedMoney(amount) {
  return await apiFetch(CONFIG.API.FEED, {
    method: "POST",
    body: JSON.stringify({ amount: amount.toFixed(2) }),
  });
}

export async function finishTransaction() {
  return await apiFetch(CONFIG.API.FINISH, {
    method: "POST",
  });
}
