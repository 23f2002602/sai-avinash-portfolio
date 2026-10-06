"use client";

import { useEffect, useState } from "react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const range = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(range > 0 ? (window.scrollY / range) * 100 : 0);
        const links = [...document.querySelectorAll<HTMLAnchorElement>('.site-header nav a')];
        const line = (document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0) + innerHeight * .25;
        let active: HTMLAnchorElement | undefined;
        for (const link of links) {
          const section = document.querySelector(link.hash);
          if (section && section.getBoundingClientRect().top <= line) active = link;
        }
        links.forEach(link => { if (link === active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return <div className="scroll-progress" style={{ width: `${progress}%` }} aria-hidden="true" />;
}
