import { getSessionContext } from "@/lib/auth";
import { CheckoutForm } from "@/components/store/checkout-form";
import { getShippingZones } from "@/lib/catalog";

export default async function CheckoutPage() {
  const session = await getSessionContext();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CheckoutForm
        shippingZones={getShippingZones()}
        defaults={{
          customerName: session.user?.displayName ?? "",
          customerEmail: session.user?.email ?? "",
          customerPhone: session.user && "phone" in session.user ? (session.user.phone ?? "") : "",
        }}
        isSignedInCustomer={session.role === "customer" && Boolean(session.user)}
      />
    </div>
  );
}
