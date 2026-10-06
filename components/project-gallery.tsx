"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/content";
import { InkDrawing } from "./ink-drawing";
import { projectWalkthroughs } from "@/lib/project-walkthroughs";
import styles from "./project-gallery.module.css";

const details = [
  { category: "AI", question: "What if assessments captured more than a score?", steps: ["Structured responses", "AI evaluation", "Qualitative reports"], text: "InternAssess gives candidates a structured assessment with audio responses and browser controls. AI evaluates their responses and generates qualitative reports for administrators to review in a dashboard." },
  { category: "Full stack", question: "How do you bring a placement process into one place?", steps: ["Students & companies", "Placement drives", "Admin workflows"], text: "PlaceMe connects student, company, and administrator workflows. A Flask API and Vue interface support the portal, with background tasks for reminders, reports, and exports." },
  { category: "Web apps", question: "How do you give pre-owned goods a second life?", steps: ["Create a listing", "Search & filter", "Add to cart"], text: "Avinash worked with Team185 on a second-hand marketplace for the Odoo Hackathon. Sellers create, edit, and delete listings with images, descriptions, categories, and rupee prices. Buyers browse product details, search by keyword, filter by category, and add items to a cart with a running total. The prototype stores data in local storage and uses simulated authentication." },
  { category: "AI", question: "How could data support a farmer’s next decision?", steps: ["Soil & weather", "Recommendations", "Farmer guidance"], text: "This crop advisory concept brings crop recommendations, pest detection, market insights, and multilingual guidance into one application." },
];

export function ProjectGallery() {
  const [filter, setFilter] = useState("All work");
  const [selected, setSelected] = useState<number | null>(null);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const selectedProject = selected === null ? null : projects[selected];
  const liveUrl = selectedProject && "live" in selectedProject && typeof selectedProject.live === "string" ? selectedProject.live : undefined;
  useEffect(() => {
    if (selected === null) return;
    const el = dialog.current;
    el?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { el?.close(); document.body.style.overflow = overflow; trigger.current?.focus({ preventScroll: true }); };
  }, [selected]);

  return <>
    <div className="project-filter" aria-label="Filter projects">
      <span className="micro">Choose a thread</span>
      {['All work', 'AI', 'Full stack', 'Web apps'].map(item => <button type="button" aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>{item}<span aria-hidden="true">↗</span></button>)}
    </div>
    <div className="projects-grid">
      {projects.map((project, index) => (filter === "All work" || details[index].category === filter) &&
        <article className={`project-card ${project.kind}`} key={project.title}>
          <div className="project-top"><span className="micro">{project.number} / {project.eyebrow}</span><span aria-hidden="true">↗</span></div>
          <div className="project-sketch"><InkDrawing kind={(['assessment', 'placement', 'marketplace', 'crop'] as const)[index]} compact /></div>
          <div className="project-body"><h3>{project.title}</h3><p>{project.description}</p></div>
          <div className="project-bottom">
            <div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <button type="button" className="project-explore" aria-haspopup="dialog" onClick={event => { trigger.current = event.currentTarget; setWalkthroughStep(0); setSelected(index); }}>Explore <span aria-hidden="true">↗</span><span className="sr-only"> {project.title}</span></button>
          </div>
          <a className="project-source" href={project.href} target="_blank" rel="noopener noreferrer">View source ↗</a>
        </article>
      )}
    </div>
    <p className="sr-only" role="status">{filter === 'All work' ? projects.length : details.filter(detail => detail.category === filter).length} projects shown</p>
    <dialog ref={dialog} className="project-dialog" aria-labelledby="project-dialog-title" onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) setSelected(null); } }}>
      {selected !== null && <>
        <div className="dialog-top"><span className="micro">Inside the project / {projects[selected].number}</span><button type="button" onClick={() => setSelected(null)} aria-label="Close project details" autoFocus>×</button></div>
        <h2 id="project-dialog-title">{projects[selected].title}</h2>
        <p className="project-question">{details[selected].question}</p>
        <div className="project-flow" aria-label="How the project works">{details[selected].steps.map((step, index) => <div key={step}><span className="micro">0{index + 1}</span><strong>{step}</strong><span className="flow-dot" aria-hidden="true" /></div>)}</div>
        <section className={styles.walkthrough} aria-label="Guided project walkthrough">
          <p>Explore the workflow <span>Explanation · not a live demo</span></p>
          <div className={styles.steps}>{details[selected].steps.map((step, index) => <button type="button" key={step} aria-pressed={walkthroughStep === index} aria-controls="walkthrough-detail" onClick={() => setWalkthroughStep(index)}>{index + 1}. {step}</button>)}</div>
          <div id="walkthrough-detail" className={styles.detail} aria-live="polite"><span>Step {walkthroughStep + 1} / 3</span><h3>{details[selected].steps[walkthroughStep]}</h3><p>{projectWalkthroughs[selected][walkthroughStep]}</p></div>
          <div className={styles.controls}><button type="button" disabled={walkthroughStep === 0} onClick={() => setWalkthroughStep(walkthroughStep - 1)}>← Previous</button><button type="button" disabled={walkthroughStep === 2} onClick={() => setWalkthroughStep(walkthroughStep + 1)}>Next step →</button></div>
        </section>
        <p className="dialog-description">{details[selected].text}</p>
        <div className="dialog-links"><a href={projects[selected].href} target="_blank" rel="noopener noreferrer">Explore the repository ↗</a>{liveUrl && <a href={liveUrl} target="_blank" rel="noopener noreferrer">Open live project ↗</a>}</div>
      </>}
    </dialog>
  </>;
}
