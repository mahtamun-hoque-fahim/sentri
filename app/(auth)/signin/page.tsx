import { Suspense } from "react";
import SigninForm from "./SigninForm";

export default function SigninPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen vault-pattern flex items-center justify-center">
        <div className="text-sentri-sub text-sm">Loading…</div>
      </div>
    }>
      <SigninForm />
    </Suspense>
  );
}
