import { FieldNotes } from "@/components/field-notes";
import { ReelsSection } from "@/components/reels-section";
import { ScrollProgress } from "@/components/scroll-progress";
import { AvinashStory } from "@/components/avinash-story";
import { MotionExperience, MotionToggle } from "@/components/motion-experience";
import { ProjectGallery } from "@/components/project-gallery";
import { CuriosityAtlas } from "@/components/curiosity-atlas";
import { CoffeeJourney } from "@/components/coffee-journey";
import {
  experience,
  leadership,
  navigation,
  profile,
  skills,
  socials,
} from "@/lib/content";

function ChapterLabel({ number, name }: { number: string; name: string }) {
  return (
    <div className="chapter-label" data-number={number}>
      <span className="micro">Chapter {number} / 06</span>
      <span className="micro">{name}</span>
    </div>
  );
}

export default function Home() {
  return (
    <MotionExperience>
      <a className="skip-link" href="#about">Skip to content</a>
      <ScrollProgress />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sai Avinash, back to top">avinash<span className="brand-dot">.</span></a>
        <nav aria-label="Main navigation">
          {navigation.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>
        <MotionToggle />
        <a className="mobile-explore" href="#about">Explore <span aria-hidden="true">↓</span></a>
        <a className="header-contact" href={`mailto:${profile.email}`}>Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </header>

      <main id="top">
        <div className="coke-act">
        <AvinashStory />

        <div className="story-strip" aria-hidden="true">
          <div className="story-marquee">{[0, 1].map(copy => <div key={copy}><span>People</span><b>✳</b><span>Systems</span><b>✳</b><span>Stories</span><b>✳</b><span>Always in motion</span><b>✳</b></div>)}</div>
        </div>

        <CuriosityAtlas />

        <section className="chapter about-section" id="about" aria-labelledby="about-title">
          <ChapterLabel number="01" name="The Observer" />
          <div className="about-top">
            <div>
              <p className="section-eyebrow">Every story starts with someone</p>
              <h2 id="about-title">Still learning.<br /><em>Still doing.</em></h2>
            </div>
            <div className="about-copy">
              <p className="large-copy">Avinash wants to be a polymath. For now, he’s following his curiosity and putting in the practice.</p>
              <p>{profile.about}</p>
              <div className="text-link-row">
                <a href="/Sai_Avinash_Resume.pdf" download>Download résumé <span aria-hidden="true">↗</span></a>
                <span className="micro">{profile.degree}</span>
              </div>
            </div>
          </div>
          <div className="notes-heading">
            <span className="micro">Getting to know him / six small truths</span>
            <span className="micro">Tap a card to read more ↓</span>
          </div>
          <FieldNotes />
        </section>

        <section className="chapter experience-section" id="experience" aria-labelledby="experience-title">
          <ChapterLabel number="02" name="The Operator" />
          <div className="section-split-heading">
            <h2 id="experience-title">His questions<br /><em>left the classroom.</em></h2>
            <p>Working with startups brought him into conversations with clients, teams, and founders. Here&apos;s where that journey has taken him.</p>
          </div>
          <div className="experience-list">
            {experience.map((item) => (
              <article className="experience-row" key={item.organization}>
                <span className="experience-index micro">{item.index} / {item.dates}</span>
                <div className="experience-main"><h3>{item.organization}</h3><p>{item.role}</p></div>
                <div className="experience-summary"><p>{item.summary}</p><span className="micro">{item.location}</span></div>
              </article>
            ))}
          </div>
        </section>

        </div>
        <div className="drink-handoff" id="coffee">
          <p className="micro">Act II / From a little fizz to a slower ritual</p>
          <h2>That hit the spot.<br />Now, <em>let’s make coffee.</em></h2>
          <p>Also a coffee addict. Some things need a little more time.<br />The next few chapters come with a cup in the making.</p>
          <a href="#work">Follow the brew <span aria-hidden="true">↓</span></a>
          <span className="handoff-mark" aria-hidden="true">fizz<br /><i>to foam.</i></span>
        </div>
        <CoffeeJourney>
        <section className="chapter work-section" id="work" aria-labelledby="work-title" data-coffee-step="0">
          <ChapterLabel number="03" name="The Builder" />
          <div className="work-heading">
            <div><p className="section-eyebrow">Ideas became projects</p><h2 id="work-title">So he started<br /><em>building things.</em></h2></div>
            <p>He explores what software can do for assessment, placements, presentations, and agriculture. These projects are part of that exploration.</p>
          </div>
          <div data-coffee-step="1"><ProjectGallery /></div>
          <a className="all-work-link" data-coffee-step="2" href="https://github.com/23f2002602" target="_blank" rel="noopener noreferrer">See the full GitHub archive <span aria-hidden="true">↗</span></a>
        </section>

        <section className="chapter leadership-section" id="leadership" aria-labelledby="leadership-title" data-coffee-step="3">
          <ChapterLabel number="04" name="The Connector" />
          <div className="leadership-layout">
            <div className="leadership-photo-wrap">
              <img src="/avinash-iitm.jpg" alt="Sai Avinash seated at a podium at IIT Madras" width="900" height="1600" loading="lazy" />
              <span className="micro">Fig. 02 — On campus, IIT Madras</span>
            </div>
            <div className="leadership-copy">
              <p className="section-eyebrow">Meanwhile, on campus</p>
              <h2 id="leadership-title">He found his<br /><em>people, too.</em></h2>
              <p className="leadership-intro">Away from his projects, Avinash took on roles in student communities, research societies, and content teams. Listening and leading became part of his story.</p>
              <div className="leadership-list">
                {leadership.map((item) => (
                  <div className="leadership-item" key={item.role + item.organization}>
                    <span className="micro">{item.dates}</span>
                    <div><strong>{item.role}</strong><span>{item.organization}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="skills-block">
            <div><p className="section-eyebrow">Things he picked up along the way</p><h3>A growing toolkit.</h3></div>
            <div className="skills-grid">
              {skills.map((group) => (
                <div className="skill-group" key={group.label}>
                  <h4>{group.label}</h4>
                  <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div data-coffee-step="4"><ReelsSection /></div>

        <section className="chapter contact-section" id="contact" aria-labelledby="contact-title" data-coffee-step="5">
          <ChapterLabel number="06" name="The Next Chapter" />
          <div className="contact-main">
            <p className="section-eyebrow">This is where you come in</p>
            <h2 id="contact-title">His next chapter<br /><em>is still unwritten.</em></h2>
            <p>Avinash is exploring opportunities in strategy, startup operations, founder&apos;s office work, and technology. Have something in mind? Say hello.</p>
            <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<span aria-hidden="true">↗</span></a>
          </div>
          <div className="contact-bottom">
            <div><span className="micro">Call</span><a href="tel:+918143436333">{profile.phone}</a></div>
            <div><span className="micro">Read</span><a href="/Sai_Avinash_Resume.pdf" download>Download résumé ↗</a></div>
            <div><span className="micro">Follow his story</span><div className="social-grid">{socials.map((social) => <a key={social.href} href={social.href} target="_blank" rel="noopener noreferrer">{social.label} ↗</a>)}</div></div>
          </div>
        </section>
        </CoffeeJourney>
      </main>
      <footer className="site-footer"><span>© {new Date().getFullYear()} Sai Avinash</span><span>Built with curiosity, from Chennai.</span><a href="#top">Back to top ↑</a></footer>
    </MotionExperience>
  );
}
