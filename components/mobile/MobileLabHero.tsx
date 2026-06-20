export function MobileLabHero({
  eyebrow,
  title,
  lead,
  badge = "Lab",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="m-lab-hero">
      <div className="m-lab-hero-top">
        <p className="m-lab-hero-eyebrow">{eyebrow}</p>
        <span className="m-lab-hero-badge">{badge}</span>
      </div>
      <h1>{title}</h1>
      {lead ? <div className="m-lab-hero-lead">{lead}</div> : null}
      <div className="m-lab-hero-dot" aria-hidden />
    </div>
  );
}
