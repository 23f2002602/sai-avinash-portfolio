"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { themedAssetsReady } from "@/lib/themed-assets";
import { CoffeeProcessArt, coffeeStages } from "./coffee-process-art";
import { useMotion } from "./motion-experience";
import styles from "./coffee-journey.module.css";
import { coffeeActions } from "@/lib/object-actions";

const steps = [
  { name: "Beans", title: "Start with a handful.", note: "A few raw ingredients. A few ideas worth trying." },
  { name: "Grind", title: "Put in the work.", note: "A little patience. A lot of figuring things out." },
  { name: "Brew", title: "Let it come together.", note: "Ground coffee, hot water, and a little time." },
  { name: "Milk", title: "Better together.", note: "Something warm. Something shared." },
  { name: "Stir", title: "Find a little rhythm.", note: "Another cut, another frame, another way to tell it." },
  { name: "Enjoy", title: "Make yourself a cup.", note: "The coffee is ready. The conversation can begin." },
];
const chapterCompanions = ["Applications / raw ingredients", "Project details / craft", "Leadership / bringing it together", "Skills / the right blend", "Visual stories / rhythm", "Contact / a conversation"];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const initialOpacity = (index: number) => ({ "--coffee-layer-opacity": index === 0 ? 1 : 0 }) as CSSProperties;

export function CoffeeJourney({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const navigation = useRef<HTMLElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const activeStep = useRef(0);
  const [step, setStep] = useState(0);
  const { enabled } = useMotion();
  const artworkPending = !themedAssetsReady && step !== 1 && step !== 5;

  function markers() {
    // The page owns one marker per stage, outside filterable cards.
    // Accept numeric hooks and stage names without adding DOM markers.
    return coffeeStages.map((stage, index) => content.current?.querySelector<HTMLElement>(
      `[data-coffee-step="${index}"], [data-coffee-step="${stage}"]`,
    ) ?? null);
  }

  function measureOffset() {
    const header = document.querySelector<HTMLElement>(".site-header");
    const headerPosition = header && getComputedStyle(header).position;
    const headerBottom = header && (headerPosition === "fixed" || headerPosition === "sticky")
      ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const nav = navigation.current;
    const navHeight = nav && getComputedStyle(nav).position === "sticky" ? nav.getBoundingClientRect().height : 0;
    return { headerBottom, line: headerBottom + navHeight + 16 };
  }

  useEffect(() => {
    const el = root.current;
    const story = content.current;
    if (!el || !story) return;
    let frame = 0;
    let disposed = false;
    let journeyVisible = false;
    let artworkVisible = false;
    const layers = [...el.querySelectorAll<HTMLElement>("[data-coffee-layer]")];
    const writeProperty = (node: HTMLElement, name: string, value: string) => {
      if (node.style.getPropertyValue(name) !== value) node.style.setProperty(name, value);
    };

    const update = () => {
      frame = 0;
      if (disposed || document.hidden) return;
      // Read geometry before writes. Observed content/header dimensions
      // do not depend on the offsets or layer opacities.
      const { headerBottom, line } = measureOffset();
      const noteTop = el.querySelector<HTMLElement>(".brew-note")?.getBoundingClientRect().top;
      const headingTop = el.querySelector<HTMLElement>(".brew-heading")?.getBoundingClientRect().top;
      const mobile = matchMedia("(max-width: 760px)").matches;
      el.dataset.noteObscured = String(mobile && noteTop !== undefined && noteTop < line);
      el.dataset.headingObscured = String(mobile && headingTop !== undefined && headingTop < line);
      const positions = markers().map(marker => marker?.getBoundingClientRect().top ?? null);
      const end = story.getBoundingClientRect().bottom;
      let interval = 0;
      positions.forEach((top, index) => { if (top !== null && top <= line) interval = index; });
      const start = positions[interval];
      const finish = positions[interval + 1] ?? end;
      const progress = start === null ? 0 : clamp((line - start) / Math.max(1, finish - start));
      const blend = interval < steps.length - 1 ? clamp((progress - .8) / .2) : 0;
      const active = blend > .5 ? interval + 1 : interval;
      const visualBlend = enabled ? blend : Number(blend > .5);

      writeProperty(el, "--coffee-header-offset", `${headerBottom}px`);
      writeProperty(el, "--coffee-seek-offset", `${line}px`);
      writeProperty(el, "--coffee-progress", String(progress));
      writeProperty(el, "--coffee-blend", String(visualBlend));
      layers.forEach(layer => {
        const index = Number(layer.dataset.coffeeLayer);
        const opacity = index === interval ? 1 - visualBlend : index === interval + 1 ? visualBlend : 0;
        writeProperty(layer, "--coffee-layer-opacity", String(opacity));
      });
      // React and the live region update only when the dominant stage changes.
      if (activeStep.current !== active) {
        activeStep.current = active;
        setStep(active);
      }
    };
    const schedule = () => {
      if (!disposed && journeyVisible && !document.hidden && !frame) frame = requestAnimationFrame(update);
    };
    const syncVisibility = () => {
      el.dataset.visible = String(artworkVisible && !document.hidden);
      if (document.hidden || !journeyVisible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule();
    };
    const visibility = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.target === el) journeyVisible = entry.isIntersecting;
        if (entry.target === artwork.current) artworkVisible = entry.isIntersecting;
      });
      syncVisibility();
    });
    visibility.observe(el);
    if (artwork.current) visibility.observe(artwork.current);

    // Observe geometry inputs, never the rail whose height uses the header.
    // Coalesced callbacks and unchanged-value guards prevent resize loops.
    const resize = new ResizeObserver(schedule);
    resize.observe(story);
    const header = document.querySelector(".site-header");
    if (header) resize.observe(header);
    if (navigation.current) resize.observe(navigation.current);
    const mutation = new MutationObserver(schedule);
    mutation.observe(story, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-coffee-step"] });
    document.fonts.ready.then(schedule);
    document.addEventListener("visibilitychange", syncVisibility);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      mutation.disconnect();
      visibility.disconnect();
      el.dataset.visible = "false";
      document.removeEventListener("visibilitychange", syncVisibility);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [enabled]);

  function seek(index: number) {
    const marker = markers()[index];
    if (!marker) return;
    const { line } = measureOffset();
    window.scrollTo({ top: window.scrollY + marker.getBoundingClientRect().top - line + 8, behavior: enabled ? "smooth" : "instant" });
  }

  function replay() {
    if (!enabled || artworkPending || root.current?.dataset.visible !== "true" || !artwork.current) return;
    artwork.current.getAnimations({ subtree: true }).forEach(animation => {
      animation.currentTime = 0;
    });
  }

  return (
    <div className={`coffee-act ${styles.root}`} ref={root} data-brew-stage={step} data-coffee-stage={coffeeStages[step]} data-visible="false" data-coffee-motion={enabled ? "full" : "still"}>
      <aside className={`coffee-rail ${styles.rail}`} aria-label="Coffee alongside the story">
        <nav ref={navigation} className={`brew-steps ${styles.steps}`} aria-label="Follow the coffee process">
          {steps.map((item, index) => (
            <button type="button" key={item.name} onClick={() => seek(index)} aria-current={step === index ? "step" : undefined}>
              <span aria-hidden="true">0{index + 1}</span>{item.name}
            </button>
          ))}
        </nav>
        <div className={`coffee-presentation ${styles.presentation}`}>
          <p className={`micro brew-kicker ${styles.kicker}`}>{chapterCompanions[step]}</p>
          <div className={`brew-heading ${styles.headingStack}`}>
            {steps.map((item, index) => (
              <div key={item.name} className={styles.headingLayer} data-coffee-layer={index} data-active={step === index} inert={step !== index} aria-hidden={step !== index} style={initialOpacity(index)}>
                <span className={`brew-number ${styles.number}`} aria-hidden="true">0{index + 1}</span>
                <h2>{item.title}</h2>
              </div>
            ))}
          </div>
          <div ref={artwork} className={`coffee-art-stack ${styles.artStack}`} aria-hidden="true">
            {steps.map((item, index) => (
              <span className={`coffee-art-layer ${styles.artLayer}`} key={item.name} data-coffee-layer={index} data-active={step === index} inert={step !== index} style={initialOpacity(index)}>
                <CoffeeProcessArt step={index} />
              </span>
            ))}
          </div>
          <button className={`coffee-art-button ${styles.replay}`} type="button" onClick={replay} disabled={!enabled || artworkPending} aria-label={`Replay coffee action: ${coffeeActions[step]}`}>
            {coffeeActions[step]} <span aria-hidden="true">↻</span>
          </button>
          <div className={`brew-note ${styles.noteStack}`}>
            {steps.map((item, index) => (
              <p key={item.name} className={styles.noteLayer} data-coffee-layer={index} data-active={step === index} inert={step !== index} aria-hidden={step !== index} style={initialOpacity(index)}>{item.note}</p>
            ))}
          </div>
        </div>
        <div className={`brew-progress ${styles.progress}`} aria-hidden="true"><span /></div>
      </aside>
      <p className={styles.liveLabel} role="status" aria-live="polite" aria-atomic="true">Coffee stage {step + 1} of {steps.length}: {steps[step].name}</p>
      <div className={`coffee-content ${styles.content}`} ref={content}>{children}</div>
    </div>
  );
}
