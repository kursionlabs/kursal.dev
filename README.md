# Kursal website

The static website for the [Kursal](https://github.com/kursionlabs/kursal)
programming language. It is built with [Krayon](https://github.com/kursionlabs/krayon).

## Build

Bootstrap Kursal and build Krayon in the adjacent repositories:

```sh
cd ../kursal && scripts/bootstrap.sh
cd ../krayon && mkdir -p bin && ../kursal/bin/kursal build krayon -o bin/krayon
cd ../kursal.dev && ../krayon/bin/krayon build .
```

Deploy the contents of `dist/` to any static host. Krayon builds into a
staging directory, then replaces `dist/` only after a successful build. A failed
render leaves the previous `dist/` intact.

## Structure

- `krayon.toml` — site paths and output settings
- `src/*.md` — content pages with TOML front matter
- `src/index.html` — homepage template
- `src/_includes/` — shared layouts
- `src/_data/site.toml` — shared site metadata
- `src/assets/` — CSS, JavaScript, and favicon

`src/assets/theme.css` defines the shared Kursion colors and the dark/light
palette. Dark is the default; the visitor's choice is saved in the browser.
Krayon supplies syntax token classes for fenced `kursal` code, which the theme
styles in the same fixed dark code palette in both modes.
The site uses Inter, JetBrains Mono, and Noto Sans Arabic, all available under
the SIL Open Font License via Google Fonts.

Language installation and syntax details are based on `../kursal` at the time
this site was created. Update them when the compiler changes.

## Hosting on GitHub Pages

`.github/workflows/pages.yml` builds the site on every push to `main` and
deploys `dist/` to GitHub Pages. Pull requests get the build, and so the link
check, without a deploy. The job bootstraps kursal, builds Krayon, then builds
the site, which takes a few minutes.

To turn it on:

1. In the repository settings, set Pages to deploy from GitHub Actions.
2. kursal, Krayon and Kable are private repositories, so add secrets
   `KURSAL_REPO_TOKEN`, `KRAYON_REPO_TOKEN` and `KABLE_REPO_TOKEN`: tokens
   with read access to each. Without them the checkout falls back to the
   workflow's own token, which cannot read other private repositories.
3. The site links to its pages from the root (`/start/`), so serve it at the
   root of a domain, such as a custom domain for kursal.dev.
