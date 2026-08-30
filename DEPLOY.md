# Deploying to Railway

The repo is committed and Railway-ready: `railway.json` sets the build, start and
healthcheck, and `engines` pins Node 22+. What is left needs your Railway login,
which is a browser sign-in, so it has to be run by you.

Copy-paste the whole block. It takes about three minutes, most of which is the
first build.

---

## 1. Install the CLI and sign in

```bash
npm i -g @railway/cli
railway login
```

## 2. Create the project and database

Run these from the project folder (`lumen-mun`).

```bash
railway init --name lumen-mun
railway add --database postgres
```

`DATABASE_URL` is injected automatically once the Postgres service exists. Do not
set it by hand.

## 3. Set the secrets

Generate a signing secret first, then paste it into the command below.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
railway variables \
  --set "AUTH_SECRET=PASTE_THE_GENERATED_SECRET" \
  --set "ADMIN_USERNAME=lumen-owner" \
  --set "ADMIN_PASSWORD=pick-a-strong-password" \
  --set "SUPERADMIN_PASSWORD=pick-a-different-strong-one" \
  --set "NODE_ENV=production"
```

**Set real passwords.** These are the permanent fallback login for `/admin` and
they do not depend on the database, so anyone who guesses them is in.

## 4. Deploy and get the URL

```bash
railway up
railway domain
```

`railway domain` prints the public URL. That is the link for the sponsor.

## 5. Point the site at its own URL, then create the schema

```bash
railway variables --set "NEXT_PUBLIC_SITE_URL=https://YOUR-URL.up.railway.app"
railway run npm run db:push -- --force
railway run npm run db:seed
```

`db:push` creates the tables. `db:seed` loads the committees, secretariat,
schedule, sponsor tiers and FAQs. Run the seed **once**: it is written to be
re-runnable, but a second run will overwrite content edited in the admin console.

Redeploy so the new `NEXT_PUBLIC_SITE_URL` is baked in:

```bash
railway up
```

---

## Optional, not needed for the sponsor demo

| Variable | What it turns on |
| --- | --- |
| `UPI_ID`, `UPI_PAYEE_NAME` | The real payment QR on registration. Without it the payment step says bank details are to be announced. |
| `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM` | Transactional email. Without it registration still works, confirmations just are not sent. |
| `UPLOAD_DIR` | Where payment screenshots are written. See the warning below. |

---

## Two things to know before this carries real traffic

**Uploads are on the container filesystem.** Payment screenshots and any uploaded
logos are written to disk, and Railway containers are ephemeral: a redeploy wipes
them. Fine for a demo. Before registration opens, either attach a Railway volume
and point `UPLOAD_DIR` at it, or move that handler to object storage. Nothing else
in the app stores state on disk.

**The seed data is placeholder.** Names read "To be announced", committee photos
are stand-ins from `public/img/placeholder/`, and dates are unset. That is
deliberate and it looks intentional rather than broken, but it is worth knowing
before a sponsor asks about a specific committee.

---

## Faster alternative

If the CLI login is awkward, push to GitHub and connect the repo in the Railway
dashboard instead. Railway reads `railway.json`, so the build and start commands
are already correct. You still need steps 2, 3 and 5.

```bash
gh repo create lumen-mun --private --source=. --push
```
