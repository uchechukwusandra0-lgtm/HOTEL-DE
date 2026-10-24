# Hotel De Port Harcourt — Firebase + n8n integration notes

## What changed
- Replaced localStorage-backed operational records with Firestore operations for bookings, payments, enquiries, maintenance, reviews, abandoned bookings, and daily reports.
- Kept the `bookings` collection for guest booking records; the other collections use `hdph_*` names consistent with the application.
- Booking requests are stored as `Pending` / `Pending` regardless of frontend-supplied status values. The booking document ID is the booking reference.
- Abandoned leads are written to `hdph_abandoned`; the public client does not query private leads to deduplicate them.
- Removed simulated n8n success responses and the shared secret header from browser requests. A missing/placeholder URL now produces a real error.
- Prevented the abandoned-booking admin screen from claiming a reminder was sent when the webhook failed.
- Disabled the destructive “Clear Records” action in the staff panel to avoid accidental deletion of live Firebase data.
- Removed the hardcoded demo password fallback from Firebase sign-in.

## Firestore collections
- `bookings`: guest booking requests. Guests can read their own authenticated bookings; verified admin can read all and update status.
- `hdph_abandoned`: public create only; verified admin can read/update. For production, n8n should update this collection after a verified payment or successful recovery.
- `hdph_enquiries`, `hdph_maintenance`, `hdph_reviews`: public create with basic field validation; verified admin read/update.
- `hdph_payments`, `hdph_reports`: verified-admin access. Payment verification must be performed by trusted server-side code.

## Publish Firestore rules
1. Open Firebase Console and select project `hotel-de-port`.
2. Open **Firestore Database → Rules**.
3. Back up the current rules, then replace them with the included `firestore.rules`.
4. Click **Publish**.
5. Test in a separate test account: guest A must not read guest B's bookings; unverified/non-admin users must not read staff collections; the verified admin should be able to access staff data.

Alternatively, from a local project configured with Firebase CLI, use `firebase deploy --only firestore:rules` after confirming `.firebaserc` points to the correct project. Do not run this command until the target project is verified.

## Configure n8n
- In the staff integration settings, enter the actual HTTPS webhook base URL or endpoint overrides from the imported/activated n8n workflows.
- Activate each workflow in n8n and test its webhook independently.
- Store any authentication secret in n8n or a trusted backend. Do not use `VITE_WEBHOOK_SECRET`; browser environment variables are public.
- The website now treats Firebase as the record source and n8n as the automation layer. If a webhook fails after Firestore saves a booking, the booking remains saved and the UI warns that the automation did not run.

## Production caveats
- Client-side public booking creation cannot verify room availability, enforce server-side prices, or prevent all spam. Route production booking creation through trusted backend logic and revalidate the amount/dates there.
- The rules use the verified Firebase token email `uchechukwusandra0@gmail.com` as the admin identity. For a larger staff team, prefer Firebase custom claims or a protected staff-role document.
- These changes have not been deployed to Firebase or Netlify. Build/test locally with dependencies installed before presenting.
