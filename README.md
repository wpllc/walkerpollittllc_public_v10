
# walkerpollittllc-public-v1

Public-facing static website for **www.walkerpollittllc.com public v1.0**.

## Purpose
- Landing page for internet traffic
- Portfolio showcase for systems architecture and designs
- Public-safe portal entry to projects (live and in progress)
- Future-ready separation between public presence and private workspace

## Stack
- Plain HTML + CSS
- GitHub repository
- Cloudflare Pages deployment target

## Recommended Cloudflare Pages setup
1. Create a new GitHub repository and upload these files.
2. In Cloudflare Dashboard, go to **Workers & Pages**.
3. Select **Create application → Pages → Connect to Git**.
4. Connect GitHub, select this repository, and begin setup.
5. Build command: leave blank (static site).
6. Build output directory: `/`
7. Production branch: `main`
8. After first deploy, add custom domain `www.walkerpollittllc.com` from the **Custom domains** tab.

## File structure
```
/
├── index.html
├── assets/styles.css
├── systems/index.html
├── portfolio/index.html
├── projects/index.html
├── about/index.html
├── contact/index.html
├── robots.txt
├── sitemap.xml
└── _headers
```

## Notes
- Contact links are placeholders and should be updated before production.
- Project portal is intentionally described as a future authenticated workspace.
- This repository is designed to be beginner-safe and Cloudflare Pages friendly.
