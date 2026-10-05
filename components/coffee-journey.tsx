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
  const [step, setStep] = useState(0);
  const [pulse, setPulse] = useState(0);
  const { enabled } = useMotion();
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const markers = [...el.querySelectorAll<HTMLElement>("[data-coffee-step]")];
      const line = innerWidth <= 760 ? 285 : 140;
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
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule); resize.observe(el);
    const visibility = new IntersectionObserver(([entry]) => { el.dataset.visible = String(entry.isIntersecting); }); visibility.observe(el);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [enabled]);

  function seek(index: number) {
    const marker = root.current?.querySelector(`[data-coffee-step="${index}"]`);
    if (!marker) return;
    const line = innerWidth <= 760 ? 285 : 140;
    window.scrollTo({ top: scrollY + marker.getBoundingClientRect().top - line + 1, behavior: "instant" });
  }

  return <div className="coffee-act" ref={root} data-brew-stage={step}>
    <aside className="coffee-rail" aria-label="Coffee being made alongside the story">
      <p className="micro brew-kicker">Act II / The making of a cup</p>
      <div className="brew-heading" aria-live="polite" aria-atomic="true"><span className="brew-number">0{step + 1}</span><h2>{steps[step].title}</h2></div>
      <button className="coffee-art-button" type="button" onClick={() => setPulse(value => value + 1)} aria-label={steps[step].action} disabled={!enabled}>
        <CoffeeProcessArt step={step} key={`${step}-${pulse}`} />
        <span className="brew-action">{enabled ? `${steps[step].action} ↗` : steps[step].name}</span>
      </button>
      <p className="brew-note">{steps[step].note}</p>
      <nav className="brew-steps" aria-label="Follow the coffee process">{steps.map((item, index) => <button type="button" key={item.name} onClick={() => seek(index)} aria-current={step === index ? "step" : undefined}><span>0{index + 1}</span>{item.name}</button>)}</nav>
      <div className="brew-progress" aria-hidden="true"><span /></div>
    </aside>
    <div className="coffee-content">{children}</div>
  </div>;
}
