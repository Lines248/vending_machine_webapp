import { CONFIG } from "./config.js";
import * as api from "./api.js";

let balanceEl, messageEl, svg;

const TILE_COLORS = {
  A: { fill: "orange", stroke: "rgba(217, 119, 87, 0.6)" },
  B: { fill: "#a855c7", stroke: "rgba(168, 85, 199, 0.6)" },
  C: { fill: "#92400e", stroke: "rgba(146, 64, 14, 0.6)" },
  D: { fill: "#ec4899", stroke: "rgba(236, 72, 153, 0.6)" },
  default: { fill: "#2a4a5a", stroke: "rgba(42, 74, 90, 0.6)" },
};

const TEXT_CONFIG = {
  maxCharsPerLine: 11,
  maxLines: 2,
  lineHeight: 15,
  padding: 16,
};

const TILE_CONFIG = {
  maxCapacity: 5,
  height: 8,
  gap: 1,
  offsetY: 10,
  padding: 2,
};

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
  
  const coinTypes = [
    { count: quarters, name: "quarter" },
    { count: dimes, name: "dime" },
    { count: nickels, name: "nickel" },
  ];
  
  coinTypes.forEach(({ count, name }) => {
    if (count > 0) {
      parts.push(`${count} ${name}${count === 1 ? "" : "s"}`);
    }
  });
  
  return parts.length > 0 ? parts.join(", ") : "no change";
}

function getTileColors(slotRow) {
  return TILE_COLORS[slotRow] || TILE_COLORS.default;
}

function wrapText(text, maxChars, maxLines) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine === "" ? word : currentLine + " " + word;
    
    if (testLine.length <= maxChars) {
      currentLine = testLine;
    } else {
      if (currentLine !== "") {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = word;
      }
      
      if (lines.length >= maxLines) {
        break;
      }
    }
  }
  
  if (currentLine !== "" && lines.length < maxLines) {
    lines.push(currentLine);
  }
  
  return lines;
}

function createSVGElement(tag, attrs = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });
  return element;
}

function createSlotButton(item, x, y, onSlotClick, cellWidth, cellHeight) {
  const width = cellWidth || CONFIG.UI.CELL_WIDTH;
  const height = cellHeight || CONFIG.UI.CELL_HEIGHT;
  
  const rect = createSVGElement("rect", {
    x,
    y,
    width: width,
    height: height,
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
    if ((e.key === "Enter" || e.key === " ") && !item.sold_out) {
      e.preventDefault();
      onSlotClick(item.slot_id);
    }
  });
  
  return rect;
}

function createInventoryTiles(item, x, y, slotGroup, cellWidth, cellHeight) {
  const count = item.sold_out ? 0 : item.count;
  if (count === 0) return;
  
  const width = cellWidth || CONFIG.UI.CELL_WIDTH;
  const height = cellHeight || CONFIG.UI.CELL_HEIGHT;
  const slotRow = item.slot_id.charAt(0).toUpperCase();
  const colors = getTileColors(slotRow);
  const tileStartY = y + height - TILE_CONFIG.offsetY;
  const tileWidth = width - (TILE_CONFIG.padding * 2);
  const tileX = x + TILE_CONFIG.padding;
  
  for (let i = 0; i < count && i < TILE_CONFIG.maxCapacity; i++) {
    const tile = createSVGElement("rect", {
      x: tileX,
      y: tileStartY - (i * (TILE_CONFIG.height + TILE_CONFIG.gap)),
      width: tileWidth,
      height: TILE_CONFIG.height,
      rx: 1,
      fill: colors.fill,
      stroke: colors.stroke,
      "stroke-width": "0.5",
      opacity: "0.5",
    });
    slotGroup.appendChild(tile);
  }
}

function createSlotText(item, x, y, cellWidth, cellHeight) {
  const isDesktop = window.innerWidth >= 769;
  const width = cellWidth || CONFIG.UI.CELL_WIDTH;
  const height = cellHeight || CONFIG.UI.CELL_HEIGHT;
  const textPadding = isDesktop ? 20 : TEXT_CONFIG.padding;
  const topPadding = isDesktop ? 36 : 30;
  const namePadding = isDesktop ? 61 : 55;
  const pricePadding = isDesktop ? 106 : 100;
  
  const slotIdText = createSVGElement("text", {
    x: x + textPadding,
    y: y + topPadding,
  });
  slotIdText.textContent = item.slot_id;
  svg.appendChild(slotIdText);
  
  const displayName = item.sold_out ? "SOLD OUT" : (item.name || "—");
  const wrappedLines = wrapText(displayName, TEXT_CONFIG.maxCharsPerLine, TEXT_CONFIG.maxLines);
  
  const nameTextGroup = createSVGElement("text", {
    x: x + textPadding,
    y: y + namePadding,
    class: item.sold_out ? "soldout" : "",
  });
  
  wrappedLines.forEach((line, idx) => {
    const tspan = createSVGElement("tspan", {
      x: x + textPadding,
      dy: idx === 0 ? "0" : TEXT_CONFIG.lineHeight.toString(),
    });
    tspan.textContent = line;
    nameTextGroup.appendChild(tspan);
  });
  
  svg.appendChild(nameTextGroup);
  
  const priceText = createSVGElement("text", {
    x: x + textPadding,
    y: y + pricePadding,
    class: "price-text",
  });
  priceText.textContent = item.sold_out ? "$—" : `$${item.price}`;
  svg.appendChild(priceText);
  
  if (!item.sold_out && item.count > 0) {
    const countText = createSVGElement("text", {
      x: x + width - textPadding,
      y: y + height - (isDesktop ? 8 : 6),
      class: "count-text",
    });
    countText.textContent = item.count.toString();
    svg.appendChild(countText);
  }
}

export function renderInventoryGrid(inventory, onSlotClick) {
  if (!svg) return;
  
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }

  const { GRID_COLS, CELL_WIDTH, CELL_HEIGHT, START_X, START_Y, GAP_X, GAP_Y } = CONFIG.UI;
  const isMobile = window.innerWidth <= 768;
  
  const mobileCellWidth = 140;
  const mobileCellHeight = 120;
  const actualCellWidth = isMobile ? mobileCellWidth : CELL_WIDTH;
  const actualCellHeight = isMobile ? mobileCellHeight : CELL_HEIGHT;
  
  let startX = START_X;
  if (isMobile) {
    const totalWidth = GRID_COLS * actualCellWidth + (GRID_COLS - 1) * GAP_X;
    const svgWidth = svg.viewBox.baseVal.width || 750;
    startX = (svgWidth - totalWidth) / 2;
  }

  inventory.forEach((item, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const x = startX + col * (actualCellWidth + GAP_X);
    const y = START_Y + row * (actualCellHeight + GAP_Y);

    const slotGroup = createSVGElement("g", { class: "slot-group" });
    const button = createSlotButton(item, x, y, onSlotClick, actualCellWidth, actualCellHeight);
    slotGroup.appendChild(button);
    
    createInventoryTiles(item, x, y, slotGroup, actualCellWidth, actualCellHeight);
    svg.appendChild(slotGroup);
    createSlotText(item, x, y, actualCellWidth, actualCellHeight);
  });
}

export async function refreshBalance() {
  try {
    const { balance } = await api.getBalance();
    updateBalance(balance);
  } catch (err) {
    console.error("Failed to refresh balance:", err);
  }
}
