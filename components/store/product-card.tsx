import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const defaultVariant = product.variants[0];

  return (
    <Card className="group flex h-full flex-col overflow-hidden p-0">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={product.images[0].url}
          alt={product.images[0].alt}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          {product.featured ? <Badge>Featured</Badge> : null}
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700">
            {product.variants.reduce((total, variant) => total + variant.stockQuantity, 0)} in stock
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-slate-900">{product.name}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{product.shortDescription}</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
            <Star className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
            {product.rating}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Starting from</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(defaultVariant.price)}</p>
            </div>
            <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-sky-600">
              View details
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
          <AddToCartButton productId={product.id} variantId={defaultVariant.id} />
        </div>
      </div>
    </Card>
  );
}
