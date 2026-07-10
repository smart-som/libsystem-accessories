import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { Category } from "@/lib/types";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Card className="group flex h-full flex-col justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Category</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-slate-900">{category.name}</h3>
        <p className="mt-4 text-sm leading-7 text-slate-600">{category.description}</p>
      </div>
      <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="max-w-xs text-sm text-slate-600">{category.hero}</p>
        <Link
          href={`/shop?category=${category.slug}`}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition group-hover:translate-x-1"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </Card>
  );
}
