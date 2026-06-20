import { Suspense } from "react";
import { SignInClient } from "@/components/auth/SignInClient";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="sign-in-page"><div className="sign-in-loading"><p>Loading…</p></div></div>}>
      <SignInClient />
    </Suspense>
  );
}
