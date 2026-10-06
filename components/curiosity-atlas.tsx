"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { musicAssets, themedAssetsReady } from "@/lib/themed-assets";
import { InterestObject, type InterestKind } from "./interest-object";
import { useMotion } from "./motion-experience";
import { interestActions } from "@/lib/object-actions";
import styles from "./curiosity-atlas.module.css";
import { FloatingObject } from "./floating-object";

const interests: { kind: InterestKind; label: string; note: string; text: string; next?: boolean }[] = [
  { kind: "tech", label: "Tech", note: "make something work", text: "Code, data, and ideas he can turn into working projects. Learning happens while he builds, breaks, and fixes things." },
  { kind: "business", label: "Business", note: "understand the people", text: "How a company works, what customers need, and how teams get things done. His startup experience gives those questions somewhere to go." },
  { kind: "editing", label: "Video editing", note: "one more cut", text: "Finding a rhythm in the footage. Trying different cuts, pacing, and sequences to see what makes a story feel right." },
  { kind: "design", label: "Graphic design", note: "move it two pixels", text: "Type, composition, and visual ideas. Another way to learn how to make something communicate clearly." },
  { kind: "photo", label: "Photography", note: "notice the little things", text: "Paying attention to light, framing, and ordinary moments. Learning to see a little more before pressing the shutter." },
  { kind: "video", label: "Videography", note: "let the moment move", text: "Taking that curiosity beyond a single frame. Exploring movement, shots, and the small details that make a scene." },
  { kind: "writing", label: "Content writing", note: "find the right words", text: "Putting thoughts into words, then editing them until they make sense to someone else. He also shares his writing on Medium." },
  { kind: "cooking", label: "Cooking", note: "learning, off-screen", text: "A different kind of making. Trying things in the kitchen, adjusting along the way, and learning from the result." },
  { kind: "travel", label: "Travelling", note: "take the longer way", text: "New places, different routines, and people with different perspectives. Plenty to notice, photograph, and learn from." },
  { kind: "finance", label: "Finance", note: "on the reading list", text: "Something he wants to get into next: understanding money, financial decisions, and how businesses are valued.", next: true },
  { kind: "economics", label: "Economics", note: "more questions ahead", text: "Another direction he wants to explore: markets, incentives, and why people and economies make the choices they do.", next: true },
];

// Preserve the original desktop positions; mobile uses a normal-flow grid.
const orbit = [[2, 1], [23, 0], [44, 2], [65, 0], [84, 8], [3, 36], [83, 40], [8, 71], [30, 73], [58, 73], [80, 73]];

function connectionPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const bend = (end.x - start.x) * .45;
  return `M${start.x} ${start.y} C${start.x + bend} ${start.y},${end.x} ${start.y + (end.y - start.y) * .65},${end.x} ${end.y}`;
}

const initialConnections = orbit.map(([left, top]) => connectionPath(
  { x: 450, y: 320 }, { x: (left + 7.5) * 12, y: top * 7.6 + 76 },
));

export function CuriosityAtlas() {
  const [selected, setSelected] = useState(0);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(false);
  const [connections, setConnections] = useState(initialConnections);
  const root = useRef<HTMLElement>(null);
  const universe = useRef<HTMLDivElement>(null);
  const detail = useRef<HTMLDivElement>(null);
  const dial = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  const motionActive = enabled && inView && tabVisible;
  const interest = interests[selected];
  const action = interestActions[interest.kind];
  const selectionAnimation = useRef<Animation | null>(null);

  function select(index: number) {
    setSelected((index + interests.length) % interests.length);
  }

  useEffect(() => {
    selectionAnimation.current?.cancel();
    if (!motionActive) return;
    const object = universe.current?.querySelector<HTMLElement>(`.curiosity-item-${selected} .curiosity-object-wrap`);
    if (!object) return;
    selectionAnimation.current = object.animate([
      { transform: "translateY(0) scale(1)" },
      { transform: "translateY(-8px) scale(1.08)" },
      { transform: "translateY(-2px) scale(1)" },
    ], { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" });
    return () => selectionAnimation.current?.cancel();
  }, [selected, motionActive]);

  useEffect(() => {
    const el = universe.current;
    if (!el) return;
    const observer = new IntersectionObserver(entries => {
      setInView(entries.some(entry => entry.isIntersecting));
    });
    const visibility = () => setTabVisible(!document.hidden);
    observer.observe(el);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    const world = universe.current, panel = detail.current, control = dial.current;
    if (!world || !panel || !control) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bounds = world.getBoundingClientRect();
      if (!bounds.width || !bounds.height || getComputedStyle(world).display === "flex") return;
      const point = (rect: DOMRect) => ({
        x: (rect.left + rect.width / 2 - bounds.left) * 1200 / bounds.width,
        y: (rect.top + rect.height / 2 - bounds.top) * 760 / bounds.height,
      });
      const start = point(control.getBoundingClientRect());
      const next = Array.from(world.querySelectorAll<HTMLElement>(".curiosity-object-wrap"), object =>
        connectionPath(start, point(object.getBoundingClientRect())),
      );
      setConnections(previous => previous.every((path, index) => path === next[index]) ? previous : next);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(world);
    observer.observe(panel);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [selected]);

  return <section className={`curiosity-atlas ${styles.atlas}`} id="curiosity" ref={root} aria-labelledby="curiosity-title" data-motion-enabled={enabled} data-motion-active={motionActive}>
    <div className={`curiosity-intro ${styles.intro}`}>
      <p className={`micro ${styles.eyebrow}`}>Curiosity / eleven frequencies</p>
      <h2 id="curiosity-title">Wanted to be<br />a <em>polymath</em></h2>
      <p className={`curiosity-aside ${styles.aside}`}>Still tuning in.</p>
      <p className={`curiosity-copy ${styles.copy}`}>Different interests, different frequencies. He tunes in by writing code, cutting a video, trying a recipe, or going somewhere new.</p>
    </div>
    <div className={`curiosity-universe ${styles.universe}`} ref={universe}>
      <svg className={`curiosity-thread ${styles.thread}`} viewBox="0 0 1200 760" fill="none" preserveAspectRatio="none" aria-hidden="true">
        {connections.map((path, index) => <g key={interests[index].kind}>
          <path className={styles.connection} d={path} vectorEffect="non-scaling-stroke" />
          <path className={styles.activeConnection} d={path} data-active={selected === index} vectorEffect="non-scaling-stroke" />
          <path className={styles.signal} d={path} data-active={selected === index} pathLength="100" vectorEffect="non-scaling-stroke" />
        </g>)}
      </svg>
      <div className={`curiosity-center ${styles.center}`} id="interest-detail" ref={detail} role="region" aria-label="Selected interest" aria-live="polite" aria-atomic="true">
        <div className={styles.detailHeader}>
          <div className={`curiosity-dial ${styles.dial}`} ref={dial}>
            <span className={styles.dialFallback} aria-hidden="true" />
            {themedAssetsReady && <img className={styles.dialImage} src={musicAssets.tuningDial.src} width={musicAssets.tuningDial.width} height={musicAssets.tuningDial.height} alt="" loading="eager" decoding="async" draggable="false" onError={event => { event.currentTarget.style.visibility = "hidden"; }} />}
            <svg className={styles.dialScale} viewBox="0 0 160 160" fill="none" aria-hidden="true">
              <circle cx="80" cy="80" r="74" />
              {interests.map((item, index) => {
                const angle = (-120 + index * 24) * Math.PI / 180;
                const inner = index % 5 === 0 ? 63 : 67;
                return <line key={item.kind} x1={(80 + Math.sin(angle) * inner).toFixed(3)} y1={(80 - Math.cos(angle) * inner).toFixed(3)} x2={(80 + Math.sin(angle) * 73).toFixed(3)} y2={(80 - Math.cos(angle) * 73).toFixed(3)} data-active={selected === index} />;
              })}
            </svg>
            <span className={styles.pointer} aria-hidden="true" style={{ "--dial-angle": `${-120 + selected * 24}deg` } as CSSProperties} />
            <input className={styles.dialControl} type="range" min="0" max="10" step="1" value={selected} aria-label="Tune the interest dial" aria-valuetext={`${interest.label}, frequency ${selected + 1} of 11`} onChange={event => select(Number(event.currentTarget.value))} />
          </div>
          <div className={styles.detailTitle}>
            <p className={`micro ${styles.frequency}`}>Frequency {String(selected + 1).padStart(2, "0")}<span>{interest.next ? "Next to explore" : "Learning & doing"}</span></p>
            <h3>{interest.label}</h3>
          </div>
        </div>
        <p className={styles.detailCopy}>{interest.text}</p>
        <span className={`curiosity-hand ${styles.hand}`}>{interest.note}</span>
        <span className={styles.dialHint}>Drag the dial or use arrow keys to tune.</span>
        <div className={styles.tuneControls}>
          <button type="button" onClick={() => select(selected - 1)} aria-label="Tune to previous interest">←</button>
          <a href={action.href}>{action.label} <span aria-hidden="true">↗</span></a>
          <button type="button" onClick={() => select(selected + 1)} aria-label="Tune to next interest">→</button>
        </div>
      </div>
      <div className={`curiosity-objects ${styles.objects}`} role="group" aria-label="Explore Avinash’s interests">
        {interests.map((item, index) => <button key={item.kind} type="button" className={`curiosity-item curiosity-item-${index} ${styles.item}`} style={{ "--orbit-left": `${orbit[index][0]}%`, "--orbit-top": `${orbit[index][1]}%`, "--lean": `${(index % 3 - 1) * 2}deg` } as CSSProperties} aria-pressed={selected === index} aria-controls="interest-detail" onClick={() => select(index)}>
          <FloatingObject phase={index}><span className={`curiosity-object-wrap ${styles.objectWrap}`} data-object-action={interestActions[item.kind].motion}><InterestObject kind={item.kind} /><span className={styles.objectEffect} aria-hidden="true" /></span></FloatingObject>
          <span className={styles.channel} aria-hidden="true">Freq. {String(index + 1).padStart(2, "0")}</span>
          <span className={`curiosity-label ${styles.label}`}>{item.label}</span>
          {item.next && <span className={`curiosity-next ${styles.next}`}>Next to explore</span>}
        </button>)}
      </div>
    </div>
    <div className={`curiosity-footer ${styles.footer}`}><span>Pick a frequency.<br />Follow a curiosity.</span><p>Some interests are part of his day.<br />Others are waiting for a first try.</p><a href="#work">See what he’s building ↘</a></div>
  </section>;
}
