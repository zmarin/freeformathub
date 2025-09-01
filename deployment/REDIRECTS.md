# Legacy URL Redirects

Use these server-level redirects to normalize legacy `/tools/...` URLs to the new category-first structure `/<category>/<slug>`.

## Nginx

- Add inside the appropriate `server {}` block:

```
# Redirect /tools/<path> -> /<path>
location ^~ /tools/ {
  return 301 $scheme://$host$request_uri; # default fallback
}
rewrite ^/tools/(.*)$ /$1 permanent;
```

## Caddy

```
@legacyTools path /tools/*
redir @legacyTools /{remainder} 301
```

## Apache (htaccess)

```
RewriteEngine On
RewriteRule ^tools/(.*)$ /$1 [R=301,L]
```

Note: Static hosting via `serve` cannot enforce server redirects. This repo also includes client-side fallbacks:
- `src/pages/tools/[category]/[slug].astro` → 301 to `/<category>/<slug>`
- `src/pages/tools/[category]/index.astro` → 301 to `/<category>`
- `src/pages/tools/[...rest].astro` → meta-refresh + canonical to `/:splat`
