"use client";

import { useMotion } from "./motion-experience";
import styles from "./explore-paths.module.css";

const paths = [
  { title: "The curious mind", detail: "Interests, music & a little personality", href: "#curiosity" },
  { title: "The work", detail: "Applications & the thinking behind them", href: "#work" },
  { title: "The conversation", detail: "Skip ahead. Say hello.", href: "#contact" },
];

export function ExplorePaths() {
  const { enabled } = useMotion();
  return <nav className={styles.paths} aria-label="Choose your way through the portfolio">
    <p>Choose your way in <span>Explore at your own pace.</span></p>
    <div>{paths.map(path => <a key={path.href} href={path.href} onClick={event => {
      const target = document.querySelector<HTMLElement>(path.href);
      if (!target) return;
      event.preventDefault();
      const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height ?? 0;
      const coffeeSelector = document.querySelector('.brew-steps');
      const selectorHeight = path.href !== '#curiosity' && coffeeSelector && getComputedStyle(coffeeSelector).position === 'sticky' ? coffeeSelector.getBoundingClientRect().height : 0;
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      window.scrollTo({ top: scrollY + target.getBoundingClientRect().top - headerHeight - selectorHeight - 16, behavior: enabled ? 'smooth' : 'instant' });
    }}><strong>{path.title}<span aria-hidden="true">↗</span></strong><span>{path.detail}</span></a>)}</div>
  </nav>;
}
