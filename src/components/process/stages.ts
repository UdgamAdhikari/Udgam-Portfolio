// The Process Machine: one small product (a dashboard panel on a base plate)
// and the five poses it moves through. Pure data — the scene damps every
// piece, the camera and the overlays toward whichever stage is active, so a
// new stage can interrupt an old one mid-flight and simply retarget.

export type Vec3 = [number, number, number];
export type PieceId = "header" | "sidebar" | "cardA" | "cardB" | "list" | "button";

export interface PieceSpec {
  id: PieceId;
  size: Vec3;
  /** Resting place in the shipped product (plate top is y = 0). */
  home: Vec3;
  tone: "clay" | "ink" | "signal";
}

export const PLATE: Vec3 = [6.2, 0.22, 4.2];

export const PIECES: PieceSpec[] = [
  { id: "header", size: [5.6, 0.16, 0.55], home: [0, 0.08, -1.6], tone: "ink" },
  { id: "sidebar", size: [1.3, 0.16, 2.6], home: [-2.15, 0.08, 0.4], tone: "clay" },
  { id: "cardA", size: [1.8, 0.16, 1.15], home: [-0.35, 0.08, -0.55], tone: "clay" },
  { id: "cardB", size: [1.8, 0.16, 1.15], home: [1.65, 0.08, -0.55], tone: "clay" },
  { id: "list", size: [3.8, 0.16, 0.95], home: [0.65, 0.08, 0.75], tone: "clay" },
  { id: "button", size: [1.1, 0.2, 0.42], home: [1.9, 0.1, 1.6], tone: "signal" },
];

interface Pose {
  /** Offset from `home`. */
  offset: Vec3;
  rotation: Vec3;
}

export interface StageConfig {
  pieces: Record<PieceId, Pose>;
  camera: Vec3;
  /** Yaw of the whole assembly. */
  yaw: number;
  /** 0–1 strengths of the stage-specific overlays. */
  annotations: number;
  connectors: number;
  guides: number;
  ship: number;
}

const still = (offset: Vec3 = [0, 0, 0], rotation: Vec3 = [0, 0, 0]): Pose => ({ offset, rotation });

export const STAGES: StageConfig[] = [
  // 01 Understand — layers lifted off the plate in tiers, exposing the structure;
  // thin stems tie each piece to where it will land (the requirements).
  {
    pieces: {
      header: still([0, 2.5, 0]),
      sidebar: still([0, 1.1, 0]),
      cardA: still([0, 1.8, 0]),
      cardB: still([0, 1.8, 0]),
      list: still([0, 1.1, 0]),
      button: still([0, 2.5, 0]),
    },
    camera: [6.4, 6.2, 7.4],
    yaw: -0.35,
    annotations: 1,
    connectors: 0,
    guides: 0,
    ship: 0,
  },
  // 02 Break down — an exploded view: each module pulled out along its own axis.
  {
    pieces: {
      header: still([0, 1.6, -1.6], [0.35, 0, 0]),
      sidebar: still([-1.9, 1.1, 0], [0, 0, 0.35]),
      cardA: still([-0.6, 2.3, -0.3], [0.12, 0.35, 0]),
      cardB: still([1.2, 2.0, -0.9], [0, -0.45, 0.12]),
      list: still([0, 1.0, 1.9], [-0.3, 0, 0]),
      button: still([1.7, 1.6, 1.3], [0, 0.7, 0]),
    },
    camera: [8, 7.2, 9.2],
    yaw: -0.5,
    annotations: 0,
    connectors: 0,
    guides: 0,
    ship: 0,
  },
  // 03 Build — modules line up on the grid, hovering just above their sockets,
  // which light up where they connect.
  {
    pieces: {
      header: still([0, 0.55, 0]),
      sidebar: still([0, 0.55, 0]),
      cardA: still([0, 0.55, 0]),
      cardB: still([0, 0.55, 0]),
      list: still([0, 0.55, 0]),
      button: still([0, 0.55, 0]),
    },
    camera: [6, 7, 6.8],
    yaw: -0.3,
    annotations: 0,
    connectors: 1,
    guides: 0,
    ship: 0,
  },
  // 04 Refine — everything settles into place, with the small corrections that
  // make it exact; measurement guides appear. Seen almost from above.
  {
    pieces: {
      header: still(),
      sidebar: still(),
      cardA: still(),
      cardB: still(),
      list: still(),
      button: still(),
    },
    camera: [0.6, 9.6, 5.6],
    yaw: 0,
    annotations: 0,
    connectors: 0.35,
    guides: 1,
    ship: 0,
  },
  // 05 Ship — locked together as one product, edged in the accent colour.
  {
    pieces: {
      header: still(),
      sidebar: still(),
      cardA: still(),
      cardB: still(),
      list: still(),
      button: still(),
    },
    camera: [6.2, 6.4, 8.6],
    yaw: -0.25,
    annotations: 0,
    connectors: 0,
    guides: 0,
    ship: 1,
  },
];
