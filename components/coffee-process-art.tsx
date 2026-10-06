import { coffeeAssets, themedAssetsReady } from "@/lib/themed-assets";
import styles from "./coffee-journey.module.css";
import { useId } from "react";

export const coffeeStages = ["beans", "grind", "brew", "milk", "stir", "enjoy"] as const;

export function CoffeeProcessArt({ step }: { step: number }) {
  const stage = coffeeStages[step] ?? coffeeStages[0];
  const asset = coffeeAssets[stage];
  const pending = !themedAssetsReady && stage !== "grind" && stage !== "enjoy";
  const id = useId().replace(/:/g, "");
  const articulated = stage === "brew" || stage === "milk" || stage === "stir";
  const cut = stage === "brew" ? 800 : stage === "milk" ? 875 : 890;

  return (
    <span className={styles.artFrame} data-coffee-art={stage} data-artwork-pending={pending ? stage : undefined}>
      {pending ? <span className={styles.pending}>3D artwork awaiting generation</span> : <img
        className={`coffee-process-art coffee-step-${step} ${styles.raster} ${articulated ? styles.sourceRaster : ""}`}
        src={asset.src}
        width={asset.width}
        height={asset.height}
        alt=""
        aria-hidden="true"
        decoding="async"
        draggable={false}
      />}
      {!pending && articulated && <svg className={styles.actionArt} viewBox="0 0 2048 2048" aria-hidden="true" data-brewing-action={stage}>
        <defs>
          <clipPath id={`${id}-tool`}><rect width="2048" height={cut} /></clipPath>
          <clipPath id={`${id}-cup`}><rect y={cut} width="2048" height={2048 - cut} /></clipPath>
        </defs>
        <image href={asset.src} width="2048" height="2048" clipPath={`url(#${id}-cup)`} />
        <g className={styles.movingTool} data-tool={stage}>
          <image href={asset.src} width="2048" height="2048" clipPath={`url(#${id}-tool)`} />
        </g>
        {(stage === "brew" || stage === "milk") && <path className={styles.liquid} data-liquid={stage} d={stage === "brew" ? "M740 610 Q716 740 700 885" : "M935 700 L910 1145"} fill="none" />}
        {stage === "stir" && <ellipse className={styles.surface} cx="1010" cy="940" rx="185" ry="48" fill="none" />}
      </svg>}
      {!pending && stage === "beans" && <svg className={styles.actionArt} viewBox="0 0 2048 2048" aria-hidden="true" data-brewing-action="beans">
        {[0, 1, 2].map(index => <g key={index} className={styles.fallingBean} style={{ animationDelay: `${index * .25}s` }}><ellipse cx={1230 + index * 85} cy={1510 + index * 18} rx="24" ry="15" fill="#704025" /><path d={`M${1215 + index * 85} ${1510 + index * 18} l30 0`} stroke="#c99a65" strokeWidth="3" /></g>)}
      </svg>}
      {!pending && (stage === "brew" || stage === "enjoy") && <span className={styles.steam} aria-hidden="true" />}
    </span>
  );
}
