import { characterAssets, characterDimensions } from "./character-assets";

export type RasterAsset = { readonly src: string; readonly width: number; readonly height: number };
/** Enable only after all six generated cutouts have passed visual and alpha inspection. */
export const themedAssetsReady: boolean = true;
const prop = (name: string): RasterAsset => ({ src: `/theme-3d/${name}.webp`, width: 2048, height: 2048 });
const interestProp = (name: string): RasterAsset => ({ src: `/interests-3d/${name}.webp`, width: 3840, height: 2160 });
export const musicAssets = {
  headphones: prop("headphones"),
  tuningDial: prop("tuning-dial"),
} as const;
export type CoffeeStage = "beans" | "grind" | "brew" | "milk" | "stir" | "enjoy";
export const coffeeAssets = {
  beans: prop("beans"),
  grind: { src: characterAssets.grind, ...characterDimensions },
  brew: prop("brew"),
  milk: prop("milk"),
  stir: prop("stir"),
  enjoy: { src: characterAssets.coffee, ...characterDimensions },
} as const satisfies Record<CoffeeStage, RasterAsset>;

export type InterestAssetKey = "tech" | "business" | "editing" | "design" | "photo" | "video" | "writing" | "cooking" | "travel" | "finance" | "economics";
/** Switch only after all eleven 4K renders pass geometry, consistency and alpha inspection. */
export const interestAssetsReady: boolean = true;
export const interestAssets = {
  tech: interestProp("tech"),
  business: interestProp("business"),
  editing: interestProp("editing"),
  design: interestProp("design"),
  photo: interestProp("photo"),
  video: interestProp("video"),
  writing: interestProp("writing"),
  cooking: interestProp("cooking"),
  travel: interestProp("travel"),
  finance: interestProp("finance"),
  economics: interestProp("economics"),
} as const satisfies Record<InterestAssetKey, RasterAsset>;
