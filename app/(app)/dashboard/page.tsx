import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center text-sentri-sub text-sm">
        Loading vault…
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
