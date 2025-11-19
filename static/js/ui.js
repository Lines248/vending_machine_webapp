import { CONFIG } from "./config.js";
import * as api from "./api.js";

let balanceEl, messageEl, svg;

export function initUI(elements) {
  balanceEl = elements.balance;
  messageEl = elements.message;
  svg = elements.svg;
}

export function updateBalance(balance) {
  if (balanceEl) {
    balanceEl.textContent = balance;
  }
}

export function setMessage(msg, isError = false) {
  if (messageEl) {
    messageEl.textContent = msg;
    messageEl.style.color = isError ? "#ff7a7a" : "var(--accent)";
    messageEl.setAttribute("aria-live", "polite");
  }
}

export function formatCoinString(change) {
  const { quarters, dimes, nickels } = change;
  const parts = [];
  
  if (quarters > 0) {
    parts.push(`${quarters} quarter${quarters === 1 ? "" : "s"}`);
  }
  if (dimes > 0) {
    parts.push(`${dimes} dime${dimes === 1 ? "" : "s"}`);
  }
  if (nickels > 0) {
    parts.push(`${nickels} nickel${nickels === 1 ? "" : "s"}`);
  }
  
  return parts.length > 0 ? parts.join(", ") : "no change";
}

export function renderInventoryGrid(inventory, onSlotClick) {
  if (!svg) return;
  
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  const { GRID_COLS, CELL_WIDTH, CELL_HEIGHT, START_X, START_Y, GAP_X, GAP_Y } = CONFIG.UI;

  inventory.forEach((item, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const x = START_X + col * (CELL_WIDTH + GAP_X);
    const y = START_Y + row * (CELL_HEIGHT + GAP_Y);

    const slotGroup = createSVGElement("g", {
      class: "slot-group",
    });
    
    const rect = createSVGElement("rect", {
      x,
      y,
      width: CELL_WIDTH,
      height: CELL_HEIGHT,
      class: "slot-button",
      "data-slot-id": item.slot_id,
      "aria-label": `${item.slot_id}: ${item.sold_out ? "Sold Out" : item.name || "Empty"} - $${item.price}`,
      role: "button",
      tabindex: "0",
    });
    
    if (item.sold_out) {
      rect.setAttribute("opacity", "0.55");
      rect.setAttribute("aria-disabled", "true");
    }
    
    rect.addEventListener("click", () => onSlotClick(item.slot_id));
    rect.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (!item.sold_out) onSlotClick(item.slot_id);
      }
    });
    
    slotGroup.appendChild(rect);
    
    const count = item.sold_out ? 0 : item.count;
    const maxCapacity = 5;
    const tileHeight = 8;
    const tileGap = 1;
    const tileStartY = y + CELL_HEIGHT - 10;
    const tileWidth = CELL_WIDTH - 4;
    const tileX = x + 2;
    
    const slotRow = item.slot_id.charAt(0).toUpperCase();
    let tileColor = "#2a4a5a";
    let tileStroke = "rgba(42, 74, 90, 0.6)";
    
    if (slotRow === "A") {
      tileColor = "orange";
      tileStroke = "rgba(217, 119, 87, 0.6)";
    } else if (slotRow === "B") {
      tileColor = "#a855c7";
      tileStroke = "rgba(168, 85, 199, 0.6)";
    } else if (slotRow === "C") {
      tileColor = "#92400e";
      tileStroke = "rgba(146, 64, 14, 0.6)";
    } else if (slotRow === "D") {
      tileColor = "#ec4899";
      tileStroke = "rgba(236, 72, 153, 0.6)";
    }
    
    for (let i = 0; i < count && i < maxCapacity; i++) {
      const tile = createSVGElement("rect", {
        x: tileX,
        y: tileStartY - (i * (tileHeight + tileGap)),
        width: tileWidth,
        height: tileHeight,
        rx: 1,
        fill: tileColor,
        stroke: tileStroke,
        "stroke-width": "0.5",
        opacity: "0.5",
      });
      slotGroup.appendChild(tile);
    }
    
    svg.appendChild(slotGroup);

    const slotIdText = createSVGElement("text", {
      x: x + 12,
      y: y + 28,
    });
    slotIdText.textContent = item.slot_id;
    svg.appendChild(slotIdText);

    const displayName = item.sold_out ? "SOLD OUT" : (item.name || "—");
    const maxLines = 2;
    const lineHeight = 15;
    const maxCharsPerLine = 11;
    
    function wrapText(text, maxChars) {
      if (!text) return [""];
      const words = text.split(" ");
      const lines = [];
      let currentLine = "";
      
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word.length > maxChars ? word.substring(0, maxChars - 3) + "..." : word;
          } else {
            currentLine = word.length > maxChars ? word.substring(0, maxChars - 3) + "..." : word;
          }
          if (lines.length >= maxLines - 1) break;
        }
      }
      
      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }
      
      return lines.slice(0, maxLines);
    }
    
    const wrappedLines = wrapText(displayName, maxCharsPerLine);
    
    const nameTextGroup = createSVGElement("text", {
      x: x + 12,
      y: y + 50,
      class: item.sold_out ? "soldout" : "",
    });
    
    wrappedLines.forEach((line, idx) => {
      const tspan = createSVGElement("tspan", {
        x: x + 12,
        dy: idx === 0 ? "0" : lineHeight.toString(),
      });
      tspan.textContent = line;
      nameTextGroup.appendChild(tspan);
    });
    
    svg.appendChild(nameTextGroup);

    const priceText = createSVGElement("text", {
      x: x + 12,
      y: y + 88,
      class: "price-text",
    });
    priceText.textContent = item.sold_out ? "$—" : `$${item.price}`;
    svg.appendChild(priceText);

    if (!item.sold_out && count > 0) {
      const countText = createSVGElement("text", {
        x: x + CELL_WIDTH - 8,
        y: y + CELL_HEIGHT - 4,
        class: "count-text",
      });
      countText.textContent = count.toString();
      svg.appendChild(countText);
    }
  });
}

function createSVGElement(tag, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

export async function refreshBalance() {
  try {
    const { balance } = await api.getBalance();
    updateBalance(balance);
  } catch (err) {
    console.error("Failed to refresh balance:", err);
  }
}
