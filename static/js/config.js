export const CONFIG = {
  API: {
    STATUS: "/api/status",
    INVENTORY: "/api/inventory",
    PURCHASE: "/api/purchase",
    FEED: "/api/feed",
    FINISH: "/api/finish",
  },

  SCENE: {
    BACKGROUND_COLOR: 0x0c1117,
    CAMERA_FOV: 60,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 100,
    CAMERA_POSITION: { x: 0, y: 1.5, z: 4.5 },
    SCALE: 0.7,
    ANIMATION_SPEED: 0.5,
    FLOAT_AMPLITUDE: 0.06,
  },

  UI: {
    GRID_COLS: 4,
    CELL_WIDTH: 125,
    CELL_HEIGHT: 105,
    START_X: 50,
    START_Y: 120,
    GAP_X: 18,
    GAP_Y: 16,
  },

  ACCESSIBILITY: {
    DEFAULT_VOLUME: 0.7,
    MIN_VOLUME: 0,
    MAX_VOLUME: 1,
    VOLUME_STEP: 0.1,
  },
};
