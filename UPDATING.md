# Updating the upstream version

Upstream is the [Niko1221/Strata](https://github.com/Niko1221/Strata) repository. Since 0.2.1 it publishes container
images to `ghcr.io/niko1221/strata:<version>-<flavor>`; this package runs the `cuda13` flavor unmodified, pinned by
`dockerTag` in `startos/manifest/index.ts`.

## Determining the upstream version

```bash
gh release view -R Niko1221/Strata --json tagName -q .tagName       # e.g. v0.2.3
docker manifest inspect ghcr.io/niko1221/strata:<version>-cuda13    # the image is published (not every release has one)
```

Upstream tags several releases a day. Bump to a release that has been out long enough for its issues to surface,
and read its release notes first.

**Not every release has an image, and the newest release is usually not the newest image.** Upstream publishes images
only when the app or an engine package changes: 0.2.3.1 and 0.2.4 changed only the Terminal's Control and the new
DeepSeek engine packages and published nothing, so `latest-cuda13` stayed on 0.2.3 and this package stayed there too.
Take the highest version that `ghcr.io/niko1221/strata` actually lists (the image's
`org.opencontainers.image.version` label names the app inside it), not the highest release tag.

## Applying the bump

1. Set the tag in `startos/manifest/index.ts` (`ghcr.io/niko1221/strata:<version>-cuda13`).
2. Diff upstream's container contract between the two tags: `docker/entrypoint.sh` (env vars, the `/data` layout,
   the legacy-volume moves) and `docs/DOCKER.md` (Settings, the minimum driver). Carry any change into
   `startos/main.ts`, and `dataDir`/`installDir` in `startos/utils.ts`.
3. Check `MODELS` and `FAMILIES` in the image's `setup.py` against `presets` in `startos/utils.ts`: sizes, RAM floors,
   download sizes, shard counts and tags. One way is to print them from the image:
   `docker run --rm --entrypoint /opt/strata/terminal/python/bin/python3 -w /opt/strata/terminal <image> -c 'import setup; print(setup.MODELS)'`.
4. Check that the nginx `sub_filter` targets in `startos/main.ts` still exist in the image's
   `/opt/strata/terminal/serve/web/` (`</head>`, the `strata.apikey` localStorage key, the `#api-key` field).
5. Set `version` in `startos/versions/current.ts` to the tag without its `v` (`0.2.3` → `0.2.3:0`) and update
   the release notes.
6. `make`, then install and confirm a model still starts and answers on `/v1`.
