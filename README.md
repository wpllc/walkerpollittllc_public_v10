
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

## Branch and Active Work
All changes for the website navigation rebuild have been compiled on the active development branch:
`website-navigation-rebuild`

## stack
- Plain HTML5 + CSS3 (styled via Tailwind CSS CDN integration)
- GitHub repository integration
- Cloudflare Pages automated deployment target

## Local Preview
To preview the website locally:
1. Open a terminal and run a lightweight local server (e.g. using Python or Node.js):
   ```bash
   python -m http.server 8000
   # Or using Node.js:
   npx http-server -p 8000
   ```
2. Open a browser and navigate to `http://localhost:8000`.

## Deployment Instructions
1. Push the branch `website-navigation-rebuild` to GitHub.
2. In the Cloudflare Pages dashboard, you can build a Preview Deploy from the branch to verify performance.
3. Once validated, merge the branch to `main` to trigger the production deployment to `https://walkerpollittllc.com`.

## brand Separation Notice
This repository contains references to both Walker Pollitt LLC (services and capabilities) and RavenForge Systems LLC (external demonstrations and cockpit environments). 
* **Separation Policy**: All RavenForge products, trademarks, and demonstrations are owned by RavenForge Systems LLC and must remain separate.
* **Link Config**: All external destinations are mapped to a centralized configuration object in `index.html` for easy domain changes.

