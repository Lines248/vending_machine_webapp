import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

const balanceEl = $("[data-balance]");
const messageEl = $("#message");
const svg = $("#ui");
const threeRoot = $("#three-root");

async function jfetch(url, opts = {}) {
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

let scene, camera, renderer, machine;

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1117);

  const w = threeRoot.clientWidth || threeRoot.offsetWidth || window.innerWidth;
  const h = threeRoot.clientHeight || threeRoot.offsetHeight || window.innerHeight;

  camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
  camera.position.set(0, 1.6, 4.8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  threeRoot.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0x88ccff, 1.1);
  keyLight.position.set(3, 5, 8);
  scene.add(keyLight);

  const bodyGeo = new THREE.BoxGeometry(2.2, 3.6, 1.1);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a2430,
    roughness: 0.5,
    metalness: 0.3,
  });
  machine = new THREE.Mesh(bodyGeo, bodyMat);
  scene.add(machine);

  const glassGeo = new THREE.PlaneGeometry(1.6, 2.6);
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x113555,
    roughness: 0.05,
    metalness: 0.2,
    transmission: 0.6,
    thickness: 0.5,
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.set(0, 0.2, 0.56);
  scene.add(glass);

  window.addEventListener("resize", onResize);
  animate();
}

function onResize() {
  if (!renderer) return;
  const w = threeRoot.clientWidth || window.innerWidth;
  const h = threeRoot.clientHeight || window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  requestAnimationFrame(animate);
  if (machine) machine.rotation.y += 0.0035;
  renderer.render(scene, camera);
}

async function refreshBalance() {
  const { balance } = await jfetch("/api/status");
  balanceEl.textContent = balance;
}

function setMessage(msg, isError = false) {
  messageEl.textContent = msg;
  messageEl.style.color = isError ? "#ff7a7a" : "var(--accent)";
}

function coinString(change) {
  const { quarters, dimes, nickels } = change;
  return `${quarters} quarter${quarters === 1 ? "" : "s"}, ${dimes} dime${dimes === 1 ? "" : "s"}, ${nickels} nickel${nickels === 1 ? "" : "s"}`;
}

function renderSvgGrid(inventory) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const cols = 4;
  const cellW = 120, cellH = 100;
  const startX = 60, startY = 120;
  const gapX = 20, gapY = 18;

  inventory.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cellW + gapX);
    const y = startY + row * (cellH + gapY);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", cellW);
    rect.setAttribute("height", cellH);
    rect.setAttribute("class", "slot-button");
    rect.dataset.slotId = item.slot_id;
    rect.addEventListener("click", onSlotClick);
    if (item.sold_out) rect.setAttribute("opacity", "0.55");
    svg.appendChild(rect);

    const t1 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t1.setAttribute("x", x + 12);
    t1.setAttribute("y", y + 28);
    t1.textContent = item.slot_id;
    svg.appendChild(t1);

    const t2 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t2.setAttribute("x", x + 12);
    t2.setAttribute("y", y + 54);
    t2.textContent = item.sold_out ? "SOLD OUT" : (item.name || "—");
    if (item.sold_out) t2.setAttribute("class", "soldout");
    svg.appendChild(t2);

    const t3 = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t3.setAttribute("x", x + 12);
    t3.setAttribute("y", y + 78);
    const count = item.sold_out ? 0 : item.count;
    t3.textContent = item.sold_out ? "$— · 0" : `$${item.price} · ${count}`;
    svg.appendChild(t3);
  });
}

async function refreshInventoryAndUI() {
  const { inventory } = await jfetch("/api/inventory");
  renderSvgGrid(inventory);
  await refreshBalance();
  setMessage("Ready.");
}

async function onSlotClick(e) {
  const slotId = e.currentTarget.dataset.slotId;
  try {
    const res = await jfetch("/api/purchase", {
      method: "POST",
      body: JSON.stringify({ slot_id: slotId }),
    });

    if (res?.product?.sound) {
      const utter = new SpeechSynthesisUtterance(res.product.sound);
      utter.rate = 1.05;
      speechSynthesis.speak(utter);
    }

    await refreshInventoryAndUI();
    setMessage(`Dispensed ${res.product.name} for $${res.product.price}. Balance: $${res.balance}`);
  } catch (err) {
    setMessage(err.message || "Purchase failed.", true);
  }
}

async function feed(amount) {
  try {
    const res = await jfetch("/api/feed", {
      method: "POST",
      body: JSON.stringify({ amount: amount.toFixed(2) }),
    });
    balanceEl.textContent = res.balance;
    setMessage(`Added $${amount.toFixed(2)}.`);
  } catch (err) {
    setMessage(err.message || "Feed failed.", true);
  }
}

async function finish() {
  try {
    const res = await jfetch("/api/finish", { method: "POST" });
    await refreshBalance();
    const coins = coinString(res.change);
    setMessage(`Returned $${res.change.change_total} in change (${coins}).`);
  } catch (err) {
    setMessage(err.message || "Finish failed.", true);
  }
}

function wireControls() {
  $("#feed-1").addEventListener("click", () => feed(1.0));
  $("#feed-5").addEventListener("click", () => feed(5.0));
  $("#finish").addEventListener("click", finish);
}

(async function boot() {
  initThree();
  wireControls();
  await refreshInventoryAndUI();
})();