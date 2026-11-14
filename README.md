# Walker Pollitt LLC website

Business: Walker Pollitt LLC. Software: RavenForge, created and owned by Walker Pollitt, with a patent application pending.

## One source for product copy

Edit `content/ravenforge.json` for ownership, product summary, feature descriptions, and verified implementation status. This public-safe manifest is the canonical website product copy. Keep internal records, provider credentials, and private source code out of it.

Run `python scripts/build_site.py` to generate `index.html` and a deployment-only `dist` directory. Run `python scripts/build_site.py --check` to verify branding, generated copy, internal anchors, and configured link targets. Page structure and styling live in `templates/index.html`.

The build also publishes `/ravenforge.json`, so other public sites can consume the same approved manifest. It does not expose or automatically publish the private software repository. No cross-repository synchronization has been activated.

## Existing deployment

Repository: `https://github.com/wpllc/walkerpollittllc_public_v10`

Cloudflare Pages project: `walkerpollittllc-public-v10`. Public URL: `https://walkerpollittllc.com`.

For automatic generation from each repository update, configure the Pages build command as `python scripts/build_site.py` and build output directory as `dist`. These deployment settings must be applied to the existing project; they have not been changed by the prepared patch. The generated root `index.html` remains compatible with its existing static deployment.

Deploy only `dist` when using direct upload. It contains the public HTML, manifest, robots.txt, sitemap.xml, and security headers. Feature evidence and validation notes belong outside the public output.

## Status accuracy

The November 14, 2026 feature review distinguishes implemented components from bounded workflow demonstrations. It does not claim full provider integration, unrestricted autonomous coding, or completed local-model deployment. Recheck evidence before promoting a feature's status.
