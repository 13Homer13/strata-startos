import { createHash, randomBytes } from 'node:crypto'
import { access } from 'node:fs/promises'
import { credentialsJson } from './fileModels/credentials.json'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { downloadProgress, formatGB } from './modelFiles'
import { sdk } from './sdk'
import {
  apiPort,
  configFile,
  presets,
  uiPort,
  uiRealm,
  uiUsername,
} from './utils'

// nginx's {SSHA} scheme: base64(sha1(password + salt) + salt).
const htpasswdLine = (password: string) => {
  const salt = randomBytes(8)
  const digest = createHash('sha1').update(password).update(salt).digest()
  return `${uiUsername}:{SSHA}${Buffer.concat([digest, salt]).toString('base64')}\n`
}

// The OS proxy checks the password on the LAN, Tor and domain addresses; nginx
// checks it again because the bridge address skips the proxy. It then hands
// Strata the API key, so the web app works without one pasted into it.
const nginxConf = (apiKey: string) => `server {
    listen ${uiPort};
    listen [::]:${uiPort};
    auth_basic "${uiRealm}";
    auth_basic_user_file /etc/nginx/strata.htpasswd;
    client_max_body_size 0;

    location / {
        proxy_pass http://127.0.0.1:${apiPort};
        proxy_http_version 1.1;
        # Strata accepts its own page only when Origin matches Host.
        proxy_set_header Host $http_host;
        proxy_set_header Authorization "Bearer ${apiKey}";
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
    }

    error_page 502 503 504 /strata-not-ready.html;
    location = /strata-not-ready.html {
        internal;
        root /usr/share/nginx/html;
    }
}
`

const notReadyPage = () => `<!doctype html>
<html><head><meta charset="utf-8"><meta http-equiv="refresh" content="30">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Strata</title></head>
<body style="font-family: sans-serif; max-width: 40em; margin: 4em auto; padding: 0 1em">
<h1>Strata</h1>
<p>${i18n('Strata is not ready yet: it is downloading, preparing or loading the model. The Strata API health check in StartOS shows how far it is.')}</p>
<p>${i18n('This page reloads by itself.')}</p>
</body></html>
`

export const main = sdk.setupMain(async ({ effects }) => {
  const apiKey = await credentialsJson.read((c) => c.apiKey).const(effects)
  // Not the whole store: a new UI password must not restart (and reload) the model.
  const store = await storeJson
    .read((s) => ({ preset: s.preset, context: s.context, vision: s.vision }))
    .const(effects)
  // Read once: a new password reaches nginx below without a restart.
  const uiPassword = await storeJson.read((s) => s.uiPassword).once()
  if (!apiKey)
    throw new Error(i18n('No API key. Run the "Set API Key" action.'))
  if (!store?.preset)
    throw new Error(i18n('No model chosen. Run the "Set Model" action.'))
  if (!uiPassword)
    throw new Error(
      i18n('No Web UI password. Run the "Set Web UI Password" action.'),
    )

  const preset = presets[store.preset]
  const config = sdk.volumes.main.subpath(`config/${configFile(preset)}`)
  const isSetUp = () =>
    access(config).then(
      () => true,
      () => false,
    )

  const nginxSub = sdk.SubContainer.of(
    effects,
    { imageId: 'nginx' },
    sdk.Mounts.of(),
    'web-ui',
  )
  await nginxSub.writeFile('/etc/nginx/conf.d/default.conf', nginxConf(apiKey))
  await nginxSub.writeFile(
    '/usr/share/nginx/html/strata-not-ready.html',
    notReadyPage(),
  )
  // nginx reads the password file on every request.
  await nginxSub.writeFile(
    '/etc/nginx/strata.htpasswd',
    htpasswdLine(uiPassword),
  )
  storeJson
    .read((s) => s.uiPassword)
    .onChange(effects, async (password) => {
      if (password) {
        await nginxSub.writeFile(
          '/etc/nginx/strata.htpasswd',
          htpasswdLine(password),
        )
      }
      return { cancel: false }
    })

  return sdk.Daemons.of(effects)
    .addDaemon('primary', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'strata' },
        sdk.Mounts.of().mountVolume({
          volumeId: 'main',
          subpath: null,
          mountpoint: '/data',
          readonly: false,
        }),
        'strata-sub',
      ),
      exec: {
        command: ['/opt/strata/docker-entrypoint.sh'],
        cwd: '/opt/strata',
        // The engine releases tens of GB of page-locked RAM on SIGTERM.
        sigtermTimeout: 180_000,
        env: {
          STRATA_DATA: '/data',
          FAMILY: preset.family,
          MODEL: preset.model,
          CONTEXT: store.context,
          VISION: store.vision,
          HOST: '0.0.0.0',
          PORT: String(apiPort),
          API_KEY: apiKey,
          // Overrides the key recorded in the model's config at setup.
          STRATA_API_KEY: apiKey,
        },
      },
      ready: {
        display: i18n('Strata API'),
        gracePeriod: 15 * 60 * 1000,
        fn: async () => {
          const res = await sdk.healthCheck.checkPortListening(
            effects,
            apiPort,
            {
              successMessage: i18n('The model is loaded and the API is ready'),
              errorMessage: i18n('The model is loading'),
            },
          )
          if (res.result === 'success' || (await isSetUp())) return res
          // No config yet: setup.py is running (first start, or Set Model).
          const { bytes, done } = await downloadProgress(preset)
          if (done) {
            return {
              result: 'loading',
              message: i18n(
                'The model is downloaded. Preparing it and applying its settings: a few minutes, longer the first time.',
              ),
            }
          }
          const total = preset.downloadGB * 1e9
          return {
            result: 'loading',
            message: i18n(
              'Downloading the model: ${done} of ${total} GB (${percent}%)',
              {
                done: formatGB(bytes),
                total: preset.downloadGB,
                percent: Math.min(99, Math.floor((100 * bytes) / total)),
              },
            ),
          }
        },
      },
      requires: [],
    })
    .addDaemon('web-ui', {
      subcontainer: nginxSub,
      exec: { command: ['nginx', '-g', 'daemon off;'] },
      ready: {
        display: i18n('Web UI'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The Web UI is ready'),
            errorMessage: i18n('The Web UI is not ready'),
          }),
      },
      requires: [],
    })
})
