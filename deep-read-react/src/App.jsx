import React from 'react';
import { Docket, Progress, DotNav } from './components/Chrome.jsx';
import Reveal from './components/Reveal.jsx';

const STORIES = ['STORY 0001', 'STORY 0002', 'STORY 0003', 'STORY 0004', 'STORY 0005'];

/**
 * The seat form. Prompt 0 keeps a gentle placeholder handler.
 * TODO (Prompt 7): post to the Supabase `join-witness-list` edge function.
 */
function SeatForm() {
  const onSubmit = (e) => {
    e.preventDefault();
    // TODO (Prompt 7): wire to the witness list before launch.
    alert('Connect this form to the witness list before launch.');
  };
  return (
    <form onSubmit={onSubmit}>
      <input type="text" name="name" placeholder="first name" aria-label="First name" autoComplete="given-name" />
      <input type="email" name="email" placeholder="your@email" required aria-label="Email address" autoComplete="email" />
      <button type="submit">Save my seat</button>
    </form>
  );
}

export default function App() {
  return (
    <main>
      <Progress />
      <Docket />
      <DotNav />

      {/* SCENE 1 — the opening */}
      <section className="scene" id="open">
        <div className="inner">
          <Reveal as="span" className="crest"><img src="/crest.jpeg" alt="The Mirror Platform crest" /></Reveal>
          <Reveal as="h1" delay={1}>The Deep Read</Reveal>
          <Reveal className="rule" delay={1} />
          <Reveal as="p" className="billing" delay={2}>
            <span className="l1">Five humans.</span><br />
            <span className="l2">Five machines.</span><br />
            <span className="l3">Five true stories.</span>
          </Reveal>
          <Reveal as="p" className="sub" delay={3}>
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
          <Reveal as="p" className="sub" delay={1}>
            Each of them lived through a moment that changed everything — a turning point.
            You'll hear exactly what happened. But what it <em>meant</em> to them — how it changed them inside —
            stays sealed until the very end. They wrote it down, and a trusted referee is keeping it safe.
          </Reveal>
          <Reveal className="ledger" delay={2} aria-label="The five sealed stories">
            {STORIES.map((no) => (
              <div className="case" key={no}>
                <span className="no">{no}</span>
                <span className="bar" aria-label="kept safe for now" />
                <span className="stamp">SEALED</span>
              </div>
            ))}
          </Reveal>
          <Reveal as="p" className="sub" delay={3} style={{ marginTop: '1.2rem' }}>
            You'll be there when they open.
          </Reveal>
        </div>
      </section>

      {/* SCENE 3 — the readers */}
      <section className="scene" id="sides">
        <div className="inner">
          <Reveal as="span" className="eyebrow">The readers</Reveal>
          <Reveal as="h2">
            <span className="human">People who read people.</span><br />
            <span className="machine">Machines learning to.</span><br />And you.
          </Reveal>
          <Reveal className="fields" delay={1}>
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
          </Reveal>
        </div>
      </section>

      {/* SCENE 4 — how it stays fair */}
      <section className="scene" id="honest">
        <div className="inner">
          <Reveal as="span" className="eyebrow">How it stays fair</Reveal>
          <Reveal as="h2">Built so you never have to take our word for it.</Reveal>
          <Reveal as="p" className="sub" delay={1}>
            A referee everyone can name keeps the sealed answers. Everything hidden is
            time-stamped in public before a single guess is made — so when the seals open, you can check it all
            yourself. Every score, every transcript, every step: open to everyone, free, always.
          </Reveal>
          <Reveal as="p" delay={2}>
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
          <Reveal as="p" className="sub" delay={1}>
            The five share only what they choose, decide every step with us, and can change
            their mind at any point — no questions asked. We wrote our promises to them down and published them
            before we asked anyone to take part, so the five could hold us to every word.
          </Reveal>
          <Reveal as="p" delay={2}>
            <a className="doclink" href="/vow.html">Read our promise</a>
          </Reveal>
        </div>
      </section>

      {/* SCENE 6 — your seat */}
      <section className="scene" id="seat">
        <div className="inner">
          <Reveal as="span" className="eyebrow">There's a seat for you</Reveal>
          <Reveal as="h2">Watch it unfold from the inside.</Reveal>
          <Reveal className="seat" delay={1}>
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
          <Reveal as="p" className="sub" delay={1}>
            When the seals open, these five stories become the first entries in something
            lasting — a careful, growing record of how minds come to understand human change, kept with the
            same care the stories were given.
          </Reveal>
          <Reveal as="p" className="sub" delay={2}>
            It opens after The Deep Read. Some things shouldn't be rushed into existence —
            they should be earned into it, one kept promise at a time.
          </Reveal>
          <Reveal as="p" delay={3}>
            <a className="doclink" href="/institute.html">A first look</a>
          </Reveal>
        </div>
      </section>

      {/* SCENE 8 — the house */}
      <section className="scene" id="house">
        <div className="inner">
          <Reveal as="span" className="crest" style={{ width: 'min(30vw,150px)' }}>
            <img src="/crest.jpeg" alt="The Mirror Platform crest" />
          </Reveal>
          <Reveal as="p" className="attrib" delay={1}>
            Brought to you by<br />
            <a href="/about.html"><strong>A Reflection</strong></a> of <a href="/about.html"><strong>The Mirror Platform</strong></a>
          </Reveal>
          <Reveal className="rule" delay={2} />
          <Reveal as="p" className="sub" delay={2}>
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
  );
}
