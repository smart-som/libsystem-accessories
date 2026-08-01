# Libsystem Accessories

Nigeria-first ecommerce MVP built with `Next.js`, `TypeScript`, `Tailwind CSS`, `Firebase`, and `Paystack`.

## Included

- Customer storefront with product discovery, product detail, cart, checkout, account, and order history screens
- Admin dashboard with KPI cards, sales charts, product management UI, walk-in sales recording UI, analytics, and staff management pages
- Demo-mode data layer so the app runs without Firebase during UI review
- Firebase Auth session wiring plus Firestore collection scaffolding for production wiring

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

On this Windows machine, the project uses a small wrapper around Next so local `dev` and `build` run with Webpack plus the installed WASM SWC fallback instead of the failing native SWC binary.

## Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `PAYSTACK_SECRET_KEY`

If Firebase values are missing, the app falls back to demo data instead of crashing. Checkout reports a clear configuration error when Paystack is missing. Hosted Paystack Checkout only needs the server-side `PAYSTACK_SECRET_KEY`; the public key is not exposed to the browser.

## Firebase

- Browser auth state is handled with the Firebase Web SDK.
- Server auth checks use Firebase Admin session cookies set by `app/api/auth/session/route.ts`.
- Admin and staff access depends on a Firebase custom claim named `role` with values `admin`, `staff`, or `customer`.

## Firestore Scaffolding

Suggested Firestore collections live in [lib/firebase/firestore.ts](/C:/Users/fmba3/OneDrive/Documents/lib/lib/firebase/firestore.ts).

The previous SQL schema has been translated into a Firebase-oriented model outline in [firebase/firestore-model.md](/C:/Users/fmba3/OneDrive/Documents/lib/firebase/firestore-model.md).

## Paystack

- Set `PAYSTACK_SECRET_KEY=sk_test_...` locally and in the deployment environment. Replace it with `sk_live_...` when the Paystack account is ready for live transactions; no code change is required.
- In the Paystack dashboard, set the webhook URL to `https://YOUR_DOMAIN/api/paystack/webhook` for test mode and again for live mode. The per-transaction callback URL is supplied automatically by the app.
- Successful payments are verified server-side against Paystack, including the reference, NGN amount, and currency. The signed `charge.success` webhook is handled as a fallback, and fulfillment is idempotent by payment reference.
- Never commit or expose `PAYSTACK_SECRET_KEY`. Rotate any key that appears in a screenshot, chat, log, or public location.

## Notes

- Current admin actions are UI-complete and demo-data backed; the next production step is replacing demo reads/writes with live Firestore reads/writes and server actions
- Registering a user writes a starter profile document into Firestore when Firebase is configured
