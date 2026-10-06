"use client";

import { useEffect, useRef, useState } from "react";
import { CokeStoryArt } from "./coke-story-art";
import { SceneParticles } from "./scene-particles";
import { useMotion } from "./motion-experience";
import styles from "./avinash-story.module.css";

const scenes = [
  { name: "The classroom", title: "A lot of", emphasis: "questions.", caption: "He joined IIT Madras in 2023 to study Data Science. Statistics, code, and plenty of things to figure out along the way.", note: "BS in Data Science / IIT Madras" },
  { name: "At work", title: "Learning", emphasis: "by doing.", caption: "Research and outreach at Gaara AI. Startup operations at Ments. And now, a Data Science internship at Syngenta.", note: "A few stops along the way" },
  { name: "The projects", title: "Things", emphasis: "he’s made.", caption: "A placement portal, an assessment platform, a slide generator. A few of his ideas have made it out of the notebook.", note: "PlaceMe / InternAssess / Gyaan Deck" },
  { name: "On campus", title: "Away from", emphasis: "the laptop.", caption: "Editing videos, designing graphics, taking photos, writing, cooking, travelling. There’s a lot he wants to try, and he’s making time for it.", note: "IIT Madras / and life outside it" },
  { name: "Say hello", title: "Have an", emphasis: "idea?", caption: "Finance and economics are next on his learning list. In the meantime, he’s building, creating, and open to a good conversation.", note: "A good place to start" },
] as const;

export function AvinashStory() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const section = root.current, screen = stage.current;
    if (!section || !screen) return;
    const layers = [...screen.querySelectorAll<HTMLElement>("[data-story-layer]")];
    const short = matchMedia("(max-height: 599px)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 76;
      screen.style.setProperty("--header-height", `${top}px`);
      let position: number;
      if (short.matches) {
        let passed = 0;
        layers.forEach((layer, i) => { if (layer.getBoundingClientRect().top <= top + innerHeight * .35) passed = i; });
        position = passed;
      } else {
        const distance = Math.max(1, section.offsetHeight - screen.offsetHeight);
        position = Math.min(scenes.length - .001, Math.max(0, (top - section.getBoundingClientRect().top) / distance) * scenes.length);
      }
      const current = Math.floor(position), fraction = position - current;
      const raw = enabled && !short.matches && current < scenes.length - 1 ? Math.max(0, (fraction - .8) / .2) : 0;
      const blend = raw * raw * (3 - 2 * raw);
      const selected = blend > .5 ? Math.min(current + 1, scenes.length - 1) : current;
      screen.dataset.scene = String(selected + 1);
      setIndex(selected);
      layers.forEach((layer, i) => {
        const opacity = i === current ? 1 - blend : i === current + 1 ? blend : 0;
        layer.style.setProperty("--layer-opacity", String(opacity));
        layer.style.setProperty("--layer-y", `${enabled ? (i === current ? -blend * 10 : (1 - blend) * 10) : 0}px`);
        const accessible = short.matches || i === selected;
        layer.inert = !accessible;
        layer.setAttribute("aria-hidden", String(!accessible));
        layer.dataset.active = String(accessible);
      });
      screen.style.setProperty("--scene-progress", String(fraction));
      screen.style.setProperty("--film-progress", String(position / scenes.length));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const visibility = () => { section.dataset.tabVisible = String(!document.hidden); };
    const observer = new IntersectionObserver(([entry]) => {
      setActive(entry.isIntersecting); section.dataset.visible = String(entry.isIntersecting);
    });
    observer.observe(section);
    const resize = new ResizeObserver(schedule); resize.observe(section); resize.observe(screen);
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", visibility); short.addEventListener("change", schedule);
    update(); visibility();
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", visibility); short.removeEventListener("change", schedule);
    };
  }, [enabled]);

  function goTo(next: number) {
    const section = root.current, screen = stage.current;
    if (!section || !screen) return;
    const top = document.querySelector(".site-header")?.getBoundingClientRect().height ?? 76;
    const target = matchMedia("(max-height: 599px)").matches
      ? screen.querySelectorAll<HTMLElement>("[data-story-layer]")[next].getBoundingClientRect().top + scrollY - top
      : scrollY + section.getBoundingClientRect().top - top + (section.offsetHeight - screen.offsetHeight) * (next + .04) / scenes.length;
    window.scrollTo({ top: target, behavior: enabled ? "smooth" : "instant" });
  }

  return <section id="story" ref={root} className={styles.film} data-story data-reveal aria-label="Avinash’s story in five scenes">
    <div ref={stage} className={styles.stage} data-story-stage data-scene={index + 1}>
      <div className={styles.topline}><span className="micro">Act I / A little fizz</span><a href="#about">Skip to portfolio ↗</a></div>
      <div className={styles.layers}>
        {scenes.map((scene, i) => <article key={scene.name} className={styles.layer} data-story-layer data-active={i === 0} aria-hidden={i !== 0} inert={i !== 0}>
          <div className={styles.narration}>
            <p className={`micro ${styles.note}`}>{scene.note}</p>
            <h2>{scene.title}<br /><em>{scene.emphasis}</em></h2>
            <p className={styles.caption} data-story-caption>{scene.caption}</p>
            {i === 4 && <a className={styles.read} href="#contact">Be part of the next chapter ↗</a>}
          </div>
          <div className={styles.visual}><CokeStoryArt step={i + 1} pulse={burst} /></div>
        </article>)}
      </div>
      <div ref={artwork} className={styles.particles}><SceneParticles scene={index} active={enabled && active} burst={burst} surface={artwork} /></div>
      <div className={styles.bottom} data-story-controls>
        <span className={`micro ${styles.direction}`}>{index === 4 ? "The story continues below" : "Scroll to continue"}</span>
        <nav className={`story-timeline ${styles.timeline}`} aria-label="Choose a story scene">
          {scenes.map((scene, i) => <button type="button" key={scene.name} onClick={() => goTo(i)} aria-label={`Scene ${i + 1}: ${scene.name}`} aria-current={index === i ? "step" : undefined}><span className={styles.track}><span style={{ transform: `scaleX(${i < index ? 1 : i === index ? "var(--scene-progress, 0)" : 0})` }} /></span><span>0{i + 1}</span></button>)}
        </nav>
        <button className={styles.ripple} type="button" disabled={!enabled} onClick={() => setBurst(value => value + 1)}>A little more fizz ↝</button>
      </div>
    </div>
  </section>;
}
