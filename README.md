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

Language installation and syntax details are based on `../kursal` at the time
this site was created. Update them when the compiler changes.
