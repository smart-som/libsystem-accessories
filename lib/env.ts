export const env = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  adminLoginEmail: process.env.ADMIN_LOGIN_EMAIL ?? "admin@libsystem.local",
  adminLoginPassword: process.env.ADMIN_LOGIN_PASSWORD ?? "Admin12345!",
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME ?? "Libsystem Admin",
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? "libsystem-admin-dev-secret",
  customerLoginEmail: process.env.CUSTOMER_LOGIN_EMAIL ?? "customer@libsystem.local",
  customerLoginPassword: process.env.CUSTOMER_LOGIN_PASSWORD ?? "Customer12345!",
  customerDisplayName: process.env.CUSTOMER_DISPLAY_NAME ?? "Demo Customer",
  customerPhone: process.env.CUSTOMER_PHONE ?? "+234 803 000 0003",
  customerSessionSecret: process.env.CUSTOMER_SESSION_SECRET ?? "libsystem-customer-dev-secret",
};

export const isFirebaseConfigured = Boolean(
  env.firebaseApiKey &&
    env.firebaseAuthDomain &&
    env.firebaseProjectId &&
    env.firebaseStorageBucket &&
    env.firebaseMessagingSenderId &&
    env.firebaseAppId,
);

export const isFirebaseAdminConfigured = Boolean(
  env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey,
);

export const isPaystackConfigured = Boolean(env.paystackPublicKey && env.paystackSecretKey);

export const isAdminCredentialsConfigured = Boolean(env.adminLoginEmail && env.adminLoginPassword && env.adminSessionSecret);

export const isUsingFallbackAdminCredentials = Boolean(
  !process.env.ADMIN_LOGIN_EMAIL && !process.env.ADMIN_LOGIN_PASSWORD && !process.env.ADMIN_SESSION_SECRET,
);

export const isUsingFallbackCustomerCredentials = Boolean(
  !process.env.CUSTOMER_LOGIN_EMAIL &&
    !process.env.CUSTOMER_LOGIN_PASSWORD &&
    !process.env.CUSTOMER_DISPLAY_NAME &&
    !process.env.CUSTOMER_PHONE &&
    !process.env.CUSTOMER_SESSION_SECRET,
);
