import React, { useState } from 'react';
import { Docket, Progress, DotNav } from './components/Chrome.jsx';
import Reveal from './components/Reveal.jsx';
import HeroCrest from './components/HeroCrest.jsx';
import MagneticButton from './components/MagneticButton.jsx';
import { LenisContext } from './motion/LenisContext';
import { useMotionEngine } from './motion/useMotionEngine';
import { prefersReducedMotion } from './motion/reducedMotion';

const STORIES = ['STORY 0001', 'STORY 0002', 'STORY 0003', 'STORY 0004', 'STORY 0005'];

/**
 * The seat form. Real <form> with labels, autocomplete, and Enter-to-submit.
 * On submit it plays the "seal" micro-animation — delight without claiming the
 * form works yet.
 * TODO (Prompt 7): post to the Supabase `join-witness-list` edge function.
 */
function SeatForm() {
  const [sealing, setSealing] = useState(false);
  const onSubmit = (e) => {
    e.preventDefault();
    // TODO (Prompt 7): wire to the witness list before launch.
    if (sealing) return;
    setSealing(true);
    setTimeout(() => setSealing(false), prefersReducedMotion() ? 650 : 1300);
  };
  return (
    <form onSubmit={onSubmit}>
      <input type="text" name="name" placeholder="first name" aria-label="First name" autoComplete="given-name" />
      <input type="email" name="email" placeholder="your@email" required aria-label="Email address" autoComplete="email" />
      <MagneticButton sealing={sealing}>Save my seat</MagneticButton>
    </form>
  );
}

export default function App() {
  const lenis = useMotionEngine();

  return (
    <LenisContext.Provider value={lenis}>
      {/* barely-there gold grain, the fastest parallax layer */}
      <div className="grain" data-parallax="grain" aria-hidden="true" />

      <Progress />
      <Docket />
      <DotNav />

      <main>
        {/* SCENE 1 — the opening */}
        <section className="scene" id="open">
          <div className="glow" data-parallax="glow" aria-hidden="true" />
          <div className="inner">
            <HeroCrest />
            <Reveal as="h1">The Deep Read</Reveal>
            <Reveal className="rule" />
            {/* split-text moment #1 — the billing */}
            <p className="billing" data-split>
              <span className="line-mask"><span className="line l1" data-line>Five humans.</span></span>
              <span className="line-mask"><span className="line l2" data-line>Five machines.</span></span>
              <span className="line-mask"><span className="line l3" data-line>Five true stories.</span></span>
            </p>
            <Reveal as="p" className="sub">
              A first-of-its-kind experiment about something we all wonder:<br />
              how well can anyone really understand what an experience does to a person?
            </Reveal>
          </div>
        </section>

        {/* SCENE 2 — the stories */}
        <section className="scene" id="sealed">
          <div className="inner">
            <Reveal as="span" className="eyebrow">The stories</Reveal>
            <Reveal as="h2">Five people are sharing something rare.</Reveal>
            <Reveal as="p" className="sub">
              Each of them lived through a moment that changed everything — a turning point.
              You'll hear exactly what happened. But what it <em>meant</em> to them — how it changed them inside —
              stays sealed until the very end. They wrote it down, and a trusted referee is keeping it safe.
            </Reveal>
            {/* set piece: bars draw in, stamps press + pulse (see setPieces.js) */}
            <div className="ledger" aria-label="The five sealed stories">
              {STORIES.map((no) => (
                <div className="case" key={no}>
                  <span className="no">{no}</span>
                  <span className="bar" aria-label="kept safe for now" />
                  <span className="stamp">SEALED</span>
                </div>
              ))}
            </div>
            <Reveal as="p" className="sub" style={{ marginTop: '1.2rem' }}>
              You'll be there when they open.
            </Reveal>
          </div>
        </section>

        {/* SCENE 3 — the readers */}
        <section className="scene" id="sides">
          <div className="inner">
            <Reveal as="span" className="eyebrow">The readers</Reveal>
            {/* set piece: gold + steel lines enter from opposite edges and meet */}
            <h2 className="two-corners">
              <span className="human" data-edge="left">People who read people.</span><br />
              <span className="machine" data-edge="right">Machines learning to.</span><br />
              <span data-edge="center">And you.</span>
            </h2>
            <div className="fields">
              <div className="row">
                <span className="k human">The humans</span>
                <span className="v">Five people whose life's work is understanding others — a chance to show what human insight can still do.</span>
              </div>
              <div className="row">
                <span className="k machine">The machines</span>
                <span className="v">Five advocates, each bringing the AI they believe in most, free to give it their best shot — with every word it says shared openly.</span>
              </div>
              <div className="row">
                <span className="k">Everyone else</span>
                <span className="v">That's you. The same questions open to the public, so we all find out together how we compare — to the experts, to the machines, and to each other.</span>
              </div>
              <div className="row">
                <span className="k">Two answers</span>
                <span className="v"><span className="human">Who got it right</span> — measured against what the five actually wrote. And <span className="machine">who made them feel seen</span> — which only the five themselves can say.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SCENE 4 — how it stays fair */}
        <section className="scene" id="honest">
          <div className="inner">
            <Reveal as="span" className="eyebrow">How it stays fair</Reveal>
            <Reveal as="h2">Built so you never have to take our word for it.</Reveal>
            <Reveal as="p" className="sub">
              A referee everyone can name keeps the sealed answers. Everything hidden is
              time-stamped in public before a single guess is made — so when the seals open, you can check it all
              yourself. Every score, every transcript, every step: open to everyone, free, always.
            </Reveal>
            <Reveal as="p">
              <a className="doclink" href="/protocol.html">How it works</a>
              &nbsp; <a className="doclink" href="/seal-log.html">The seal ledger</a>
            </Reveal>
          </div>
        </section>

        {/* SCENE 5 — the promise */}
        <section className="scene" id="vow">
          <div className="inner">
            <Reveal as="span" className="eyebrow">To the five</Reveal>
            <Reveal as="h2">Their stories are gifts. We treat them that way.</Reveal>
            <Reveal as="p" className="sub">
              The five share only what they choose, decide every step with us, and can change
              their mind at any point — no questions asked. We wrote our promises to them down and published them
              before we asked anyone to take part, so the five could hold us to every word.
            </Reveal>
            <Reveal as="p">
              <a className="doclink" href="/vow.html">Read our promise</a>
            </Reveal>
          </div>
        </section>

        {/* SCENE 6 — your seat */}
        <section className="scene" id="seat">
          <div className="inner">
            <Reveal as="span" className="eyebrow">There's a seat for you</Reveal>
            <Reveal as="h2">Watch it unfold from the inside.</Reveal>
            <Reveal className="seat">
              {/* set piece: the border draws itself as the scene enters */}
              <svg className="seat-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <rect x="0.6" y="0.6" width="98.8" height="98.8" pathLength="100" vectorEffect="non-scaling-stroke" />
              </svg>
              <p className="sub">
                Play along with the public round. Try to tell the humans from the machines.
                Be there the moment the seals open. We'll write only when something real happens —
                when the readers are revealed, when the stories open, and on the day of the answer.
              </p>
              <SeatForm />
            </Reveal>
          </div>
        </section>

        {/* SCENE 7 — what comes after */}
        <section className="scene" id="institute">
          <div className="inner">
            <Reveal as="span" className="eyebrow">What comes after</Reveal>
            <Reveal as="h2">The Human Atlas Institute</Reveal>
            <Reveal as="p" className="sub">
              When the seals open, these five stories become the first entries in something
              lasting — a careful, growing record of how minds come to understand human change, kept with the
              same care the stories were given.
            </Reveal>
            <Reveal as="p" className="sub">
              It opens after The Deep Read. Some things shouldn't be rushed into existence —
              they should be earned into it, one kept promise at a time.
            </Reveal>
            <Reveal as="p">
              <a className="doclink" href="/institute.html">A first look</a>
            </Reveal>
          </div>
        </section>

        {/* SCENE 8 — the house */}
        <section className="scene" id="house">
          <div className="inner">
            <Reveal as="span" className="crest" data-parallax="crest" style={{ width: 'min(30vw,150px)' }}>
              <img src="/crest.jpeg" alt="The Mirror Platform crest" />
            </Reveal>
            {/* split-text moment #2 — the closing attribution */}
            <p className="attrib" data-split>
              <span className="line-mask"><span className="line" data-line>Brought to you by</span></span>
              <span className="line-mask"><span className="line" data-line>
                <a href="/about.html"><strong>A Reflection</strong></a> of <a href="/about.html"><strong>The Mirror Platform</strong></a>
              </span></span>
            </p>
            <Reveal className="rule" />
            <Reveal as="p" className="sub">
              The story of who we are, and why the work is signed this way<br />
              <a href="/about.html">is here whenever you're curious</a>.
            </Reveal>
          </div>
        </section>

        <footer className="fin">
          <span>THE DEEP READ · BROUGHT TO YOU BY A REFLECTION OF THE MIRROR PLATFORM ·{' '}
            <a href="/protocol.html">HOW IT WORKS</a> · <a href="/vow.html">OUR PROMISE</a> ·{' '}
            <a href="/seal-log.html">SEAL LEDGER</a> · <a href="/about.html">ABOUT</a></span>
        </footer>
      </main>
    </LenisContext.Provider>
  );
}
