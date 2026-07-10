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
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`

If Firebase or Paystack values are missing, the app automatically falls back to demo mode instead of crashing.

## Firebase

- Browser auth state is handled with the Firebase Web SDK.
- Server auth checks use Firebase Admin session cookies set by `app/api/auth/session/route.ts`.
- Admin and staff access depends on a Firebase custom claim named `role` with values `admin`, `staff`, or `customer`.

## Firestore Scaffolding

Suggested Firestore collections live in [lib/firebase/firestore.ts](/C:/Users/fmba3/OneDrive/Documents/lib/lib/firebase/firestore.ts).

The previous SQL schema has been translated into a Firebase-oriented model outline in [firebase/firestore-model.md](/C:/Users/fmba3/OneDrive/Documents/lib/firebase/firestore-model.md).

## Notes

- Paystack initialization is scaffolded in `app/api/paystack/initialize/route.ts`
- Payment verification and webhook expansion can be added on top of `app/api/paystack/verify/route.ts`
- Current admin actions are UI-complete and demo-data backed; the next production step is replacing demo reads/writes with live Firestore reads/writes and server actions
- Registering a user writes a starter profile document into Firestore when Firebase is configured
