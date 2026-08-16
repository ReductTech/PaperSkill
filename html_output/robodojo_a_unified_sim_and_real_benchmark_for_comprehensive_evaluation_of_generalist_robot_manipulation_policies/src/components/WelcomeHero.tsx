export function WelcomeHero({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="welcome-hero" aria-label="RoboDojo welcome">
      <video className="welcome-video" src="/images/robodojo/videos/hero.mp4" autoPlay muted loop playsInline />
      <div className="welcome-shade" />
      <div className="welcome-panel">
        <p className="welcome-kicker">Scaling the Himalayas of Manipulation</p>
        <h1>RoboDojo</h1>
        <p className="welcome-subtitle">Simulation-and-Real Unified Benchmark</p>
        <button className="welcome-button" onClick={onEnter}>
          Learn more <span>→</span>
        </button>
      </div>
    </section>
  );
}

