"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const MotionContext = createContext({ enabled: false, reduced: true, toggle: () => {} });
export const useMotion = () => useContext(MotionContext);

export function MotionExperience({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(true);
  const [on, setOn] = useState(true);
  const enabled = on && !reduced;

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    try { setOn(sessionStorage.getItem("avinash-motion") !== "off"); } catch { /* session storage is optional */ }
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!enabled || !root.current) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const animation = entry.target.animate([
          { opacity: .3, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" });
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    root.current.querySelectorAll(".chapter h2, .project-card, .experience-row, .leadership-item, .skills-block h3, [data-reveal]").forEach(el => observer.observe(el));

    const visibility = () => {
      if (!root.current) return;
      root.current.dataset.tabVisible = String(!document.hidden);
      animations.forEach(animation => document.hidden ? animation.pause() : animation.play());
    };
    const loops = new IntersectionObserver(entries => entries.forEach(entry => {
      (entry.target as HTMLElement).dataset.motionVisible = String(entry.isIntersecting);
    }));
    root.current.querySelectorAll(".curiosity-universe, .project-sketch, .coffee-act, .experience-section, [data-motion-surface]").forEach(el => loops.observe(el));
    document.addEventListener("visibilitychange", visibility);
    visibility();

    let frame = 0;
    let previous: HTMLElement | null = null;
    const reset = () => { previous?.style.removeProperty("--tilt-x"); previous?.style.removeProperty("--tilt-y"); previous = null; };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const card = (event.target as Element)?.closest<HTMLElement>(".project-card, .note-card");
        if (card !== previous) reset();
        if (!card) return;
        previous = card;
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        card.style.setProperty("--tilt-x", `${(y - .5) * -3}deg`);
        card.style.setProperty("--tilt-y", `${(x - .5) * 3}deg`);
        card.style.setProperty("--spot-x", `${x * 100}%`);
        card.style.setProperty("--spot-y", `${y * 100}%`);
      });
    };
    const exit = () => { cancelAnimationFrame(frame); reset(); };
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", exit);
    return () => {
      observer.disconnect(); loops.disconnect(); animations.forEach(animation => animation.cancel());
      document.removeEventListener("visibilitychange", visibility);
      cancelAnimationFrame(frame); reset();
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", exit);
    };
  }, [enabled]);

  const toggle = () => {
    setOn(!on);
    try { sessionStorage.setItem("avinash-motion", on ? "off" : "on"); } catch { /* preference still works without storage */ }
  };

  return <MotionContext.Provider value={{ enabled, reduced, toggle }}>
    <div ref={root} className="motion-experience" data-motion={enabled ? "full" : "still"}>
      {children}
    </div>
  </MotionContext.Provider>;
}

export function MotionToggle() {
  const { enabled, reduced, toggle } = useMotion();
  return <button className="motion-switch" type="button" aria-pressed={enabled} disabled={reduced} onClick={toggle}><span aria-hidden="true" className="motion-switch-icon">✳</span><span className="motion-switch-label">{reduced ? "Reduced motion" : enabled ? "Motion on" : "Motion off"}</span></button>;
}
