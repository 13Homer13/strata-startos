# Strata

Strata runs a large AI model on your own server. It splits the model between the graphics card, RAM and disk,
so a single gaming-class NVIDIA card is enough. You can chat with it in your browser, and your apps and coding agents
can use it like the OpenAI or Anthropic API. Nothing leaves your server.

The model is [Qwen3.8-Flash-Next](https://huggingface.co/Qwen/Qwen3.8-Flash-Next) (125 billion parameters). You
choose its size in **Set Model**, or pick one of two versions built on it: the **Coder**, which is made for code and
fits 32 GB of RAM, or **Swift 1.5**, which thinks for less time before it answers.

## Documentation

- [Which model?](https://github.com/Niko1221/Strata/blob/main/docs/MODELS.md) — the sizes, what each needs and how fast it is
- [Details](https://github.com/Niko1221/Strata/blob/main/docs/DETAILS.md) — the API, thinking levels, images and the Responses API
- [Troubleshooting](https://github.com/Niko1221/Strata/blob/main/docs/TROUBLESHOOTING.md) — slow starts, out-of-memory stops and other problems

## What you get on StartOS

One interface, **Web UI and API**, serves both:

- **In a browser**, Strata's own web app: **Chat**, a live **Monitor** of the model and your GPU, CPU and RAM, and
  **About**. Your browser asks for a username and password: the username is `admin`, the password comes from
  **Set Web UI Password**. Nothing else to enter: the page uses Strata's API key for you.
- **For your apps**, the API, protected by the key that the **API Key** action shows:
  - OpenAI-compatible: the interface address followed by `/v1`
  - Anthropic-compatible: the interface address itself (apps add `/v1/messages`)

Any model name works.

## Getting set up

1. Run **API Key**. The field already holds a new key: click the eye to see it, save it somewhere safe, and Submit.
2. Run **Set Web UI Password** and save the password.
3. Run **Set Model**. If you're not sure, take **IQ2_XS** with images off. Pick the context by what you'll use it for:
   32K is enough for chatting, but coding agents such as opencode need **128K** (their instructions alone take about
   10K tokens). The Coder fits 32 GB of RAM and is good at code, but weaker at everything else.
4. Start Strata. The first start downloads the model (58–84 GB) and prepares it, which can take hours. The
   **Strata API** check shows how much is downloaded, then that the model is being prepared, then that it is loading.
   The logs print the download's progress every 30 seconds.
5. When the check turns green, open the **Web UI and API** interface, log in, and send a chat to make sure it answers.

Every later start skips the download and takes 1–3 minutes to load the model.

## Connecting apps

Apps on other devices use the address of the **Web UI and API** interface plus `/v1`, for example
`https://192.168.1.50:49321/v1`, and the key from **API Key**. Those addresses use HTTPS with your server's own
certificate, so the device running the app needs to trust your server's root CA.

### Open WebUI (and other services on this server)

Services running on the same StartOS server don't trust that certificate, so the LAN address fails with a network
error. Use the internal address instead:

1. Run **API Key** in Strata and Submit without changing the key. Below the key, it shows a **Base URL for services on this server** like
   `http://10.0.3.1:<port>/v1`. The Interfaces page doesn't list this address.
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

Set `ANTHROPIC_BASE_URL` to the interface address without `/v1`, and `ANTHROPIC_API_KEY` to your key.

## Changing the model

Run **Set Model** again. Strata restarts. A size you haven't used before is downloaded on that start. Changing only
the context or images re-applies the model you already have, which takes a few minutes, not hours. Settings you saved
in the Web UI's **Model settings** card go back to their defaults when Set Model changes anything.

Each size stays on disk (60–85 GB each). To free space, run **Delete Models** and pick the sizes you no longer use;
the one in use can't be deleted.

## Changing the API key or password

Run **API Key** to see your key: click the eye next to it to show it and copy it. To replace it, click the refresh
button in the same field, then Submit. Strata restarts, and every app, including Open WebUI, needs the new key. The
Web UI needs nothing: it always uses the current key. Running **Set Web UI Password** again makes a new password
without restarting anything.

## Backups

A backup holds your API key, Web UI password and model choice, not the model itself (60–85 GB). After a restore, the
first start downloads the model again.

## If the page won't open

If your browser says **Secure Connection Failed** (in Firefox, `SSL_ERROR_UNRECOGNIZED_NAME_ALERT`) and your apps
can't connect either, Strata's web server is most likely not answering. The **Web UI** health check says so.
Restart Strata. If it keeps happening, check Strata's logs.

## Limitations

- Strata needs an NVIDIA graphics card (RTX 20 series or newer, 12 GB of video memory recommended), at least 32 GB of
  RAM and an AVX2 processor. While the model loads, the whole server can be slow for a few minutes.
