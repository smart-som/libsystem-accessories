"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentMethod, Product, WalkInSale } from "@/lib/types";

type WalkInSalesResponse = {
  sales: WalkInSale[];
  products: Product[];
  message?: string;
};

type DraftWalkInSaleLine = {
  variantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
};

function getFirstAvailableVariantId(products: Product[]) {
  for (const product of products) {
    const variant = product.variants.find((entry) => entry.stockQuantity > 0);
    if (variant) {
      return variant.id;
    }
  }

  return "";
}

export function WalkInSalesPanel({ products: initialProducts, sales: initialSales }: { products: Product[]; sales: WalkInSale[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [sales, setSales] = useState(initialSales);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(getFirstAvailableVariantId(initialProducts));
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [draftLines, setDraftLines] = useState<DraftWalkInSaleLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const selectedProductVariant = (() => {
    for (const product of products) {
      const variant = product.variants.find((entry) => entry.id === selectedVariantId);
      if (variant) {
        return { product, variant };
      }
    }
    return null;
  })();

  const reservedQuantityForSelectedVariant = draftLines
    .filter((line) => line.variantId === selectedVariantId)
    .reduce((total, line) => total + line.quantity, 0);
  const selectedStock = Math.max((selectedProductVariant?.variant.stockQuantity ?? 0) - reservedQuantityForSelectedVariant, 0);
  const draftSaleTotal = draftLines.reduce((total, line) => total + line.unitPrice * line.quantity, 0);

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setDraftLines([]);
    setQuantity("1");
    setUnitPrice("");
    setPaymentMethod("cash");
  };

  const resetLineInputs = (nextProducts: Product[] = products) => {
    setSelectedVariantId(getFirstAvailableVariantId(nextProducts));
    setQuantity("1");
    setUnitPrice("");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Staff tool</p>
        <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Record walk-in sale</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--admin-muted)]">
          Each saved walk-in sale now deducts stock from catalog inventory immediately, so product availability and sales reporting stay aligned.
        </p>
        {message ? (
          <div className="mt-5 border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-3 text-sm text-[var(--admin-text)]">
            {message.text}
          </div>
        ) : null}
        <form
          className="mt-6 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setIsSaving(true);
            setMessage(null);

            try {
              if (draftLines.length === 0) {
                throw new Error("Add at least one product before saving this walk-in sale.");
              }

              const response = await fetch("/api/admin/walk-in-sales", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  customerName,
                  customerPhone,
                  paymentMethod,
                  lines: draftLines.map((line) => ({
                    variantId: line.variantId,
                    quantity: line.quantity,
                    unitPrice: line.unitPrice,
                  })),
                }),
              });

              const payload = (await response.json()) as WalkInSalesResponse;

              if (!response.ok) {
                throw new Error(payload.message ?? "We could not save this walk-in sale.");
              }

              setProducts(payload.products);
              setSales(payload.sales);
              resetForm();
              resetLineInputs(payload.products);
              setMessage({ tone: "success", text: "Walk-in sale recorded and inventory updated." });
            } catch (error) {
              setMessage({
                tone: "error",
                text: error instanceof Error ? error.message : "We could not save this walk-in sale.",
              });
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <Input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Customer name (optional)"
            className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
          />
          <Input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="Customer phone (optional)"
            className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
          />
          <Select
            value={selectedVariantId}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
          >
            {products.flatMap((product) =>
              product.variants
                .filter((variant) => variant.stockQuantity > 0)
                .map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {product.name} - {variant.name} ({variant.stockQuantity} in stock)
                </option>
                )),
            )}
          </Select>
          {selectedProductVariant ? (
            <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-3 text-sm text-[var(--admin-muted)]">
              <p className="font-semibold text-[var(--admin-text)]">{selectedProductVariant.product.name}</p>
              <p className="mt-1">Available to add: {selectedStock}</p>
              <p className="mt-1">Default selling price: {formatCurrency(selectedProductVariant.variant.price)}</p>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              type="number"
              min="1"
              max={selectedStock || undefined}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Quantity"
              className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
            />
            <Input
              type="number"
              min="0"
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              placeholder="Selling price"
              className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
            />
            <Select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
              className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
            >
              <option value="cash">Cash</option>
              <option value="pos">POS</option>
              <option value="bank_transfer">Bank transfer</option>
            </Select>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedProductVariant || selectedStock <= 0}
            className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] hover:opacity-90"
            onClick={() => {
              try {
                if (!selectedProductVariant) {
                  throw new Error("Select a product variant to add.");
                }

                const parsedQuantity = Number(quantity);
                const defaultPrice = selectedProductVariant.variant.price;
                const parsedUnitPrice = unitPrice ? Number(unitPrice) : defaultPrice;

                if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
                  throw new Error("Quantity must be a whole number greater than zero.");
                }

                if (parsedQuantity > selectedStock) {
                  throw new Error(`Only ${selectedStock} unit(s) left for this variant.`);
                }

                if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice <= 0) {
                  throw new Error("Selling price must be greater than zero.");
                }

                setDraftLines((currentLines) => {
                  const existingIndex = currentLines.findIndex(
                    (line) => line.variantId === selectedProductVariant.variant.id && line.unitPrice === parsedUnitPrice,
                  );

                  if (existingIndex === -1) {
                    return [
                      ...currentLines,
                      {
                        variantId: selectedProductVariant.variant.id,
                        productName: selectedProductVariant.product.name,
                        variantName: selectedProductVariant.variant.name,
                        quantity: parsedQuantity,
                        unitPrice: parsedUnitPrice,
                      },
                    ];
                  }

                  return currentLines.map((line, index) =>
                    index === existingIndex
                      ? {
                          ...line,
                          quantity: line.quantity + parsedQuantity,
                        }
                      : line,
                  );
                });

                resetLineInputs();
                setMessage(null);
              } catch (error) {
                setMessage({
                  tone: "error",
                  text: error instanceof Error ? error.message : "We could not add this product to the sale.",
                });
              }
            }}
          >
            Add product to sale
          </Button>
          {draftLines.length > 0 ? (
            <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)]">
              <div className="flex items-center justify-between gap-4 border-b border-[color:var(--admin-border)] px-4 py-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Current sale</p>
                  <p className="mt-1 text-sm text-[var(--admin-muted)]">{draftLines.length} product line(s) ready to save</p>
                </div>
                <p className="text-lg font-semibold text-[var(--admin-text)]">{formatCurrency(draftSaleTotal)}</p>
              </div>
              <div className="space-y-3 p-4">
                {draftLines.map((line, index) => (
                  <div key={`${line.variantId}-${line.unitPrice}-${index}`} className="flex flex-col gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-input)] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--admin-text)]">{line.productName}</p>
                      <p className="mt-1 text-sm text-[var(--admin-muted)]">
                        {line.variantName} x {line.quantity} at {formatCurrency(line.unitPrice)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-[var(--admin-text)]">{formatCurrency(line.unitPrice * line.quantity)}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-none border border-[color:var(--admin-border)] text-[var(--admin-text)] hover:bg-[var(--admin-panel)]"
                        onClick={() => {
                          setDraftLines((currentLines) => currentLines.filter((_, currentIndex) => currentIndex !== index));
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Button disabled={isSaving || draftLines.length === 0} className="rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90">
            {isSaving ? "Saving..." : "Save walk-in sale"}
          </Button>
        </form>
      </Card>

      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Recent physical sales</p>
        <div className="mt-6 space-y-4">
          {sales.map((sale) => (
            <div key={sale.id} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-semibold text-[var(--admin-text)]">{sale.receiptNumber}</h3>
                  <p className="text-sm text-[var(--admin-muted)]">{formatDate(sale.soldAt)}</p>
                </div>
                <p className="text-lg font-semibold text-[var(--admin-text)]">{formatCurrency(sale.total)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {sale.items.map((item) => (
                  <span key={item.id} className="border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-xs text-[var(--admin-muted)]">
                    {item.productName} x {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
