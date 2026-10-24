# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

## This repo

- **`configFile()`, `dataDir` and `installDir` in `startos/utils.ts` must match the image's layout** (`setup.py` names the run settings `strata-<tag>.json` in `STRATA_INSTALL_DIR`). The Strata API health check and Delete Models find a model's run settings by that name; a mismatch reports a set-up model as still downloading and leaves its files behind on delete.
- **The key reaches the server only through `API_KEY`.** The entrypoint passes it to `strata launch`, which puts it over the key saved in the `docker` preset on every start, which is why rotating it needs no setup run.
- **The image is upstream's, unmodified.** Upstream has no Dockerfile hook for fixes; carrying one again means a `Dockerfile` `FROM` the ghcr tag, not a return to the source build.
- **`main.ts` reads `store.json` through a narrowed `.const()`.** Reading the whole store would make a Web UI password change restart Strata and reload the model; nginx picks up a new password through `onChange` instead.
- **nginx keeps the `api` host's 8080 binding; Strata stays on `strataPort`.** Every app was given an address on that binding, so moving nginx to another port changes them all. Retire a binding you drop (`interfaces.md` § Retiring a Host or Binding).
- **Keep nginx's `$strata_foreign` Origin check.** nginx swaps a browser's Web UI password for the API key, which turns off Strata's own cross-origin refusal; without the check any website the user visits can spend the GPU through their saved login.
- **Keep the `sub_filter` script that removes `strata.apikey` from the browser.** The web app sends a key saved under About → Settings as `Bearer`, which nginx passes through instead of injecting the current key, so the page breaks after every rotation.
