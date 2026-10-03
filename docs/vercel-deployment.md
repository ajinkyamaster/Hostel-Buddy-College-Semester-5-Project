# Deploying Hostel Buddy on Vercel

The original backend opened `./data/hostel.db` and stored users there. A Vercel Function has no durable project filesystem; its instances do not share a local SQLite file. It also does not start the app through `npm start`, so the original `src/server.js` initialization was skipped. Those two conditions explain why local login can work while a Vercel deployment fails or loses registered accounts. The frontend already requests `/api/auth/login` on its own origin; there is no localhost API URL to replace.

## Observed on the current live site

On 3 October 2026, `https://hostel-buddy-college-project.vercel.app/api/health` returned HTTP 200 with `"storage":"ephemeral-demo"`. `GET /api/hostels` returned three seeded hostels. A login attempt with the supplied `admin@hostel.test` / `admin123` returned HTTP 401 with `INVALID_CREDENTIALS`. The page and API routing are therefore live, while the deployed backend rejected that credential pair. From a public response alone, it is not possible to distinguish a missing admin account from a different stored password. The `ephemeral-demo` storage marker independently confirms that this deployment is not using durable account storage. Repeated public reads within the same warm instance showed the same hostel rows; that does not establish persistence across an instance restart.

The new deployment requires an admin password different from `admin123` and the values in the Vercel environment must match the new database. The old demo database is not automatically migrated.

The deployment now uses a Vercel Function entry point in `api/index.js`, initializes the schema and admin account before API requests, and uses a remote libSQL database when `TURSO_DATABASE_URL` is set. Local development still uses the original SQLite file. All accounts, hostels, and complaints go through the same database adapter.

## One-time setup

1. Create a **Turso libSQL** database. Copy its database URL (`libsql://...`) and create a database auth token with read and write access. Use one database for the deployment. For Vercel Preview and Production, either use separate databases or intentionally share the same one.
2. Import this repository into Vercel with the **repository root** as the Root Directory. The included `vercel.json` routes `/api/*` to the Express Function and serves the files in `public/` at the site root. Set the Node.js version to **24.x**; `package.json` also specifies it. Leave the framework preset as **Other** and do not set a custom Output Directory.
3. In Vercel Project Settings → Environment Variables, set these values for the environments you deploy:

   | Name | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | Your database's `libsql://...` URL |
   | `TURSO_AUTH_TOKEN` | The matching database auth token |
   | `JWT_SECRET` | A stable, random secret, at least 16 characters; keep it the same across redeploys |
   | `ADMIN_EMAIL` | Email address for the first super admin |
   | `ADMIN_PASSWORD` | A private password other than `admin123` |
   | `ADMIN_NAME` | Optional display name |

4. Redeploy after saving the variables. Open `https://your-project.vercel.app/api/health`; it must return JSON with `"ok":true`. The first request creates the tables and the admin account. Open `/login.html` and sign in with the **exact `ADMIN_EMAIL` and `ADMIN_PASSWORD` you configured**. The README's `admin@hostel.test` / `admin123` are local demo credentials; they will not work in production. The admin should create a hostel before students register.
5. Check `/api/hostels`, create a hostel as admin, register a student, log out, log back in, and refresh. These operations must retain their data across a redeploy because the data is in Turso.

`ADMIN_PASSWORD` creates the account only when that email does not yet exist. Changing the variable later does **not** reset an existing account's password. If you previously pointed the deployment at another database, its accounts are separate. A local `data/hostel.db` is also separate from Turso; the demo seed is not run automatically on Vercel. Do not run the demo seed against a real deployment database.

## If login still fails

- `/api/health` returns HTML or 404: the project root or Vercel routing is wrong. Confirm `vercel.json` and `api/index.js` are in the deployment and the Root Directory points at this repository root.
- `/api/health` returns 500: open Vercel Function logs. A missing or invalid Turso URL/token, missing schema file, or missing production secret will be reported there. Correct the environment variable and redeploy.
- `/api/health` works but login returns 401 `INVALID_CREDENTIALS`: use the configured admin account, or register a student after the admin has created a hostel. Data from local `data/hostel.db` is not in Turso unless separately migrated.
- Login returns a token but later API calls fail: check that `JWT_SECRET` is the same across the active deployments and that all deployment instances use the same Turso database.

## Current attachment limit on Vercel

The database and login flow are durable. Attachments still use the original local upload directory. On Vercel that directory is `/tmp`, which is temporary and specific to a Function instance. Uploaded images or videos can disappear, and Vercel's Function request limit prevents the advertised 5 MB image or 30 MB video uploads. Test the rest of the complaint workflow **without attachments** on Vercel. Durable attachment support requires object storage and a direct browser upload flow; this is outside the database fix. On a normal persistent Node server, the original local upload flow continues to work.

This deployment has not been run against your own Vercel and Turso accounts in this workspace; the focused tests cover the imported Function, a fresh process logging into the same database, and the libSQL adapter using the actual SDK.
