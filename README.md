## HRMSTech — HRMS SaaS (Next.js + Firebase)

Modern HRMS with Admin and Employee portals, employee invitations, mandatory onboarding, and organization-scoped data in Firestore.

### Stack
- Next.js App Router, React, TypeScript
- Firebase Auth, Firestore
- Resend (transactional emails)

---

## 1) Local Setup

Prereqs: Node 18+, npm, a Firebase project.

1. Install deps
```bash
npm install
```

2. Create `.env.local` with your Firebase + Resend keys
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Email (invite delivery)
RESEND_API_KEY=...
RESEND_FROM_EMAIL="HRMSTech <no-reply@yourdomain.com>"
```

3. Run the dev server
```bash
npm run dev
```
Visit `http://localhost:3000`.

---

## 2) Firebase Configuration

Enable in Firebase Console:
- Authentication → Sign-in method → Email/Password
- Firestore Database → Create database (Production or Test)

Project config is read from `.env.local` and initialized in `src/lib/firebase.ts`.

---

## 3) Firestore Rules

Rules live in `firestore.rules`. They scope reads/writes per-organization, allow self-onboarding field updates, and allow invite acceptance marks.

Deploy from the project root:
```bash
# install once
npm i -g firebase-tools
firebase login

# ensure firebase.json points to firestore.rules
# then deploy rules only
firebase deploy --only firestore:rules
```

---

## 4) Data Model (key collections)
- `organizations/{orgId}`
  - `users/{uid}`: membership docs (`role: admin|employee`)
  - `employees/{employeeId}`: employee directory records and onboarding fields
  - `invites/{email}`: invite metadata (department/role, status, acceptedAt, acceptedByUid)
  - `departments/{departmentId}` → `roles/{roleId}`

The app uses collection group queries on `organizations/*/users` to resolve the current `orgId` for the signed-in user.

---

## 5) Core Flows

### Admin — Invite an employee
- Page: `Admin → Employees → Invite` (`/admin/employees/invite`)
- Creates `organizations/{orgId}/invites/{email}` with department/role.
- Sends email (Resend) containing `https://app/invite?orgId={orgId}&email={email}`.

### Invitee — Set password and onboarding
- Page: `/invite` → creates `users/{uid}` and `employees/{uid}` under the org, copying department/role from the invite.
- Marks invite as accepted (`status: "accepted"`, `acceptedAt`, `acceptedByUid`).
- Redirects to `/employee/onboarding` where these required fields must be completed before accessing the portal:
  - Phone Number, Date of Birth, NID Number, Emergency Contact (name/phone/relationship), Present Address
  - Passport Number (optional)

### Employee — Portal access
- Layout guards in `src/app/employee/layout.tsx` enforce onboarding completion.
- Profile view at `/employee/profile` displays saved details.

### Admin — Employees & Invites
- Employees table: `/admin/employees` lists `employees` under the admin’s org.
- Pending Invites summary appears on the page.
- Separate full invites table at `/admin/invites` with live updates and Copy Link.

---

## 6) Environment Variables Reference
Mandatory:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Email invites (optional but recommended):
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

---

## 7) Scripts
```bash
npm run dev       # start dev server
npm run build     # production build
npm run start     # run built app
npm run lint      # lint
```

---

## 8) Troubleshooting

- Not seeing employees in Admin → Employees
  - Ensure you’re viewing the same Firebase project as `.env.local`.
  - Confirm your admin user has a membership doc at `organizations/{orgId}/users/{uid}` with `role: "admin"`.

- Department/Role blank after signup
  - Only new invites copy department/role into `employees/{uid}`. Recreate the invite or edit the employee doc.

- Onboarding loop
  - Check `organizations/{orgId}/employees/{uid}.onboardingCompleted` is `true` after saving the onboarding form.

- Can’t deploy rules
  - Verify `firebase.json` maps `firestore.rules` and run `firebase deploy --only firestore:rules`.

---

## 9) Security Notes
Rules restrict access per organization, allow invite acceptance writes, and allow employees to update only specific onboarding/profile fields. Review `firestore.rules` before production.

