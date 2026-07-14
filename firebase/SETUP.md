# Firebase setup

This app uses the Firebase browser SDK for customer authentication and the Firebase Admin SDK on the server for session verification and privileged Firestore access.

## 1. Create and register the web app

1. Open the [Firebase console](https://console.firebase.google.com/) and create or select a project.
2. From **Project overview**, choose **Add app** > **Web**.
3. Register the app. Firebase Hosting is not required for a Vercel deployment.
4. Copy the generated `firebaseConfig` values into the private `.env.local` file:

| Firebase config field | Environment variable |
| --- | --- |
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |
| `measurementId` (optional) | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` |

Firebase web configuration identifies the project; it does not grant database access. Firestore Security Rules, Authentication, and App Check protect the data.

## 2. Enable Authentication

1. In Firebase, open **Build** > **Authentication** > **Get started**.
2. Under **Sign-in method**, enable **Email/Password** and **Google**.
3. Under Authentication settings, add the deployed application domain to **Authorized domains**. Keep `localhost` for local development.
4. Configure a password policy and enable email-enumeration protection before production.

## 3. Create Firestore

1. Open **Build** > **Firestore Database** > **Create database**.
2. Choose the region closest to the application's users.
3. Start in **Production mode**.
4. Define and deploy Security Rules before allowing browser reads or writes. Never use a blanket `allow read, write: if true` rule in production.

The planned collections and document shapes are described in [firestore-model.md](./firestore-model.md).

## 4. Configure the Admin SDK

The server needs Admin SDK credentials to verify Firebase sessions and read user profiles.

1. Open **Project settings** > **Service accounts**.
2. Select **Generate new private key** and securely download the JSON file.
3. Copy only these fields into `.env.local`:

| Service-account JSON field | Environment variable |
| --- | --- |
| `client_email` | `FIREBASE_CLIENT_EMAIL` |
| `private_key` | `FIREBASE_PRIVATE_KEY` |

Store `FIREBASE_PRIVATE_KEY` on one line with its newline characters represented as `\n`. Never prefix either Admin variable with `NEXT_PUBLIC_`, commit the JSON key, or paste it into an issue or chat.

## 5. Create the first admin

1. Create the person's account in **Authentication** > **Users**, or let them register normally.
2. Assign the Firebase custom claim from the project root:

```powershell
npm run firebase:set-role -- admin@example.com admin
```

The user must sign out and sign in again after a role change. Supported roles are `admin`, `staff`, and `customer`. Admin authorization is enforced from the signed Firebase token; a hidden URL or separate hostname is not the security boundary.

## 6. Configure the admin hostname

Attach an admin subdomain such as `admin.example.com` to the same deployment, then set:

```dotenv
ADMIN_HOSTNAME=admin.example.com
```

When configured, production requests to `/admin` and `/admin-login` on other hostnames return a 404. Visiting the admin hostname root redirects to `/admin-login`. Localhost remains available during development.

## 7. Configure deployment variables

Add the same variables to the deployment provider's encrypted environment-variable settings. Use separate Firebase projects or credentials for development, preview, and production where practical. Do not upload `.env.local`.

## Security checklist

- Keep `.env.local` and service-account JSON files out of Git.
- Rotate a service-account key immediately if it was ever committed or shared.
- Restrict the Firebase-provisioned browser API key to the required Firebase APIs.
- Enforce Firestore Security Rules and consider enabling Firebase App Check.
- Grant admin/staff access with custom claims and review those assignments regularly.
- Remove downloaded service-account JSON files after securely storing the required values.

Official references:

- [Add Firebase to a web app](https://firebase.google.com/docs/web/setup)
- [Email/password authentication](https://firebase.google.com/docs/auth/web/password-auth)
- [Firebase Admin SDK setup](https://firebase.google.com/docs/admin/setup)
- [Firebase API key guidance](https://firebase.google.com/docs/projects/api-keys)
- [Cloud Firestore quickstart and security](https://firebase.google.com/docs/firestore/quickstart)
