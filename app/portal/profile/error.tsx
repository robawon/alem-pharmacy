"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

export default function CustomerProfileError() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-4 p-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <h1 className="text-2xl font-semibold text-foreground">Error Loading Profile</h1>
      <p className="text-muted text-center max-w-md">
        There was an issue loading your profile. Please try again.
      </p>
      <div className="flex gap-3 pt-4">
        <Button onClick={() => router.back()}>Go Back</Button>
        <Button variant="outline" onClick={() => router.push("/portal")}>
          Return to Portal
        </Button>
      </div>
    </div>
  );
}
