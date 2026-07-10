"use client";

import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";

export function AdminSignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Button
      variant="secondary"
      size="sm"
      className={cn(className)}
      disabled={isSubmitting}
      onClick={async () => {
        setIsSubmitting(true);

        try {
          const auth = getFirebaseBrowserAuth();

          if (auth) {
            await signOut(auth).catch(() => undefined);
          }

          await fetch("/api/auth/session", { method: "DELETE" });
          router.push("/admin-login");
          router.refresh();
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <LogOut className="h-4 w-4" />
      {isSubmitting ? "Signing out..." : "Log out"}
    </Button>
  );
}
