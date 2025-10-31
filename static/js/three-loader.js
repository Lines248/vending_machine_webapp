import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "https://unpkg.com/three@0.160.0/examples/jsm/loaders/DRACOLoader.js";

const threeRoot = document.getElementById("three-root");

let scene, camera, renderer, machine;
let billboardBadges = {}; 

function showLoadingOverlay() {
  const overlay = document.createElement("div");
  overlay.id = "loadingOverlay";
  overlay.style = `
    position: absolute; inset:0;
    display:flex; align-items:center;
    justify-content:center;
    background:#0b0f12; color:#53f0e3;
    font-size:24px; font-family:ui-sans-serif;
    z-index:9999;
  `;
  overlay.textContent = "Loading 3D Machine…";
  threeRoot.appendChild(overlay);
  return overlay;
}

function initThreeModel() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f12);

  const w = threeRoot.clientWidth;
  const h = threeRoot.clientHeight;

  camera = new THREE.PerspectiveCamera(60, w/h, 0.1, 100);
  camera.position.set(0, 1.6, 4.5);

  renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
  renderer.setSize(w, h);
  threeRoot.appendChild(renderer.domElement);

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0x88ccff, 1.0);
  dir.position.set(2,4,6);
  scene.add(dir);

  const loader = new GLTFLoader();

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/");
  loader.setDRACOLoader(dracoLoader);

  const loadingOverlay = showLoadingOverlay();

  loader.load(
    "/static/assets/models/vending_machine.glb",
    gltf => {
      machine = gltf.scene;
      machine.scale.set(1.0,1.0,1.0);
      scene.add(machine);

     
      createBadgeSprites();

      threeRoot.removeChild(loadingOverlay);
      animate();
    },
    xhr => {
      const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
      loadingOverlay.textContent = `Loading 3D Machine… ${percent}%`;
    },
    err => {
      console.error("Error loading model:", err);
      loadingOverlay.textContent = "Error loading 3D model.";
    }
  );

  window.addEventListener("resize", onResize);
}

function createBadgeSprites() {
  const loader = new THREE.TextureLoader();
  const spriteMaterial = new THREE.SpriteMaterial({ map: loader.load("/static/assets/textures/badge_bg.png") });
}

function animate() {
  requestAnimationFrame(animate);
  if (machine) machine.rotation.y += 0.0035;
  renderer.render(scene, camera);
}

function onResize() {
  const w = threeRoot.clientWidth;
  const h = threeRoot.clientHeight;
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
  renderer.setSize(w,h);
}

export { initThreeModel, animate };