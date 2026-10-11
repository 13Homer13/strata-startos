# Strata

## Documentation

- [Which model?](https://github.com/Niko1221/Strata/blob/main/docs/MODELS.md) — the sizes, what each needs and how fast it is
- [Details](https://github.com/Niko1221/Strata/blob/main/docs/DETAILS.md) — the API, thinking levels, images and the Responses API
- [Troubleshooting](https://github.com/Niko1221/Strata/blob/main/docs/TROUBLESHOOTING.md) — slow starts, out-of-memory stops and other problems

## What you get on StartOS

Two interfaces:

- **Web UI** — Strata's own web app: **Chat**, a live **Monitor** of the model and your GPU, CPU and RAM, and
  **About**. Your browser asks for a username and password: the username is `admin`, the password comes from
  **Set Web UI Password**. Nothing else to enter: the page uses Strata's API key for you.
- **API** — what your apps use, protected by the API key from **Set API Key**:
  - OpenAI-compatible: the API interface address followed by `/v1`
  - Anthropic-compatible: the API interface address itself (apps add `/v1/messages`)

Any model name works.

## Getting set up

1. Run **Set API Key** and save the key somewhere safe.
2. Run **Set Web UI Password** and save the password.
3. Run **Set Model**. If you're not sure, take **IQ2_XS** with images off. Pick the context by what you'll use it for:
   32K is enough for chatting, but coding agents such as opencode need **128K** (their instructions alone take about
   10K tokens). The Coder fits 32 GB of RAM and is good at code, but weaker at everything else.
4. Start Strata. The first start downloads the model (58–84 GB) and prepares it, which can take hours. The
   **Strata API** check shows how much is downloaded, then that the model is being prepared, then that it is loading.
   The logs print the download's progress every 30 seconds.
5. When the check turns green, open the **Web UI** interface, log in, and send a chat to make sure it answers.

Every later start skips the download and takes 1–3 minutes to load the model.

## Connecting apps

Apps on other devices use the address of the **API** interface plus `/v1`, for example
`https://192.168.1.50:49321/v1`, and the key from **Set API Key**. Those addresses use HTTPS with your server's own
certificate, so the device running the app needs to trust your server's root CA.

### Open WebUI (and other services on this server)

Services running on the same StartOS server don't trust that certificate, so the LAN address fails with a network
error. Use the internal address instead:

1. Run **Connection Info** in Strata. It shows a **Base URL** like `http://10.0.3.1:<port>/v1` and the API key.
2. In Open WebUI, open **Admin Panel → Settings → Connections**.
3. Under **OpenAI API**, add a connection with that Base URL and the API key, and save. Strata must be running and
   its health check green for the model to appear in Open WebUI's model list.

### opencode

Add a provider to `~/.config/opencode/opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "strata": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Strata",
      "options": {
        "baseURL": "https://192.168.1.50:49321/v1",
        "apiKey": "{env:STRATA_API_KEY}"
      },
      "models": {
        "strata": {
          "name": "Strata",
          "limit": { "context": 131072, "output": 16384 }
        }
      }
    }
  }
}
```

Set `context` to exactly the context you chose in **Set Model** (32768, 65536 or 131072): opencode shortens the
conversation before it reaches that limit. If it is larger than Strata's, a long session fails with "prompt plus max
tokens exceeds the context". opencode sends its instructions and tool list with every message, so even "Hi" uses
about 10K tokens, which is why 128K is the context to pick for it.

Then start it with your key and your server's root CA:

```bash
STRATA_API_KEY=<your key> NODE_EXTRA_CA_CERTS=/path/to/your-server-root-ca.crt opencode
```

### Desktop chat apps

Choose an "OpenAI-compatible" provider, enter the base URL and the API key, and type any model name. If an app
reports that the prompt plus max tokens exceeds the context, lower its maximum output, or turn on
**fit_max_tokens** in the **Model settings** card on the Web UI's **About** tab so Strata shortens the reply instead.
That only helps when the prompt itself still fits: a conversation longer than the context needs a larger context.

### Claude Code and other Anthropic-API apps

Set `ANTHROPIC_BASE_URL` to the API interface address without `/v1`, and `ANTHROPIC_API_KEY` to your key.

## Changing the model

Run **Set Model** again. Strata restarts. A size you haven't used before is downloaded on that start. Changing only
the context or images re-applies the model you already have, which takes a few minutes, not hours. Settings you saved
in the Web UI's **Model settings** card go back to their defaults when Set Model changes anything.

Each size stays on disk (60–85 GB each). To free space, run **Delete Models** and pick the sizes you no longer use;
the one in use can't be deleted.

## Changing the API key or password

Running **Set API Key** again makes a new key and restarts Strata. Every app, including Open WebUI, needs the new
key. Running **Set Web UI Password** again makes a new password without restarting anything.

## Backups

A backup holds your API key, Web UI password and model choice, not the model itself (60–85 GB). After a restore, the
first start downloads the model again.

## Limitations

- Strata needs an NVIDIA graphics card (RTX 20 series or newer, 12 GB of video memory recommended), at least 32 GB of
  RAM and an AVX2 processor. While the model loads, the whole server can be slow for a few minutes.
- On the Web UI, leave the API key field under **About → Settings** empty: the page already uses the key, and a key
  typed there makes the browser stop sending your login.
