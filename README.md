# Walker Pollitt LLC website

The public site pairs Walker Pollitt LLC services with the RavenForge demo collection. RavenForge is software created and owned by Walker Pollitt.

## Build

```sh
python scripts/build_site.py
python scripts/build_site.py --check
node --test scripts/private-access.test.mjs
```

The Cloudflare Pages build runs the same Python command and deploys only `dist/`. Edit `templates/index.html` for the landing and `content/ravenforge.json` for public product copy. `/ravenforge.json` continues to expose the reusable public manifest. The existing render workflow keeps the generated files in sync on `main`.

## Private access

`/private/` runs through the Pages Function. The two areas are configured independently using encrypted production bindings `WPLLC_PORTFOLIO` and `WPLLC_PROJECT`. Leave these bindings absent on public previews. Private copy belongs in the encrypted binding, outside Git and the static build folder.

Each binding contains a JSON object with `verifier` (the unpadded base64url SHA-256 digest of a generated 32-byte base64url password), `title`, `intro`, and `sections` with `heading` and `text` strings. Generate a different password for each area and give the operator that password using a private channel. Rotating a verifier invalidates that area's existing cookies. The operator workspace on `app.walkerpollittllc.com` has its own existing sign-in.

The private function returns only authorized sections, prevents cache reuse, and requires a fresh sign-in when a session expires. After deploying, check anonymous access, incorrect passwords, both independent scopes, sign-out, and the three demo links.
