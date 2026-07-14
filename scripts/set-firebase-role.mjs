import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, requestedRole = "admin"] = process.argv.slice(2);
const allowedRoles = new Set(["admin", "staff", "customer"]);

if (!email || (email !== "--list" && !allowedRoles.has(requestedRole))) {
  console.error("Usage: npm run firebase:set-role -- <email> <admin|staff|customer>");
  console.error("       npm run firebase:set-role -- --list");
  process.exit(1);
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin credentials are missing from .env.local.");
  process.exit(1);
}

const app =
  getApps()[0] ??
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });

const auth = getAuth(app);

if (email === "--list") {
  const result = await auth.listUsers(100);

  if (result.users.length === 0) {
    console.log("No Firebase Auth users found.");
  } else {
    for (const user of result.users) {
      console.log(`${user.email ?? "(no email)"}\t${user.customClaims?.role ?? "customer"}`);
    }
  }

  process.exit(0);
}

let user;

try {
  user = await auth.getUserByEmail(email.trim().toLowerCase());
} catch (error) {
  if (error?.code === "auth/user-not-found") {
    console.error(`No Firebase Auth user exists for ${email}. Sign up first, then rerun this command.`);
    process.exit(1);
  }

  throw error;
}

await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), role: requestedRole });

console.log(`Assigned the ${requestedRole} role to ${user.email}. The user must sign out and sign in again.`);
