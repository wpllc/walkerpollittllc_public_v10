# Walker Pollitt LLC website

Business: Walker Pollitt LLC. Software: RavenForge, created and owned by Walker Pollitt, with a patent application pending.

## One source for product copy

Edit `content/ravenforge.json` for ownership, product summary, feature descriptions, and verified implementation status. Committing changes to that file on `main` automatically runs the `Render public product copy` GitHub workflow. It validates and generates the page, then commits the public HTML and `/ravenforge.json` for the existing Cloudflare Pages deployment. Keep internal records, provider credentials, and private source code out of the manifest.

Run `python scripts/build_site.py` to generate `index.html` and a deployment-only `dist` directory. Run `python scripts/build_site.py --check` to verify branding, generated copy, internal anchors, and configured link targets. Page structure and styling live in `templates/index.html`.

The build also publishes `/ravenforge.json`, so other public sites can consume the same approved manifest. It does not expose or automatically publish the private software repository. No cross-repository synchronization has been activated.

## Existing deployment

Repository: `https://github.com/wpllc/walkerpollittllc_public_v10`

Cloudflare Pages project: `walkerpollittllc-public-v10`. Public URL: `https://walkerpollittllc.com`.

Automatic generation is handled by `.github/workflows/render-site.yml`; the existing Cloudflare build settings are preserved. The workflow uses the repository's temporary GitHub Actions token and needs no Cloudflare secret. Its generated commit triggers the existing Pages integration. Template and builder changes also trigger generation; generated HTML changes do not trigger a render loop.

Deploy only `dist` when using direct upload. It contains the public HTML, manifest, robots.txt, sitemap.xml, and security headers. Feature evidence and validation notes belong outside the public output.

## Status accuracy

The November 14, 2026 feature review distinguishes implemented components from bounded workflow demonstrations. It does not claim full provider integration, unrestricted autonomous coding, or completed local-model deployment. Recheck evidence before promoting a feature's status.
