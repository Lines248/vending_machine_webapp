import { CONFIG } from "./config.js";

let currentVolume = CONFIG.ACCESSIBILITY.DEFAULT_VOLUME;
let isMuted = false;
let volumeControlEl = null;
let muteButtonEl = null;

export function initAccessibility(elements) {
  volumeControlEl = elements.volumeControl;
  muteButtonEl = elements.muteButton;

  if (volumeControlEl) {
    volumeControlEl.value = currentVolume * 100;
    volumeControlEl.addEventListener("input", handleVolumeChange);
    volumeControlEl.setAttribute("aria-label", "Volume control");
    volumeControlEl.setAttribute("aria-valuemin", "0");
    volumeControlEl.setAttribute("aria-valuemax", "100");
    volumeControlEl.setAttribute("aria-valuenow", currentVolume * 100);
  }

  if (muteButtonEl) {
    muteButtonEl.addEventListener("click", toggleMute);
    muteButtonEl.setAttribute("aria-label", "Mute sound");
    updateMuteButton();
  }

  setupKeyboardNavigation();
}

function handleVolumeChange(e) {
  currentVolume = parseFloat(e.target.value) / 100;
  
  if (volumeControlEl) {
    volumeControlEl.setAttribute("aria-valuenow", e.target.value);
  }
  
  if (!isMuted) {
    updateSpeechVolume();
  }
}

function toggleMute() {
  isMuted = !isMuted;
  updateMuteButton();
  updateSpeechVolume();
}

function updateMuteButton() {
  if (!muteButtonEl) return;
  
  muteButtonEl.setAttribute("aria-pressed", isMuted.toString());
  muteButtonEl.setAttribute("aria-label", isMuted ? "Unmute sound" : "Mute sound");
  
  muteButtonEl.textContent = isMuted ? "Unmute" : "Mute";
  muteButtonEl.classList.toggle("muted", isMuted);
}

function updateSpeechVolume() {
}

export function getVolume() {
  return isMuted ? 0 : currentVolume;
}

export function speak(text) {
  if (!text || isMuted) return;
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = currentVolume;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);
    };
    
    window.speechSynthesis.speak(utterance);
  }
}

function setupKeyboardNavigation() {
  document.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") {
      if (document.activeElement.tagName !== "INPUT") {
        e.preventDefault();
        toggleMute();
      }
    }
    
    if (document.activeElement.tagName !== "INPUT") {
      if (e.key === "ArrowUp" && e.ctrlKey) {
        e.preventDefault();
        adjustVolume(0.1);
      } else if (e.key === "ArrowDown" && e.ctrlKey) {
        e.preventDefault();
        adjustVolume(-0.1);
      }
    }
  });
}

function adjustVolume(delta) {
  currentVolume = Math.max(
    CONFIG.ACCESSIBILITY.MIN_VOLUME,
    Math.min(CONFIG.ACCESSIBILITY.MAX_VOLUME, currentVolume + delta)
  );
  
  if (volumeControlEl) {
    volumeControlEl.value = currentVolume * 100;
    volumeControlEl.setAttribute("aria-valuenow", currentVolume * 100);
  }
  
  if (!isMuted) {
    updateSpeechVolume();
  }
}

export function announce(message, priority = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
