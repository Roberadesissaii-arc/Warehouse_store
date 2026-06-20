export function AccountSubpageFrame({
  eyebrow,
  title,
  lead,
  pills,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  pills?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="store-account">
      <section className="hero" aria-labelledby="account-page-title">
        <div className="hero-inner">
          <p className="hero-eyebrow">{eyebrow}</p>
          <h1 id="account-page-title">{title}</h1>
          {lead ? <div className="hero-lead">{lead}</div> : null}
          {pills?.length ? (
            <div className="hero-pills">
              {pills.map((pill) => (
                <span key={pill} className="pill">
                  {pill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>
      <div className="shop-section account-subpage-body">{children}</div>
    </div>
  );
}
