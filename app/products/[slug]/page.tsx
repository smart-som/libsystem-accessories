import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Star, Truck } from "lucide-react";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getShippingZones, getStorefrontProducts } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const products = await getStorefrontProducts();
  const product = products.find((entry) => entry.slug === slug);

  if (!product) {
    notFound();
  }

  const shippingZones = getShippingZones();
  const relatedProducts = products
    .filter((entry) => entry.categoryId === product.categoryId && entry.id !== product.id)
    .slice(0, 4);
  const defaultVariant = product.variants[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="space-y-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] border border-slate-200">
            <Image src={product.images[0].url} alt={product.images[0].alt} fill className="object-cover" />
          </div>
          <Card>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Key specs</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {product.specs.map((spec) => (
                <div key={spec.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{spec.label}</p>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{spec.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Badge>{product.tags[0]}</Badge>
          <div>
            <h1 className="font-display text-5xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
              {product.rating} from {product.reviewCount} reviews
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              {product.variants.reduce((total, variant) => total + variant.stockQuantity, 0)} units in stock
            </div>
          </div>

          <Card className="space-y-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Price</p>
                <p className="mt-2 font-display text-4xl font-semibold text-slate-900">{formatCurrency(defaultVariant.price)}</p>
              </div>
              <div className="rounded-3xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-600">
                Popular choice for everyday use
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {product.variants.map((variant) => (
                <div key={variant.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{variant.name}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    {Object.entries(variant.attributes)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" | ")}
                  </p>
                  <p className="mt-3 text-sm text-slate-700">{formatCurrency(variant.price)}</p>
                  <div className="mt-4">
                    <AddToCartButton productId={product.id} variantId={variant.id} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-sky-500" />
                  <p className="font-semibold text-slate-900">Delivery zones</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  {shippingZones.map((zone) => (
                    <p key={zone.id}>
                      {zone.name}: {formatCurrency(zone.fee)} - {zone.eta}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-sky-500" />
                  <p className="font-semibold text-slate-900">Compatibility</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.compatibility?.map((entry) => (
                    <span key={entry} className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                      {entry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <section className="mt-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Related picks</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">Keep the basket moving</h2>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-slate-900">
            Back to shop
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((entry) => (
            <ProductCard key={entry.id} product={entry} />
          ))}
        </div>
      </section>
    </div>
  );
}
