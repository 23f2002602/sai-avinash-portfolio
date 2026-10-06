"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CoffeeProcessArt } from "./coffee-process-art";
import { useMotion } from "./motion-experience";

const steps = [
  { name: "Beans", title: "Start with a handful.", note: "A few raw ingredients. A few ideas worth trying.", action: "Toss the beans" },
  { name: "Grind", title: "Put in the work.", note: "A little patience. A lot of figuring things out.", action: "Turn the grinder" },
  { name: "Brew", title: "Let it come together.", note: "Ground coffee, hot water, and a little time.", action: "Pour the water" },
  { name: "Milk", title: "Better together.", note: "Something warm. Something shared.", action: "Pour the milk" },
  { name: "Stir", title: "Find a little rhythm.", note: "Another cut, another frame, another way to tell it.", action: "Give it a stir" },
  { name: "Enjoy", title: "Make yourself a cup.", note: "The coffee is ready. The conversation can begin.", action: "Let it steam" },
];

export function CoffeeJourney({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const artwork = useRef<HTMLButtonElement>(null);
  const feedback = useRef<Animation | null>(null);
  const [step, setStep] = useState(0);
  const { enabled } = useMotion();

  function measureOffset() {
    const header = document.querySelector<HTMLElement>(".site-header");
    const position = header && getComputedStyle(header).position;
    const headerBottom = header && (position === "fixed" || position === "sticky")
      ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const mobile = matchMedia("(max-width: 760px)").matches;
    const line = headerBottom + (mobile ? navigation.current?.getBoundingClientRect().height ?? 0 : 0) + 16;
    root.current?.style.setProperty("--coffee-header-offset", `${headerBottom}px`);
    root.current?.style.setProperty("--coffee-seek-offset", `${line}px`);
    return line;
  }

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    let visible = false;
    const update = () => {
      frame = 0;
      const markers = [...el.querySelectorAll<HTMLElement>("[data-coffee-step]")];
      const line = measureOffset();
      const note = el.querySelector<HTMLElement>(".brew-note");
      // A sticky step bar can cover the trailing note as the artwork scrolls away.
      // Keep its space so hiding the covered text never changes seek geometry.
      el.dataset.noteObscured = String(matchMedia("(max-width: 760px)").matches && !!note && note.getBoundingClientRect().top < line - 16);
      let current = 0;
      markers.forEach(marker => { if (marker.getBoundingClientRect().top <= line) current = Number(marker.dataset.coffeeStep); });
      setStep(current);
      const here = markers.find(marker => Number(marker.dataset.coffeeStep) === current);
      const next = markers.find(marker => Number(marker.dataset.coffeeStep) === current + 1);
      if (here) {
        const top = here.getBoundingClientRect().top;
        const end = next?.getBoundingClientRect().top ?? el.getBoundingClientRect().bottom;
        const progress = Math.max(0, Math.min(1, (line - top) / Math.max(1, end - top)));
        el.style.setProperty("--coffee-progress", String(enabled ? progress : .5));
      }
    };
    const schedule = () => { if (!document.hidden && !frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule); resize.observe(el);
    const header = document.querySelector(".site-header");
    if (header) resize.observe(header);
    if (navigation.current) resize.observe(navigation.current);
    const syncVisibility = () => {
      el.dataset.visible = String(visible && !document.hidden);
      if (!visible || document.hidden) feedback.current?.pause();
      else feedback.current?.play();
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else schedule();
    };
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVisibility(); });
    if (artwork.current) visibility.observe(artwork.current);
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect(); feedback.current?.cancel();
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  function seek(index: number) {
    const marker = root.current?.querySelector(`[data-coffee-step="${index}"]`);
    if (!marker) return;
    const line = measureOffset();
    window.scrollTo({ top: scrollY + marker.getBoundingClientRect().top - line + 8, behavior: enabled ? "smooth" : "instant" });
  }

  function replay() {
    if (!enabled || root.current?.dataset.visible !== "true") return;
    const layer = artwork.current?.querySelector<HTMLElement>('[data-active="true"]');
    layer?.getAnimations({ subtree: true }).forEach(animation => { animation.currentTime = 0; });
    feedback.current?.cancel();
    if (layer) feedback.current = layer.animate([
      { transform: "scale(1)" }, { transform: "scale(1.035)" }, { transform: "scale(1)" },
    ], { duration: 480, easing: "ease-in-out" });
  }

  return <div className="coffee-act" ref={root} data-brew-stage={step} data-visible="false" data-coffee-motion={enabled ? "full" : "still"}>
    <aside className="coffee-rail" aria-label="Coffee being made alongside the story">
      <nav ref={navigation} className="brew-steps" aria-label="Follow the coffee process">{steps.map((item, index) => <button type="button" key={item.name} onClick={() => seek(index)} aria-current={step === index ? "step" : undefined}><span>0{index + 1}</span>{item.name}</button>)}</nav>
      <div className="coffee-presentation">
      <p className="micro brew-kicker">Act II / The making of a cup</p>
      <div className="brew-heading" aria-live="polite" aria-atomic="true"><span className="brew-number">0{step + 1}</span><h2>{steps[step].title}</h2></div>
      <button ref={artwork} className="coffee-art-button" type="button" onClick={replay} aria-label={steps[step].action} disabled={!enabled}>
        <span className="coffee-art-stack" aria-hidden="true">{steps.map((item, index) => <span className="coffee-art-layer" key={item.name} data-active={step === index}><CoffeeProcessArt step={index} /></span>)}</span>
        <span className="brew-action">{enabled ? `${steps[step].action} ↗` : steps[step].name}</span>
      </button>
      <p className="brew-note">{steps[step].note}</p>
      </div>
      <div className="brew-progress" aria-hidden="true"><span /></div>
    </aside>
    <div className="coffee-content">{children}</div>
  </div>;
}
