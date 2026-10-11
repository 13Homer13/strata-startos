# Updating the upstream version

Upstream is the [Niko1221/Strata](https://github.com/Niko1221/Strata) repository, carried as the git submodule
`strata/` and built by this package's own `Dockerfile` (upstream publishes no container image). The Dockerfile
repeats upstream's `strata/Dockerfile` build steps with the engine built portable and copied into a CUDA runtime
image, so a bump that changes upstream's Dockerfile has to be mirrored here.

## Determining the upstream version

```bash
gh release view -R Niko1221/Strata --json tagName -q .tagName   # e.g. v0.1.41
git -C strata describe --tags                                   # the pinned tag
```

Upstream tags several releases a day. Bump to a release that has been out long enough for its issues to surface,
and read its release notes first.

## Applying the bump

1. `git -C strata fetch --tags && git -C strata checkout <tag>`, then stage the submodule.
2. Diff upstream's build: `git -C strata diff <old-tag> <tag> -- Dockerfile docker-entrypoint.sh requirements.txt`.
   Carry any change to the build steps, the CUDA base image, or the entrypoint's env vars into `Dockerfile` and
   `startos/main.ts`.
3. Check that every patch still applies (`git apply --check --directory=strata patches/*.patch`, one at a time),
   and drop a patch whose retirement condition upstream now meets.
4. Check `MODELS` and `FAMILIES` in `strata/setup.py` against `presets` in `startos/utils.ts` — sizes, RAM floors
   and download sizes.
5. Set `version` in `startos/versions/current.ts` to the tag without its `v` (`0.1.41` → `0.1.41:0`) and update
   the release notes.
6. `make`, then install and confirm a model still starts and answers on `/v1`.
