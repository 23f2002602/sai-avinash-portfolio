"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useMotion } from "./motion-experience";
import styles from "./floating-object.module.css";

export function FloatingObject({ children, phase = 0 }: { children: ReactNode; phase?: number }) {
  const root = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const { enabled } = useMotion();
  const active = enabled && visible && tabVisible;
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)));
    const visibility = () => setTabVisible(!document.hidden);
    observer.observe(element);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', visibility); };
  }, []);
  const reset = () => { root.current?.style.removeProperty('--object-x'); root.current?.style.removeProperty('--object-y'); };
  useEffect(() => { if (!active) reset(); }, [active]);
  return <span ref={root} className={styles.object} data-floating-active={active} style={{ '--object-phase': `${phase * -.63}s` } as CSSProperties} onPointerMove={event => {
    if (!active || event.pointerType !== 'mouse') return;
    const r = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--object-x', `${Math.max(-1, Math.min(1, (event.clientX - r.left) / r.width * 2 - 1)) * 12}deg`);
    event.currentTarget.style.setProperty('--object-y', `${Math.max(-1, Math.min(1, (event.clientY - r.top) / r.height * 2 - 1)) * -10}deg`);
  }} onPointerLeave={reset}>
    <span className={styles.shadow} aria-hidden="true" />
    <span className={styles.float}><span className={styles.tilt}>{children}</span></span>
  </span>;
}
