"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SceneParticles } from "./scene-particles";
import { CokeStoryArt, cokeMoments } from "./coke-story-art";
import { DietCokeCan } from "./drink-art";
import { PosterLayers } from "./poster-layers";
import { useMotion } from "./motion-experience";

const scenes = [
  { name: "Meet Avinash", title: "This is", emphasis: "Avinash.", caption: "An aspiring polymath, learning by doing. He’s into tech, business, and making things—with plenty still to figure out.", note: "Sai Avinash / Chennai", art: "portrait" },
  { name: "The classroom", title: "A lot of", emphasis: "questions.", caption: "He joined IIT Madras in 2023 to study Data Science. Statistics, code, and plenty of things to figure out along the way.", note: "BS in Data Science / IIT Madras", art: "study" },
  { name: "At work", title: "Learning", emphasis: "by doing.", caption: "Research and outreach at Gaara AI. Startup operations at Ments. And now, a Data Science internship at Syngenta.", note: "A few stops along the way", art: "people" },
  { name: "The projects", title: "Things", emphasis: "he’s made.", caption: "A placement portal, an assessment platform, a slide generator. A few of his ideas have made it out of the notebook.", note: "PlaceMe / InternAssess / Gyaan Deck", art: "build" },
  { name: "On campus", title: "Away from", emphasis: "the laptop.", caption: "Editing videos, designing graphics, taking photos, writing, cooking, travelling. There’s a lot he wants to try, and he’s making time for it.", note: "IIT Madras / and life outside it", art: "campus" },
  { name: "Say hello", title: "Have an", emphasis: "idea?", caption: "Finance and economics are next on his learning list. In the meantime, he’s building, creating, and open to a good conversation.", note: "A good place to start", art: "next" },
] as const;

export function AvinashStory() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const artwork = useRef<HTMLDivElement>(null);
  const motion = useMotion();
  const [index, setIndex] = useState(0);
  const [burst, setBurst] = useState(0);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const scene = scenes[index];

  useEffect(() => {
    const section = root.current;
    const screen = stage.current;
    if (!section || !screen) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const stickyTop = parseFloat(getComputedStyle(screen).top) || 0;
      const distance = section.offsetHeight - screen.offsetHeight;
      const progress = Math.max(0, Math.min(1, (stickyTop - section.getBoundingClientRect().top) / distance));
      const position = Math.min(scenes.length - .001, progress * scenes.length);
      setIndex(Math.floor(position));
      screen.style.setProperty("--scene-progress", String(motion.enabled ? position % 1 : 0));
      screen.style.setProperty("--film-progress", String(progress));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const visibility = () => setTabVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    observer.observe(screen);
    const resize = new ResizeObserver(schedule);
    resize.observe(section);
    resize.observe(screen);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("visibilitychange", visibility);
    update(); visibility();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect(); resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [motion.enabled]);

  function goTo(next: number) {
    const section = root.current;
    const screen = stage.current;
    if (!section || !screen) return;
    const stickyTop = parseFloat(getComputedStyle(screen).top) || 0;
    const distance = section.offsetHeight - screen.offsetHeight;
    // Native scrolling keeps wheel, touch, keyboard and reverse travel in sync.
    window.scrollTo({
      top: window.scrollY + section.getBoundingClientRect().top - stickyTop + distance * (next + .04) / scenes.length,
      behavior: "instant",
    });
  }

  return (
    <section ref={root} className="avinash-film" aria-label="A guy called Avinash: a story in six scenes">
      <div ref={stage} className={`story-stage ${index === 0 ? "scene-photo" : "scene-paper"}`} data-scene={index + 1} data-coke-step={index}>
        <PosterLayers scene={index} />
        <div className="story-shot">
          <div ref={artwork} className={`story-art art-${scene.art}`}>
            <div className="story-visual" key={index}>
              {index === 0
                ? <><img src="/avinash-portrait.jpg" alt="Sai Avinash in a navy jacket" width="1080" height="1920" fetchPriority="high" /><div className="portrait-can" aria-hidden="true"><DietCokeCan /><span>his one constant.</span></div></>
                : <CokeStoryArt step={index} pulse={burst} />}
            </div>
            <SceneParticles scene={index} active={motion.enabled && inView && tabVisible} burst={burst} surface={artwork} />
            
          </div>
          <div className="story-atmosphere" aria-hidden="true" />
          <div className="story-margin-note"><strong>{String(index + 1).padStart(2, "0")}</strong><span>{cokeMoments[index]}</span></div>
          <div className="story-narration" key={index}>
            <p className="micro story-note">{scene.note}</p>
            <h1>{scene.title.split(" ").map((word, i) => <span className="story-word" style={{ "--word": i } as CSSProperties} key={i}>{word}{" "}</span>)}<br /><em className="story-emphasis">{scene.emphasis}</em></h1>
            <p className="story-caption">{scene.caption}</p>
            {index === 5 && <a className="story-read" href="#contact">Be part of the next chapter <span aria-hidden="true">↗</span></a>}
          </div>
        </div>
        <div className="story-texture" aria-hidden="true" />
        <div className="story-topline micro"><span>Act I / A little fizz<span className="story-topline-detail"> / A Diet Coke addict called Avinash</span></span><a href="#about">Skip to portfolio ↗</a></div>
        <div className="story-bottom">
          <div className="story-direction"><span className="scroll-stem" aria-hidden="true" /><span className="micro">{index === 5 ? "The story continues below" : index === 0 ? "Scroll to begin the story" : "Scroll to continue"}</span></div>
          <nav className="story-timeline" aria-label="Choose a story scene">
            {scenes.map((item, position) => <button type="button" key={item.name} onClick={() => goTo(position)} aria-label={`Scene ${position + 1}: ${item.name}`} aria-current={position === index ? "step" : undefined}><span className="story-track"><span style={{ transform: `scaleX(${position < index ? 1 : position === index ? "var(--scene-progress, 0)" : 0})` }} /></span><span className="micro">{String(position + 1).padStart(2, "0")}</span><span className="scene-tooltip">{item.name}</span></button>)}
          </nav>
          <button className="story-ripple micro" type="button" disabled={!motion.enabled} onClick={() => setBurst(value => value + 1)} aria-label="Replay the fizz"><span aria-hidden="true">↝</span><span>{motion.enabled ? "A little more fizz" : "Take your time"}</span></button>
        </div>
        <div className="film-progress" aria-hidden="true" />
      </div>
    </section>
  );
}
