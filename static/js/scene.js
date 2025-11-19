import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { CONFIG } from "./config.js";

let scene, camera, renderer, machine;
let time = 0;
let lastFrameTime = performance.now();
let animationId = null;

export function initScene(container) {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(CONFIG.SCENE.BACKGROUND_COLOR);

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;
  
  camera = new THREE.PerspectiveCamera(
    CONFIG.SCENE.CAMERA_FOV,
    w / h,
    CONFIG.SCENE.CAMERA_NEAR,
    CONFIG.SCENE.CAMERA_FAR
  );
  camera.position.set(
    CONFIG.SCENE.CAMERA_POSITION.x,
    CONFIG.SCENE.CAMERA_POSITION.y,
    CONFIG.SCENE.CAMERA_POSITION.z
  );
  camera.lookAt(0, 0, 0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.sortObjects = false;
  container.appendChild(renderer.domElement);

  setupLights();
  
  createMachine();
  
  scene.add(machine);

  window.addEventListener("resize", handleResize);
  
  animate();
}

function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const glowLight = new THREE.PointLight(0x88ccff, 1.5, 8, 2);
  glowLight.position.set(0, -2.0, 0);
  scene.add(glowLight);
}

function createMachine() {
  machine = new THREE.Group();
  const scale = CONFIG.SCENE.SCALE;

  const body = createBox(2.2 * scale, 4.0 * scale, 1.2 * scale, {
    color: 0x1a2430,
    roughness: 0.4,
    metalness: 0.4,
  });
  machine.add(body);

  const glass = createPlane(1.7 * scale, 2.8 * scale, {
    color: 0x113555,
    roughness: 0.05,
    metalness: 0.2,
    transmission: 0.7,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  glass.position.set(0, 0.3 * scale, 0.61 * scale);
  machine.add(glass);

  const frame = createBox(1.8 * scale, 2.9 * scale, 0.05 * scale, {
    color: 0x2a3440,
    roughness: 0.3,
    metalness: 0.7,
  });
  frame.position.set(0, 0.3 * scale, 0.58 * scale);
  machine.add(frame);

  const panel = createBox(2.0 * scale, 0.4 * scale, 0.15 * scale, {
    color: 0x0f1419,
    roughness: 0.6,
    metalness: 0.2,
  });
  panel.position.set(0, 1.9 * scale, 0.52 * scale);
  machine.add(panel);

  const coinSlot = createBox(0.35 * scale, 0.2 * scale, 0.12 * scale, {
    color: 0x4a5a6a,
    roughness: 0.4,
    metalness: 0.7,
  });
  coinSlot.position.set(-0.6 * scale, 1.75 * scale, 0.58 * scale);
  machine.add(coinSlot);

  const screen = createBox(0.5 * scale, 0.3 * scale, 0.06 * scale, {
    color: 0x001122,
    emissive: 0x002244,
    roughness: 0.8,
  });
  screen.position.set(0.4 * scale, 1.75 * scale, 0.58 * scale);
  machine.add(screen);

  const dispenseArea = createBox(0.6 * scale, 0.35 * scale, 0.22 * scale, {
    color: 0x3a4a5a,
    roughness: 0.3,
    metalness: 0.6,
  });
  dispenseArea.position.set(0, -1.7 * scale, 0.55 * scale);
  machine.add(dispenseArea);

  const base = createBox(2.4 * scale, 0.3 * scale, 1.4 * scale, {
    color: 0x0f1419,
    roughness: 0.5,
    metalness: 0.3,
  });
  base.position.set(0, -2.1 * scale, 0);
  machine.add(base);

  const leftPanel = createBox(0.1 * scale, 4.0 * scale, 1.2 * scale, {
    color: 0x151a20,
    roughness: 0.5,
    metalness: 0.3,
  });
  leftPanel.position.set(-1.15 * scale, 0, 0);
  machine.add(leftPanel);

  const rightPanel = createBox(0.1 * scale, 4.0 * scale, 1.2 * scale, {
    color: 0x151a20,
    roughness: 0.5,
    metalness: 0.3,
  });
  rightPanel.position.set(1.15 * scale, 0, 0);
  machine.add(rightPanel);

  const label = createPlane(0.8 * scale, 0.15 * scale, {
    color: 0x88ccff,
    emissive: 0x224466,
  });
  label.position.set(0, 2.0 * scale, 0.59 * scale);
  machine.add(label);

  createGlowEffects(scale);
}

function createBox(width, height, depth, materialProps) {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshStandardMaterial(materialProps);
  return new THREE.Mesh(geo, mat);
}

function createPlane(width, height, materialProps) {
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = materialProps.transmission
    ? new THREE.MeshPhysicalMaterial(materialProps)
    : new THREE.MeshStandardMaterial(materialProps);
  return new THREE.Mesh(geo, mat);
}

function createGlowEffects(scale) {
  const glowGeo = new THREE.CircleGeometry(1.5 * scale, 32);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide,
  });
  const glowPlane = new THREE.Mesh(glowGeo, glowMat);
  glowPlane.rotation.x = -Math.PI / 2;
  glowPlane.position.set(0, -2.25 * scale, 0);
  scene.add(glowPlane);

  const glowRingGeo = new THREE.RingGeometry(1.2 * scale, 1.5 * scale, 32);
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const glowRing = new THREE.Mesh(glowRingGeo, glowRingMat);
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.set(0, -2.24 * scale, 0);
  scene.add(glowRing);
}

function handleResize() {
  if (!renderer || !camera) return;
  
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function animate() {
  animationId = requestAnimationFrame(animate);

  const currentTime = performance.now();
  const deltaTime = (currentTime - lastFrameTime) / 1000;
  lastFrameTime = currentTime;

  time += deltaTime * CONFIG.SCENE.ANIMATION_SPEED;
  
  if (machine) {
    machine.position.y = Math.sin(time) * CONFIG.SCENE.FLOAT_AMPLITUDE;
  }

  renderer.render(scene, camera);
}

export function disposeScene() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", handleResize);
  
  if (renderer) {
    renderer.dispose();
  }
}
