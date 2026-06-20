import { AccountSubpageFrame } from "./AccountSubpageFrame";

export function HelpClient() {
  return (
    <AccountSubpageFrame
      eyebrow="Help"
      title="How picking works"
      lead="Your personal lab store — browse, queue items, and request a floor pick."
      pills={["No purchase", "Pick list", "Live stock"]}
    >
      <section className="store-row account-panel product-panel help-content">
        <h2>Request a pick</h2>
        <ol>
          <li>Browse and add items to your <strong>pick list</strong> — no account needed.</li>
          <li>When you&apos;re ready, <strong>sign in</strong> and open your pick list.</li>
          <li>Choose standard or rush pick, then send the request to the floor.</li>
        </ol>

        <h2>Track your picks</h2>
        <p>
          Open <strong>Your picks</strong> from the account menu to see pick status. New requests show as{" "}
          <em>Preparing</em> right after you send them.
        </p>

        <h2>Stock & availability</h2>
        <p>
          Products shown are on your shelf now. If something runs out before you pick, refresh and try again.
        </p>
      </section>
    </AccountSubpageFrame>
  );
}
