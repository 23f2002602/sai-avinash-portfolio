"use client";

import { useEffect, useRef, useState } from "react";
import { projects } from "@/lib/content";
import { InkDrawing } from "./ink-drawing";

const details = [
  { category: "AI", question: "What if assessments captured more than a score?", steps: ["Structured responses", "AI evaluation", "Qualitative reports"], text: "InternAssess combines audio responses, structured questions, and an admin dashboard. It explores how AI can help organize candidate assessments into useful reports." },
  { category: "Full stack", question: "How do you bring a placement process into one place?", steps: ["Students & companies", "Placement drives", "Admin workflows"], text: "PlaceMe connects student, company, and administrator workflows. A Flask API and Vue interface support the portal, with background tasks for reminders, reports, and exports." },
  { category: "AI", question: "Could a block of text become a presentation?", steps: ["Text + a template", "Generate slides", "Download a deck"], text: "Gyaan Deck takes long text and a presentation template, then creates a downloadable PowerPoint file. Users can add guidance and use their own supported model API key." },
  { category: "AI", question: "How could data support a farmer’s next decision?", steps: ["Soil & weather", "Recommendations", "Farmer guidance"], text: "This crop advisory concept brings crop recommendations, pest detection, market insights, and multilingual guidance into one application." },
];

export function ProjectGallery() {
  const [filter, setFilter] = useState("All work");
  const [selected, setSelected] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
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
      {['All work', 'AI', 'Full stack'].map(item => <button type="button" aria-pressed={filter === item} key={item} onClick={() => setFilter(item)}>{item}<span aria-hidden="true">↗</span></button>)}
    </div>
    <div className="projects-grid">
      {projects.map((project, index) => (filter === "All work" || details[index].category === filter) &&
        <article className={`project-card ${project.kind}`} key={project.title} data-coffee-step={index === 2 ? "2" : undefined}>
          <div className="project-top"><span className="micro">{project.number} / {project.eyebrow}</span><span aria-hidden="true">↗</span></div>
          <div className="project-sketch"><InkDrawing kind={(['assessment', 'placement', 'slides', 'crop'] as const)[index]} compact /></div>
          <div className="project-body"><h3>{project.title}</h3><p>{project.description}</p></div>
          <div className="project-bottom">
            <div className="tag-list">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
            <button type="button" className="project-explore" aria-haspopup="dialog" onClick={event => { trigger.current = event.currentTarget; setSelected(index); }}>Explore <span aria-hidden="true">↗</span><span className="sr-only"> {project.title}</span></button>
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
        <p className="dialog-description">{details[selected].text}</p>
        <div className="dialog-links"><a href={projects[selected].href} target="_blank" rel="noopener noreferrer">Explore the repository ↗</a>{projects[selected].live && <a href={projects[selected].live} target="_blank" rel="noopener noreferrer">Open live project ↗</a>}</div>
      </>}
    </dialog>
  </>;
}
