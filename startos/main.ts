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
  strataPort,
  uiRealm,
  uiUsername,
} from './utils'

// nginx's {SSHA} scheme: base64(sha1(password + salt) + salt).
const htpasswdLine = (password: string) => {
  const salt = randomBytes(8)
  const digest = createHash('sha1').update(password).update(salt).digest()
  return `${uiUsername}:{SSHA}${Buffer.concat([digest, salt]).toString('base64')}\n`
}

// A request carrying an API key is an app's, and Strata checks the key. Any
// other is a browser's: nginx asks for the Web UI password, then hands Strata
// the API key, so the web app works without one pasted into it.
const nginxConf = (
  apiKey: string,
) => `map "$http_x_api_key:$http_authorization" $strata_realm {
    "~^[^:]" off;
    "~*^:Bearer " off;
    default "${uiRealm}";
}

map $strata_realm $strata_authorization {
    off $http_authorization;
    default "Bearer ${apiKey}";
}

# The browser's password stands in for the key, so another site's page must not
# ride on it: like Strata, take a browser's request only from Strata's own page
# (Origin matching Host) or with no Origin (a navigation).
map "$strata_realm|$http_origin|$http_host" $strata_foreign {
    "~^off\\|" 0;
    "~^[^|]*\\|\\|" 0;
    "~*^[^|]*\\|https?://([^|/]+)/?\\|\\1$" 0;
    default 1;
}

server {
    listen ${apiPort};
    listen [::]:${apiPort};
    auth_basic $strata_realm;
    auth_basic_user_file /etc/nginx/strata.htpasswd;
    client_max_body_size 0;

    if ($strata_foreign) {
        return 403;
    }

    location / {
        proxy_pass http://127.0.0.1:${strataPort};
        proxy_http_version 1.1;
        # Strata accepts its own page only when Origin matches Host.
        proxy_set_header Host $http_host;
        proxy_set_header Authorization $strata_authorization;
        # Uncompressed, so sub_filter can give Strata's pages an icon, and drop
        # the key the page keeps in the browser (About > Settings): it would be
        # sent as a Bearer, passed through, and refused once the key changes.
        proxy_set_header Accept-Encoding "";
        sub_filter '</head>' '<link rel="icon" type="image/svg+xml" href="/favicon.svg"><script>try{localStorage.removeItem("strata.apikey")}catch(e){}</script><style>.st-field:has(#api-key){display:none}</style></head>';
        sub_filter_once on;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 1h;
        proxy_send_timeout 1h;
    }

    # Strata answers these without a key.
    location ~ ^/(api/)?health$ {
        auth_basic off;
        proxy_pass http://127.0.0.1:${strataPort};
    }

    location = /favicon.svg {
        auth_basic off;
        types { }
        default_type image/svg+xml;
        alias /usr/share/nginx/strata/favicon.svg;
    }

    location = /favicon.ico {
        auth_basic off;
        types { }
        default_type image/svg+xml;
        alias /usr/share/nginx/strata/favicon.svg;
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
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Strata</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"></head>
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
  if (!apiKey) throw new Error(i18n('No API key. Run the "API Key" action.'))
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
    sdk.Mounts.of().mountAssets({
      subpath: null,
      mountpoint: '/usr/share/nginx/strata',
    }),
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
          PORT: String(strataPort),
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
            strataPort,
            {
              successMessage: i18n('The model is loaded and the API is ready'),
              errorMessage: i18n('The model is loading'),
            },
          )
          if (res.result === 'success') return res
          // Loading, not failure: after an hours-long first download the grace
          // period is long gone. A crash still shows, as the daemon exiting.
          if (await isSetUp()) return { ...res, result: 'loading' }
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
      // Every browser and app goes through nginx. With nothing listening the OS
      // proxy refuses the TLS handshake, which reads as a certificate error.
      ready: {
        display: i18n('Web UI'),
        fn: async () => {
          const proxy = await sdk.healthCheck.checkPortListening(
            effects,
            apiPort,
            {
              successMessage: i18n('The Web UI is ready'),
              errorMessage: i18n(
                'The web server in front of Strata is not answering, so the Web UI and the API are unreachable. Restart Strata; if it happens again, check the logs.',
              ),
            },
          )
          if (proxy.result !== 'success') return proxy
          // nginx answers with the "not ready yet" page until Strata listens.
          const api = await sdk.healthCheck.checkPortListening(
            effects,
            strataPort,
            { successMessage: '', errorMessage: '' },
          )
          return api.result === 'success'
            ? proxy
            : { result: 'loading', message: i18n('Waiting for the Strata API') }
        },
      },
      requires: [],
    })
})
