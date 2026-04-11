"use client";

import { useState } from "react";
import ChoiceScreen from "./ChoiceScreen";
import ReviewForm from "./ReviewForm";
import ComplaintForm from "./ComplaintForm";
import { ScanData } from "./ComplaintForm";

type View = "choice" | "good" | "complaint";

export default function ScanPageClient({ data }: { data: ScanData }) {
  const [view, setView] = useState<View>("choice");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {view === "choice" && (
        <ChoiceScreen
          data={data}
          onGoodReview={() => setView("good")}
          onComplaint={() => setView("complaint")}
        />
      )}
      {view === "good" && (
        <ReviewForm
          data={data}
          onBack={() => setView("choice")}
        />
      )}
      {view === "complaint" && (
        <ComplaintForm
          data={data}
          onBack={() => setView("choice")}
        />
      )}
    </div>
  );
}
