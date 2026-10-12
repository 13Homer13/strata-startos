<p align="center">
  <img src="icon.svg" alt="Strata Logo" width="21%">
</p>

# Strata on StartOS

> Everything not listed in this document should behave the same as upstream
> Strata. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[Strata](https://github.com/Niko1221/Strata) is an inference engine that runs the Qwen3.8-Flash-Next model on one
consumer NVIDIA graphics card by splitting it across GPU, RAM and disk. It serves an OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`, `/v1/responses`), an Anthropic-compatible one (`/v1/messages`), and its own web app. This package builds the engine, runs it on the StartOS NVIDIA image, gates every API request with an API key the package generates, and serves the API and the web app on one interface, with the web app behind a password.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

Upstream publishes no container image, so the package builds one from the `strata/` git submodule.

| Property      | Value                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Image         | Built by this repo's `Dockerfile`: upstream's build steps on `nvidia/cuda` devel, copied into an `nvidia/cuda` runtime image                                |
| Engine build  | Portable (AVX2 baseline, `STRATA_PORTABLE=ON`) instead of upstream Docker's native-to-the-build-CPU; CUDA architectures for RTX 20, 30, 40, 50 and A-series |
| Architectures | x86_64 only                                                                                                                                                 |
| Hardware      | Offered only on servers with an NVIDIA GPU (`driver: nvidia`) and at least 30 GiB of RAM; the image runs with the NVIDIA container runtime                  |
| Entrypoint    | Upstream's `docker-entrypoint.sh`, unmodified, with its settings passed as environment variables                                                            |
| Patches       | `patches/*.patch`, applied to the source at build: whole-line download progress off a TTY (0001), Model settings saved through the config link (0002)       |
| Front proxy   | `nginx:1.28.0-alpine`, the `web-ui` daemon                                                                                                                  |

Two subcontainers. `strata-sub` runs the daemon `primary` (Strata, on internal port 8082). `web-ui` runs nginx on
internal port 8080, the only bound port, which forwards to Strata on `127.0.0.1:8082` (see
[Network Access and Interfaces](#network-access-and-interfaces)). It also serves the package icon (`assets/`, mounted
at `/usr/share/nginx/strata`) as `/favicon.svg` and `/favicon.ico`, and adds a `<link rel="icon">` to Strata's HTML
pages, along with the script that clears the page's stored API key (see below). To look inside one:
`start-cli package attach strata -n strata-sub -- <cmd>`. `nvidia-smi` is available in `strata-sub` and shows whether
the GPU reached the container.

The entrypoint runs upstream's `setup.py --setup` whenever the selected model has no recorded config, then `exec`s
`setup.py`, which replaces itself with `serve/server.py` (`STRATA_EXECV=1`). The engine itself was compiled into the
image, and `engine/BUILD.json` records its source hash, so a start never recompiles or downloads an engine.

## Volume and Data Layout

Two volumes. `main` holds everything Strata downloads and prepares; `public` holds the API key.

| Volume   | Mount point             | Contents                                                                                                                                                               |
| -------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`   | `/data` in `strata-sub` | `models/<SIZE>/` (GGUF shards), `packs/<size>/` (prepared packs), `mtp/` (draft layer), `config/strata-<tag>.json` (each model's recorded setup), `startos/store.json` |
| `public` | not mounted by Strata   | `credentials.json` — `{ "apiKey": "…" }`, readable by services that depend on Strata                                                                                   |

Each model size costs roughly 60–85 GB on `main` (download plus prepared pack). Switching sizes accumulates them
until **Delete Models** removes one. Shard 2 is hard-linked between the Qwen sizes and the Coder, so its ~30 GB are
freed only when every size sharing it is deleted.

## File Models

The package owns two JSON files. Strata's own config files are written by upstream's setup, not modelled.

- **`main:startos/store.json`** — the chosen model `preset`, `context` and `vision` (written by **Set Model**), and
  `uiPassword` (written by **Set Web UI Password**). Seeded empty at install. A hand edit survives and is read on the
  next start; an invalid value falls back to its default (`context` 32768, `vision` off, no preset, no password).
- **`public:credentials.json`** — the API key. Seeded empty at install, written only by **API Key** (when it generates one).
- **`main:config/strata-<tag>.json`** (not modelled) — upstream's record of a setup run: file paths, context, KV
  and vision decisions, plus the keys the web app's **Model settings** card saves (`fit_max_tokens`, sampling
  defaults, …). **Set Model** deletes the selected size's file when its settings change, which makes the next start
  run setup again (reusing downloaded files) and resets those keys. Inside `strata-sub`,
  `/opt/strata/strata-<tag>.json` is a link to this file; patch 0002 makes the web app save through the link.

Settings reach Strata as environment variables on every start (`FAMILY`, `MODEL`, `CONTEXT`, `VISION`, `HOST`,
`PORT`, `API_KEY`, `STRATA_API_KEY`, `STRATA_DATA`). `CONTEXT` and `VISION` take effect only through a setup run,
which is why **Set Model** forces one. `STRATA_API_KEY` overrides the key recorded in the config, so a new key
needs no setup run.

## Dependencies

None.

## Network Access and Interfaces

One HTTP interface, which StartOS fronts with TLS. The port below is the binding's internal port; StartOS gives each
of the interface's addresses its own external port, so an address never ends in `:8080`.

| Interface      | Id       | Host  | Type | Internal port | Serves                                                                                                                                                                                |
| -------------- | -------- | ----- | ---- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web UI and API | `strata` | `api` | ui   | 8080          | nginx in front of Strata: the web app (Chat, Monitor, About), OpenAI-compatible `/v1/chat/completions`, `/v1/models`, `/v1/responses`, Anthropic-compatible `/v1/messages`, `/health` |

There is no proxy-level (`addSsl.auth`) gate: it would refuse every app sending a key. nginx sorts each request by
its credentials instead:

- **An app's request** — one carrying `x-api-key` or `Authorization: Bearer …` — goes to Strata untouched, and
  Strata checks the key. Every `/v1/*` request gets `401` from Strata without a valid key. A request whose prompt plus
  `max_tokens` exceeds the context is refused with `400` unless `fit_max_tokens` is on (Strata's runtime setting in
  the model's config file). Because a key is always set, Strata's own Host allow-list and cross-origin refusal are
  off, which is what lets requests through the StartOS proxy.
- **Any other request** is a browser's. nginx demands HTTP Basic auth (`admin` + `uiPassword`, realm `Strata`) from
  `/etc/nginx/strata.htpasswd` (`{SSHA}`), then replaces `Authorization` with `Bearer <API key>` and forwards with
  the original `Host` (Strata accepts its page's own requests only when `Origin` matches `Host`). Because the
  password then stands in for the key, nginx answers `403` to a browser request whose `Origin` is not its own `Host`
  (another site's page riding on the saved login); one with no `Origin`, such as a navigation, passes. A new password
  is rewritten into the htpasswd file without a restart.
- The web app's **About → Settings** has an API key field kept in the browser's `localStorage` (`strata.apikey`), which
  the page sends as `Bearer` on every request. nginx would pass that through like an app's key, so once the key is
  rotated the page fails with "API key needed". nginx therefore adds a script to Strata's HTML pages that removes
  `strata.apikey` before the app loads, and hides the field.
- `/health`, `/api/health` and the favicon need no credentials.

The gate is nginx's on every address, the bridge address included. While Strata is down (downloading, preparing or
loading the model) nginx answers `502` with a self-refreshing "not ready yet" HTML page, to apps as well as browsers.

When nothing listens on 8080 (nginx down, or the container stopped), the StartOS proxy cannot reach the backend and
refuses the TLS handshake with an `unrecognized_name` alert. Browsers show it as a certificate error (Firefox:
`SSL_ERROR_UNRECOGNIZED_NAME_ALERT`) and apps as a TLS failure, not as a refused connection. The **Web UI** health
check reports this case.

**Other services on the server** reach the interface at its bridge address, `http://10.0.3.1:<assigned port>/v1`,
which **API Key** shows below the key. The Interfaces page does not list bridge addresses, and the LAN `https`
address fails for those services because they don't trust the server's root CA.

## Installation and First-Run Flow

Nothing is downloaded at install. Three critical tasks block the first start until the user runs **API Key**,
**Set Web UI Password** and **Set Model**. On the first start after that, the entrypoint downloads the chosen size from Hugging Face (58–84 GB
plus a ~6 GB draft layer), prepares its pack, records `config/strata-<tag>.json`, and only then loads the model. That
can take hours on a slow connection. Later starts skip straight to loading, which takes 1–3 minutes while Strata reads
35–55 GB into RAM and page-locks part of it.

Upstream's setup measures RAM from `/proc/meminfo`, which is the whole server's.

## Actions

Four actions, all safe to run in any state.

- **API Key** (`api-key`) — its one input is the API key itself, prefilled with the current key in a masked field:
  the eye reveals it for copying, and the field's refresh button puts a new random 40-character key in it (with a
  confirmation). Submit saves the field to `credentials.json` only if it changed (letters and digits only, at least
  16, since nginx embeds the key in a quoted header value); a change restarts the running server, which reloads the
  model (1–3 minutes), and every client must be given the new key. The result shows the key (masked, copyable) and,
  below it, the interface's bridge Base URL (`http://10.0.3.1:<port>/v1`) for Open WebUI and other services on the
  same server. With no key yet (the install task), the field opens with a freshly generated key, so Submit sets it.
- **Set Model** — chooses the size, context (32K/64K/128K) and image support. Sizes above the server's RAM floor are
  disabled. A size whose shards all carry setup's `.done` mark is labelled "downloaded"; every other size shows its
  download size. Submitting the same values is a no-op. Any change restarts Strata; a size not yet on disk is downloaded
  and prepared on that start, and a changed context or image setting for a downloaded size re-runs setup without
  re-downloading. Old sizes stay on disk.
- **Set Web UI Password** — generates a 32-character password, writes `uiPassword` to `store.json`, and returns the
  username `admin` and the password (masked, copyable). Rotating it rewrites nginx's password file without
  restarting Strata.
- **Delete Models** — lists every size with files on disk (`models/<SIZE>/`, `packs/<size>/`, its config), with its
  size and the part shared with another size. The size in use is disabled and refused. Deletes the selected sizes'
  folders and configs, then checks they are gone. The vision encoder and the MTP draft layer are shared and stay.

## Tasks

All three are created by the package at init and are `critical`, so the service cannot start while any is open.

| Task                | Raised when                      | Cleared by                  |
| ------------------- | -------------------------------- | --------------------------- |
| API Key             | `credentials.json` has no key    | running API Key             |
| Set Web UI Password | `store.json` has no `uiPassword` | running Set Web UI Password |
| Set Model           | `store.json` has no preset       | running Set Model           |

None returns unless the file is emptied by hand.

## Health Checks

Two checks, listed in this order.

**Strata API** (`primary`, 15-minute grace period). While the selected size has no recorded config, setup is
running, and the check reads the files under `models/<SIZE>/` to say how far it is:

- **Loading — "Downloading the model: X of Y GB (Z%)"**: the shards and their `.part` files on disk against the
  size's download. Expected on a first start and after picking a new size. The logs print a progress line every
  30 seconds (patch 0001). Not a fault.
- **Loading — "The model is downloaded. Preparing it and applying its settings"**: every shard has its `.done` mark,
  so setup is preparing the pack, fetching the MTP draft layer (first time only) or just re-applying a changed context
  or image setting. Minutes, not hours.
- **Loading — "The model is loading"** after setup: the model is being loaded into RAM (1–3 minutes, longer on a
  first load). It stays a loading state past the grace period, which a first start spends downloading. If the engine
  runs out of RAM the daemon exits and the check shows `primary daemon exited`; look in the logs for
  `the engine stopped unexpectedly` or an OOM kill, which mean the server does not have enough free RAM for that
  size — pick a smaller one.
- **Success**: Strata's port 8082 is open, which happens once the model is loaded.

**Web UI** (`web-ui`): nginx listening on 8080, since every browser and app goes through it.

- **Failure — "The web server in front of Strata is not answering"**: nginx is down, so every address fails with the
  TLS error described under [Network Access and Interfaces](#network-access-and-interfaces), whatever the model is
  doing. Restart the service; if it recurs, read the `web-ui` lines in the logs.
- **Loading — "Waiting for the Strata API"**: nginx is up but Strata is not, so the page shows "not ready yet".
- **Success**: both nginx and Strata are listening.

## Backups and Restore

Volume copies: `public` whole, and only the `startos/` directory of `main`. Models, packs, the draft layer and
`config/` are deliberately excluded — together they are 70 GB or more per size, all re-downloadable, and `config/`
only describes files that are not in the backup.

A restored instance keeps its API key, Web UI password and model choice, so no task is raised, but its first start downloads and
prepares the model again before it answers.

## Limitations and Differences

1. NVIDIA only. Upstream's AMD (HIP) engine, Intel Arc and older-CPU builds are not packaged.
2. Multi-GPU options (`GPUS`, `LAYER_SPLIT`), the low-RAM mode switch (`LOW_RAM` stays `auto`), KV precision,
   `parallel` and calibration are not exposed.
3. The Unsloth and OrcaRouter models are not offered.
4. Upstream's MCP server (`tools/strata_mcp.py`) is not run.
5. Upstream's Docker instructions add `--ulimit memlock=-1`. The package sets no memlock limit; the engine page-locks
   its GPU share through the NVIDIA driver and loads under a default 8 MiB limit.
6. The engine is built with an AVX2 baseline rather than for the build machine's CPU; Strata's own AVX-512 kernels
   are still chosen at run time.

---

## Quick Reference for AI Consumers

```yaml
package_id: strata
images:
  strata: built from Dockerfile (nvidia/cuda runtime base, patches/ applied)
  nginx: nginx:1.28.0-alpine
architectures: [x86_64]
subcontainers: [strata-sub, web-ui]
volumes:
  main: /data
  public: not mounted
file_models:
  - main:startos/store.json
  - public:credentials.json
startos_managed_env_vars:
  - STRATA_DATA
  - FAMILY
  - MODEL
  - CONTEXT
  - VISION
  - HOST
  - PORT
  - API_KEY
  - STRATA_API_KEY
dependencies: none
interfaces:
  strata:
    {
      host: api,
      type: ui,
      port: 8080 (nginx; Strata on internal 8082),
      auth: API key checked by Strata for apps; nginx basic auth admin/uiPassword for browsers,
    }
actions:
  - api-key
  - set-ui-password
  - set-model
  - delete-models
tasks:
  - { action: api-key, severity: critical }
  - { action: set-ui-password, severity: critical }
  - { action: set-model, severity: critical }
health_checks:
  - primary (Strata API: download/prepare/load progress)
  - web-ui (Web UI: nginx on 8080, then waits on Strata)
```
