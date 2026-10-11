<p align="center">
  <img src="icon.svg" alt="Strata Logo" width="21%">
</p>

# Strata on StartOS

> Everything not listed in this document should behave the same as upstream
> Strata. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation section of
> `instructions.md` for links.

[Strata](https://github.com/Niko1221/Strata) is an inference engine that runs the Qwen3.8-Flash-Next model on one
consumer NVIDIA graphics card by splitting it across GPU, RAM and disk. It serves an OpenAI-compatible API (`/v1/chat/completions`, `/v1/models`, `/v1/responses`), an Anthropic-compatible one (`/v1/messages`), and its own web app. This package builds the engine, runs it on the StartOS NVIDIA image, gates every API request with an API key the package generates, and puts the web app behind a password on its own interface.

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
| Web UI proxy  | `nginx:1.28.0-alpine`, the `web-ui` daemon                                                                                                                  |

Two subcontainers. `strata-sub` runs the daemon `primary` (Strata). `web-ui` runs nginx, which checks the Web UI
password and forwards to Strata on `127.0.0.1:8080` with `Authorization: Bearer <API key>` added. To look inside one:
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
- **`public:credentials.json`** — the API key. Seeded empty at install, written only by **Set API Key**.
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

Two HTTP interfaces, which StartOS fronts with TLS.

| Interface | Id    | Host  | Type | Port | Serves                                                                                                                                                                                                              |
| --------- | ----- | ----- | ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API       | `api` | `api` | api  | 8080 | Strata's server directly: OpenAI-compatible `/v1/chat/completions`, `/v1/models`, `/v1/responses`; Anthropic-compatible `/v1/messages`; `/health`; also the web app at `/`, usable only with the key pasted into it |
| Web UI    | `ui`  | `ui`  | ui   | 8081 | nginx in front of the same server: the web app (Chat, Monitor, About) with the API key added for it                                                                                                                 |

**API.** Every `/v1/*` request needs the API key as `Authorization: Bearer <key>` or `x-api-key: <key>`, and gets
`401` without it; `/health` does not. There is no proxy-level gate on this interface, because one would refuse
`x-api-key` clients. A request whose prompt plus `max_tokens` exceeds the context is refused with `400` unless
`fit_max_tokens` is on (Strata's runtime setting in the model's config file). Because a key is always set, Strata's
own Host allow-list and cross-origin refusal are off, which is what lets requests through the StartOS proxy.

**Web UI.** The StartOS proxy demands HTTP Basic auth (`admin` + `uiPassword`, realm `Strata`) on its LAN, Tor and
domain addresses. nginx checks the same credentials again from `/etc/nginx/strata.htpasswd` (`{SSHA}`), because
the bridge address reaches it without the proxy, then replaces `Authorization` with the API key and forwards with
the original `Host` (Strata accepts its page's own requests only when `Origin` matches `Host`). A new password is
rewritten into the htpasswd file without a restart. While Strata is down nginx answers with a self-refreshing
"not ready yet" page. The interface is exported only once a password exists.

**Other services on the server** reach the API at its bridge address, `http://10.0.3.1:<assigned port>/v1`, which
**Connection Info** shows. The LAN address fails for them: they don't trust the server's root CA.

Strata's port only opens once the model is loaded, so the API refuses connections while a model downloads or loads.

## Installation and First-Run Flow

Nothing is downloaded at install. Three critical tasks block the first start until the user runs **Set API Key**,
**Set Web UI Password** and **Set Model**. On the first start after that, the entrypoint downloads the chosen size from Hugging Face (58–84 GB
plus a ~6 GB draft layer), prepares its pack, records `config/strata-<tag>.json`, and only then loads the model. That
can take hours on a slow connection. Later starts skip straight to loading, which takes 1–3 minutes while Strata reads
35–55 GB into RAM and page-locks part of it.

Upstream's setup measures RAM from `/proc/meminfo`, which is the whole server's.

## Actions

Five actions, all safe to run in any state.

- **Set API Key** — generates a 40-character key, writes `credentials.json`, and returns it (masked, copyable). Run it
  once at install and again to rotate. Running it again replaces the key: the running server restarts and reloads the
  model (1–3 minutes), and every client must be given the new key.
- **Set Model** — chooses the size, context (32K/64K/128K) and image support. Sizes above the server's RAM floor are
  disabled. Submitting the same values is a no-op. Any change restarts Strata; a size not yet on disk is downloaded
  and prepared on that start, and a changed context or image setting for a downloaded size re-runs setup without
  re-downloading. Old sizes stay on disk.
- **Set Web UI Password** — generates a 32-character password, writes `uiPassword` to `store.json`, and returns the
  username `admin` and the password (masked, copyable). Rotating it updates the proxy gate and nginx's password file
  without restarting Strata.
- **Connection Info** — shows the API's bridge Base URL (`http://10.0.3.1:<port>/v1`) and the API key, for Open WebUI
  and other services on the same server.
- **Delete Models** — lists every size with files on disk (`models/<SIZE>/`, `packs/<size>/`, its config), with its
  size and the part shared with another size. The size in use is disabled and refused. Deletes the selected sizes'
  folders and configs, then checks they are gone. The vision encoder and the MTP draft layer are shared and stay.

## Tasks

All three are created by the package at init and are `critical`, so the service cannot start while any is open.

| Task                | Raised when                      | Cleared by                  |
| ------------------- | -------------------------------- | --------------------------- |
| Set API Key         | `credentials.json` has no key    | running Set API Key         |
| Set Web UI Password | `store.json` has no `uiPassword` | running Set Web UI Password |
| Set Model           | `store.json` has no preset       | running Set Model           |

None returns unless the file is emptied by hand. An install updated from `0.1.41:0` gets the Web UI Password task.

## Health Checks

Two checks.

**Strata API** (`primary`), with a 15-minute grace period. While the selected size has no recorded config, setup is
running, and the check reads the files under `models/<SIZE>/` to say how far it is:

- **Loading — "Downloading the model: X of Y GB (Z%)"**: the shards and their `.part` files on disk against the
  size's download. Expected on a first start and after picking a new size. The logs print a progress line every
  30 seconds (patch 0001). Not a fault.
- **Loading — "The model is downloaded. Preparing it and applying its settings"**: every shard has its `.done` mark,
  so setup is preparing the pack, fetching the MTP draft layer (first time only) or just re-applying a changed context
  or image setting. Minutes, not hours.
- **Starting / "The model is loading"** after setup: the model is being loaded into RAM (1–3 minutes, longer on a
  first load). Past the grace period it shows as a failure; check the logs for `the engine stopped unexpectedly` or an
  OOM kill, which mean the server does not have enough free RAM for that size — pick a smaller one.
- **Success**: the port is open and the model answers.

**Web UI** (`web-ui`): nginx is listening on 8081. It goes green right away, independent of the model.

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
7. On the Web UI, a key typed into the web app's **About → Settings** makes it send `Bearer <key>` instead of the
   browser's Basic login, which the proxy then refuses. Leave that field empty there.

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
  api: { type: api, port: 8080, auth: API key checked by Strata }
  ui:
    {
      type: ui,
      port: 8081,
      auth: proxy basic auth admin/uiPassword,
      nginx adds the API key,
    }
actions:
  - set-api-key
  - set-ui-password
  - set-model
  - connection-info
  - delete-models
tasks:
  - { action: set-api-key, severity: critical }
  - { action: set-ui-password, severity: critical }
  - { action: set-model, severity: critical }
health_checks:
  - primary
  - web-ui
```
