# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.


## This repo

- **Clone with `--recurse-submodules`.** The image builds from `strata/`; an empty submodule fails `docker build` at `COPY strata/`.
- **Keep `Dockerfile` in step with `strata/Dockerfile`.** It is a hand-copy of upstream's build with `STRATA_PORTABLE=ON` and a runtime stage; diff upstream's on every bump (`UPDATING.md`). Don't drop `STRATA_PORTABLE` — without it ggml is built for the CI machine's CPU and a different server dies on an illegal instruction.
- **`configFile()` in `startos/utils.ts` must match the tag `strata/docker-entrypoint.sh` derives from `FAMILY`/`MODEL`.** Set Model deletes that file to force a setup run; a mismatch silently leaves the old setup in place.
- **The key reaches the server only through `STRATA_API_KEY`.** It overrides the `api_key` recorded in the model config, which is why rotating it needs no setup run. Don't move it to `--api-key` on the setup command alone.
- **`patches/` must apply to every bumped `strata/`.** The `Dockerfile` `git apply`s each one and fails the build if one no longer applies; each patch's header says when it retires.
- **`main.ts` reads `store.json` through a narrowed `.const()`.** Reading the whole store would make a Web UI password change restart Strata and reload the model; nginx picks up a new password through `onChange` instead.
