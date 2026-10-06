import Image from "next/image";
import styles from "./photo-hero.module.css";

export function PhotoHero() {
  return <section className={styles.hero} data-photo-hero aria-labelledby="intro-title">
    <div className={styles.inner}>
      <div className={styles.copy}>
        <p className={`micro ${styles.kicker}`}>Sai Avinash / Chennai</p>
        <h1 id="intro-title">This is<br /><em>Avinash.</em></h1>
        <p className={styles.caption}>An aspiring polymath, learning by doing. He’s into tech, business, and making things—with plenty still to figure out.</p>
        <div className={styles.links}><a href="#story">A little of his story <span aria-hidden="true">↓</span></a><a href="#work">Explore his work <span aria-hidden="true">↗</span></a></div>
        <p className={`micro ${styles.footnote}`}>Curious mind. Work in progress.</p>
      </div>
      <figure className={styles.portrait}>
        <Image src="/avinash-portrait.jpg" alt="Sai Avinash wearing his navy jacket and glasses" width={1080} height={1920} sizes="(max-width: 760px) 90vw, 45vw" preload />
        <figcaption>A guy called Avinash. <span>His story so far.</span></figcaption>
      </figure>
    </div>
  </section>;
}
