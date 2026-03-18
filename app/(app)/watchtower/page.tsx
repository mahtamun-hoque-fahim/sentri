import { Suspense } from "react";
import WatchtowerContent from "./WatchtowerContent";
import Header from "@/components/layout/Header";

export default function WatchtowerPage() {
  return (
    <>
      <Header title="Watchtower" showSearch={false} />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center text-sentri-sub text-sm">
          Scanning vault…
        </div>
      }>
        <WatchtowerContent />
      </Suspense>
    </>
  );
}
