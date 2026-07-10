import { Badge } from "@/components/ui/badge";

export function DemoModeBanner() {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-3 text-center text-xs text-slate-600 sm:px-6 lg:px-8">
        <Badge>Demo Mode</Badge>
        <p>
          Firebase and Paystack are not connected yet, so the app is running on seeded sample data with production-ready structure.
        </p>
      </div>
    </div>
  );
}
