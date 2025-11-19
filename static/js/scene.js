import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { CONFIG } from "./config.js";

let scene, camera, renderer, machine;
let time = 0;
let lastFrameTime = performance.now();
let animationId = null;

const MATERIALS = {
  body: { color: 0x1a2430, roughness: 0.4, metalness: 0.4 },
  glass: { color: 0x113555, roughness: 0.05, metalness: 0.2, transmission: 0.7, thickness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.1 },
  frame: { color: 0x2a3440, roughness: 0.3, metalness: 0.7 },
  panel: { color: 0x0f1419, roughness: 0.6, metalness: 0.2 },
  coinSlot: { color: 0x4a5a6a, roughness: 0.4, metalness: 0.7 },
  screen: { color: 0x001122, emissive: 0x002244, roughness: 0.8 },
  dispenseArea: { color: 0x3a4a5a, roughness: 0.3, metalness: 0.6 },
  base: { color: 0x0f1419, roughness: 0.5, metalness: 0.3 },
  sidePanel: { color: 0x151a20, roughness: 0.5, metalness: 0.3 },
  label: { color: 0x88ccff, emissive: 0x224466 },
};

function createMaterial(props) {
  if (props.transmission) {
    return new THREE.MeshPhysicalMaterial(props);
  }
  return new THREE.MeshStandardMaterial(props);
}

function createBox(width, height, depth, materialProps) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = createMaterial(materialProps);
  return new THREE.Mesh(geometry, material);
}

function createPlane(width, height, materialProps) {
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = createMaterial(materialProps);
  return new THREE.Mesh(geometry, material);
}

function setupLights() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);

  const glowLight = new THREE.PointLight(0x88ccff, 1.5, 8, 2);
  glowLight.position.set(0, -2.0, 0);
  scene.add(glowLight);
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

function createMachine() {
  machine = new THREE.Group();
  const scale = CONFIG.SCENE.SCALE;

  const parts = [
    { type: "box", size: [2.2, 4.0, 1.2], material: MATERIALS.body, pos: [0, 0, 0] },
    { type: "plane", size: [1.7, 2.8], material: MATERIALS.glass, pos: [0, 0.3, 0.61] },
    { type: "box", size: [1.8, 2.9, 0.05], material: MATERIALS.frame, pos: [0, 0.3, 0.58] },
    { type: "box", size: [2.0, 0.4, 0.15], material: MATERIALS.panel, pos: [0, 1.9, 0.52] },
    { type: "box", size: [0.35, 0.2, 0.12], material: MATERIALS.coinSlot, pos: [-0.6, 1.75, 0.58] },
    { type: "box", size: [0.5, 0.3, 0.06], material: MATERIALS.screen, pos: [0.4, 1.75, 0.58] },
    { type: "box", size: [0.6, 0.35, 0.22], material: MATERIALS.dispenseArea, pos: [0, -1.7, 0.55] },
    { type: "box", size: [2.4, 0.3, 1.4], material: MATERIALS.base, pos: [0, -2.1, 0] },
    { type: "box", size: [0.1, 4.0, 1.2], material: MATERIALS.sidePanel, pos: [-1.15, 0, 0] },
    { type: "box", size: [0.1, 4.0, 1.2], material: MATERIALS.sidePanel, pos: [1.15, 0, 0] },
    { type: "plane", size: [0.8, 0.15], material: MATERIALS.label, pos: [0, 2.0, 0.59] },
  ];

  parts.forEach(({ type, size, material, pos }) => {
    const scaledSize = size.map(s => s * scale);
    const scaledPos = pos.map(p => p * scale);
    
    let mesh;
    if (type === "box") {
      mesh = createBox(scaledSize[0], scaledSize[1], scaledSize[2], material);
    } else {
      mesh = createPlane(scaledSize[0], scaledSize[1], material);
    }
    
    mesh.position.set(scaledPos[0], scaledPos[1], scaledPos[2]);
    machine.add(mesh);
  });

  createGlowEffects(scale);
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

export function disposeScene() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", handleResize);
  
  if (renderer) {
    renderer.dispose();
  }
}
