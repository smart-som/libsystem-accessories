import Image from "next/image";
import Link from "next/link";

import { ProductCard } from "@/components/store/product-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStoreContext } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const store = getStoreContext();
  const heroSpotlight = store.featuredProducts[0] ?? store.products[0];

  return (
    <div className="pb-16">
      <section className="border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-slate-50">
            <div className="grid items-center gap-8 lg:grid-cols-[0.88fr,1.12fr]">
              <div className="px-5 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-12">
                <Badge>New in store</Badge>
                <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:mt-5 sm:text-5xl lg:text-6xl">
                  Shop everyday tech and home essentials in one clean storefront.
                </h1>
                <p className="mt-4 max-w-lg text-sm leading-7 text-slate-600 sm:mt-5 sm:text-lg sm:leading-8">
                  Browse phone accessories, workstation gear, gaming picks, and compact appliances with clear pricing and a faster path to checkout.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/shop" className={cn(buttonVariants({ size: "lg" }))}>
                    Shop all products
                  </Link>
                  <Link href={`/products/${heroSpotlight.slug}`} className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
                    View featured item
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-600">
                  <span>Featured: {heroSpotlight.name}</span>
                  <span>From {formatCurrency(heroSpotlight.variants[0]?.price ?? heroSpotlight.basePrice)}</span>
                </div>
              </div>

              <Link href={`/products/${heroSpotlight.slug}`} className="group block border-t border-slate-200 lg:border-l lg:border-t-0">
                <div className="relative min-h-[320px] bg-white sm:min-h-[420px]">
                  <Image
                    src={heroSpotlight.images[0].url}
                    alt={heroSpotlight.images[0].alt}
                    fill
                    loading="eager"
                    sizes="(min-width: 1024px) 56vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Featured now</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">Popular products customers can buy right away</h2>
          </div>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            A focused catalog with the products people usually come looking for first.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {store.featuredProducts.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] border-slate-200 bg-slate-50">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Simple shopping</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">Everything stays focused on products and checkout</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Customers should be able to browse quickly, compare options clearly, and move from product discovery to payment without distractions.
            </p>
            <Link href="/shop" className={cn(buttonVariants({ variant: "secondary" }), "mt-6 inline-flex")}>
              Continue shopping
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: "Fast checkout", copy: "Customers can move from cart to order quickly." },
              { title: "Clear categories", copy: "Phones, computers, gaming, and home are easy to browse." },
              { title: "Order tracking", copy: "Returning customers can follow their purchases easily." },
            ].map((item) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-white p-5">
                <p className="font-display text-2xl font-semibold text-slate-900">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
