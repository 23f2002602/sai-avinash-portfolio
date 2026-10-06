export type CharacterPose = "wave" | "hold" | "open" | "sip" | "enjoy" | "grind" | "coffee";

/** Switch to the inspected generated set only after all seven assets exist. */
export const characterAssetsReady = true;
export const characterAssets = {
  wave: "/avinash-3d/wave.webp",
  hold: "/avinash-3d/hold.webp",
  open: "/avinash-3d/open.webp",
  sip: "/avinash-3d/sip.webp",
  enjoy: "/avinash-3d/enjoy.webp",
  grind: "/avinash-3d/grind.webp",
  coffee: "/avinash-3d/coffee.webp",
} as const satisfies Record<CharacterPose, string>;

export const characterDimensions = { width: 1536, height: 2048 } as const;
