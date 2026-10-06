"use client";

import { useEffect, useRef, useState } from "react";
import { musicAssets, themedAssetsReady } from "@/lib/themed-assets";
import { useMotion } from "./motion-experience";
import { FloatingObject } from "./floating-object";
import styles from "./music-motif.module.css";

export function Waveform({ compact = false }: { compact?: boolean }) {
  return <span className={`${styles.waveform} ${compact ? styles.compact : ""}`} aria-hidden="true">
    {[12, 20, 32, 18, 44, 28, 56, 36, 24, 48, 30, 16, 38, 22, 12].map((height, i) =>
      <i key={i} style={{ height, animationDelay: `${i * -0.13}s` }} />)}
  </span>;
}

export function MusicMotif() {
  const image = musicAssets.headphones;
  const root = useRef<HTMLElement>(null);
  const [focus, setFocus] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const { enabled } = useMotion();
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)));
    const visibility = () => setTabVisible(!document.hidden);
    observer.observe(element);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  return <figure ref={root} className={styles.motif} aria-label="Music and focus" data-focus={focus} data-prop-motion={enabled && visible && tabVisible}>
    <span className={styles.orbit} aria-hidden="true" />
    {themedAssetsReady
      ? <FloatingObject phase={2}><img src={image.src} width={image.width} height={image.height} alt="" loading="lazy" decoding="async" /></FloatingObject>
      : <div className={styles.pending} data-artwork-pending="headphones"><span>Music &amp; focus</span><small>3D headphone artwork awaiting generation</small><Waveform /></div>}
    <figcaption><span>{focus ? "Tuned in / focus" : "In his own rhythm"}</span><Waveform compact /></figcaption>
    <button type="button" className={styles.focusControl} aria-pressed={focus} onClick={() => setFocus(!focus)}> {focus ? "Leave focus mode" : "Tune into focus"} <span aria-hidden="true">↗</span></button>
    <p className={styles.focusNote} aria-live="polite">{focus ? "Less noise. More room to learn and make." : "Tap the headphones’ control to find a quieter rhythm."} <span>Visual only · no audio</span></p>
  </figure>;
}
