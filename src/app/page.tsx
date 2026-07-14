const foundationItems = [
  "MVP scope and domain boundaries",
  "Next.js and strict TypeScript baseline",
  "Supabase environment contract",
  "Database and RLS plan",
  "Responsive application shell",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">FA BUSINESS OS</p>
        <h1>Build the system that decides what matters next.</h1>
        <p className="hero-copy">
          Phase 0 establishes the technical and product foundation for a focused,
          revenue-oriented personal business operating system.
        </p>

        <div className="status-row">
          <span className="status-dot" aria-hidden="true" />
          <span>Phase 0 — Foundation in progress</span>
        </div>

        <ul className="foundation-list">
          {foundationItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
