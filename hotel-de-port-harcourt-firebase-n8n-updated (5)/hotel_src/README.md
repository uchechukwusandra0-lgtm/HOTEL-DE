# Hotel De Port Harcourt — Website, Staff Panel, Firebase & n8n

Luxury hotel website and staff operations dashboard built with React, Vite, TypeScript, Firebase Authentication, Cloud Firestore, and n8n webhooks.

## Local development

1. Install Node.js 22 or a compatible current LTS release.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and configure the actual n8n HTTPS webhook base URL if available.
4. Run `npm run dev`.
5. Run `npm run build` before deploying.

## Firebase configuration

The web app uses Firebase project `hotel-de-port`. The Firebase web configuration in `src/services/firebase.ts` is client-side configuration; access control must be enforced by Firestore Rules, not by hiding frontend components.

### Publish Firestore rules

The updated `firestore.rules` is included. To publish in the Firebase Console:

1. Open Firebase Console and select `hotel-de-port`.
2. Open **Firestore Database → Rules**.
3. Back up the current rules and replace them with the included `firestore.rules`.
4. Click **Publish**.
5. Test with a guest account and the verified admin account. A guest must not be able to read another guest's booking or any staff collection.

You can also use Firebase CLI after logging in and confirming the project: `firebase deploy --only firestore:rules --project hotel-de-port`. The included `firebase.json` points to `firestore.rules`; no deployment happens just because files are pushed to GitHub.

The rules currently grant staff access to the verified Firebase Authentication email `uchechukwusandra0@gmail.com`. Confirm this is the intended admin before publishing. For a multi-staff production system, use custom claims or a protected staff-role collection.

## Firestore collections

- `bookings`: validated booking requests. Public create is allowed for the guest booking form; reads are limited to the authenticated owner or verified admin; updates/deletes are admin-only.
- `hdph_abandoned`: abandoned booking leads. Public create is allowed; read/update is admin-only.
- `hdph_enquiries`, `hdph_maintenance`, `hdph_reviews`: validated public submissions; staff reads/updates are admin-only.
- `hdph_payments`, `hdph_reports`: admin-only.

The application data service now reads and writes operational records in Firestore instead of silently relying on browser localStorage/demo records. The staff “Clear Records” action is disabled to prevent accidental deletion of live data.

## n8n setup

1. Import and configure the appropriate n8n workflows.
2. Activate each workflow and test its webhook URL in n8n.
3. In the staff panel's integration settings, enter the actual HTTPS base URL or per-endpoint overrides.
4. Keep webhook secrets in n8n or a trusted backend. **Do not use `VITE_` variables for secrets** because Vite exposes them to browser code.
5. The website no longer simulates a successful webhook response when a URL is missing or fails. If Firestore saves a booking but n8n is unavailable, the booking remains saved and the UI warns that the automation did not run.

## Payment and production safety

- Payment status must be set after trusted server-side verification of the Paystack transaction. A client-side status change is not proof of payment.
- Public client-side booking creation is suitable for a controlled demo only. Before production, route it through trusted backend logic to recalculate prices, check date/room availability, prevent duplicate requests, and rate-limit submissions.
- Firestore rules cannot prove that a guest has paid, that a room is available, or that a public lead is genuine.
- Do not commit `.env` files, private keys, Firebase service-account credentials, or Paystack secret keys.

## Verification status

The source files and TypeScript/TSX syntax were inspected, but a full dependency install and production build could not be completed in the editing environment. The rules have not been deployed, and live Firebase/n8n requests have not been tested. Complete those checks in your own project before using real guest data or pitching this as a production-ready deployment.
