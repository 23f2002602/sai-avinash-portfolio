const words = ["AVINASH", "QUESTION", "PEOPLE", "MAKE", "BEYOND", "NEXT"];

/** Decorative poster typography and drawn marks; narrative stays in the foreground. */
export function PosterLayers({ scene }: { scene: number }) {
  return <div className="poster-layers" aria-hidden="true">
    <div className="poster-word" key={scene}>{words[scene]}</div>
    <div className="poster-rail"><span>PEOPLE / SYSTEMS / STORIES</span><span>PEOPLE / SYSTEMS / STORIES</span></div>
    <svg className="poster-star" viewBox="0 0 140 140" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M68 5L76 48L110 17L91 57L137 49L98 73L130 104L87 91L91 136L70 102L43 135L49 92L6 104L42 74L4 49L49 54L28 15L61 46Z" />
      <path d="M63 60Q80 49 83 70Q83 84 65 81Q53 76 63 60" />
    </svg>
    <svg className="poster-scribble" viewBox="0 0 390 190" fill="none" stroke="currentColor" strokeWidth="2">
      <path pathLength="1" d="M28 99C75 6 335 24 363 91S81 176 32 118S311 6 350 74S204 170 111 154M254 174Q329 162 371 129M348 125L375 127L362 149" />
    </svg>
    <div className="poster-stamp"><span>A STORY</span><strong>IN<br />PROGRESS</strong><span>CHENNAI, INDIA</span></div>
    <span className="poster-registration">+<br />+</span>
  </div>;
}
