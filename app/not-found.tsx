import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">404</p>
        <h1 className="mt-4 font-display text-5xl font-semibold text-slate-900">That page is off the shelf</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          The product or route you tried to reach could not be found. The catalog is still available below.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/shop" className={cn(buttonVariants())}>
            Return to shop
          </Link>
        </div>
      </Card>
    </div>
  );
}
