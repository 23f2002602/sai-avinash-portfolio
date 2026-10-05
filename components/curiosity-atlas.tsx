"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { InterestObject, type InterestKind } from "./interest-object";
import { useMotion } from "./motion-experience";

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

// Keep the photographs in Avinash's supplied order.
const runnerPoses = [
  { source: "shared image (1).jpg", width: 176, height: 479 },
  { source: "shared image.jpg", width: 193, height: 516 },
  { source: "shared image (3).jpg", width: 281, height: 715 },
];

export function CuriosityAtlas() {
  const [selected, setSelected] = useState(0);
  const root = useRef<HTMLElement>(null);
  const universe = useRef<HTMLDivElement>(null);
  const thread = useRef<SVGPathElement>(null);
  const runner = useRef<HTMLDivElement>(null);
  const { enabled } = useMotion();
  const interest = interests[selected];

  useEffect(() => {
    const el = root.current;
    const world = universe.current, path = thread.current, prop = runner.current;
    if (!el || !world || !path || !prop) return;
    const pathLength = path.getTotalLength();
    let frame = 0;
    const update = () => {
      frame = 0;
      const bounds = el.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - bounds.top) / (innerHeight + bounds.height * .5)));
      el.style.setProperty("--thread-progress", String(enabled ? progress : 1));
      const worldBounds = world.getBoundingClientRect();
      const journey = enabled ? Math.max(0, Math.min(1,
        (innerHeight * .8 - worldBounds.top) / (innerHeight * .8 + worldBounds.height * .65))) : 0;
      // Follow the lower loop of the existing drawn thread. The prop sits
      // behind the reading panel and controls, with no extra scroll stage.
      const point = path.getPointAtLength(pathLength * (.18 + journey * .26));
      prop.style.setProperty("--runner-x", `${point.x / 12}%`);
      prop.style.setProperty("--runner-y", `${point.y / 7.6}%`);
      prop.style.setProperty("--runner-lean", `${enabled ? Math.sin(journey * Math.PI * 4) * 5 : -4}deg`);
      prop.dataset.pose = String(Math.min(3, Math.floor(journey * 3) + 1));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(world);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [enabled]);

  return <section className="curiosity-atlas" id="curiosity" ref={root} aria-labelledby="curiosity-title">
    <div className="curiosity-intro">
      <p className="micro">A few things he keeps coming back to</p>
      <h2 id="curiosity-title">Wanted to be<br />a <em>polymath.</em></h2>
      <p className="curiosity-aside">Haven’t quite got there yet.</p>
      <p className="curiosity-copy">He’s learning by doing. Some days that means writing code. Other days, editing a video, trying a recipe, or going somewhere new.</p>
    </div>
    <div className="curiosity-universe" ref={universe}>
      <svg className="curiosity-thread" viewBox="0 0 1200 760" fill="none" preserveAspectRatio="none" aria-hidden="true"><path ref={thread} pathLength="1" d="M110 145C205 14 490 160 369 253S58 210 139 427S340 723 454 608S410 342 538 304S741 318 811 210S872 47 1036 164S944 437 1026 508S1011 720 842 641S682 515 646 630S420 758 292 681" /></svg>
      <div className="curiosity-runner" ref={runner} data-pose="1" aria-hidden="true">
        <div className="curiosity-runner-figure">{runnerPoses.map((pose, index) =>
          <img key={pose.source} data-source={pose.source} src={`/running/prop-${index + 1}.webp`} alt="" width={pose.width} height={pose.height} loading="lazy" decoding="async" draggable="false" />
        )}</div>
        <span>on his way.</span>
      </div>
      <div className="curiosity-center" id="interest-detail" aria-live="polite" aria-atomic="true">
        <p className="micro">{interest.next ? "Next to explore" : "Learning & doing"} / {String(selected + 1).padStart(2, "0")}</p>
        <h3>{interest.label}</h3>
        <p>{interest.text}</p>
        <span className="curiosity-hand">{interest.note}</span>
      </div>
      <div className="curiosity-objects" aria-label="Explore Avinash’s interests">
        {interests.map((item, index) => <button key={item.kind} type="button" className={`curiosity-item curiosity-item-${index}`} style={{ "--float-delay": `${-index * .7}s`, "--lean": `${(index % 3 - 1) * 7}deg` } as CSSProperties} aria-pressed={selected === index} aria-controls="interest-detail" onClick={() => setSelected(index)}>
          <span className="curiosity-object-wrap"><InterestObject kind={item.kind} /></span>
          <span className="curiosity-label">{item.label}</span>
          {item.next && <span className="curiosity-next">Next to explore</span>}
        </button>)}
      </div>
    </div>
    <div className="curiosity-footer"><span>Pick an object. Follow a curiosity.</span><p>Not a list of things he’s mastered.<br />A collection of things he’s making time for.</p><a href="#work">See what he’s building ↘</a></div>
  </section>;
}
