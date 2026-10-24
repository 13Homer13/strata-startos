import { utils } from '@start9labs/start-sdk'
import { credentialsJson } from '../fileModels/credentials.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiHostId, apiPort } from '../utils'

const { InputSpec, Value } = sdk

// The key goes into nginx's config inside double quotes, so letters and
// digits only.
const keyCharset = { charset: 'a-z,A-Z,0-9', len: 40 }

const inputSpec = InputSpec.of({
  apiKey: Value.text({
    name: i18n('API Key'),
    description: i18n(
      'Click the eye to show the key and copy it. The refresh button makes a new key; Submit saves it.',
    ),
    warning: i18n(
      'Replaces the current API key. Strata restarts to apply it, and every app using the old key needs the new one.',
    ),
    default: null,
    required: true,
    masked: true,
    minLength: 16,
    patterns: [
      {
        regex: '^[A-Za-z0-9]+$',
        description: i18n('Letters and digits only.'),
      },
    ],
    generate: keyCharset,
  }),
})

export const apiKey = sdk.Action.withInput(
  'api-key',

  async ({ effects }) => ({
    name: i18n('API Key'),
    description: i18n(
      'See and copy the key that apps, coding agents and Open WebUI send to use Strata, or make a new one.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  // With no key yet (the install task), the form opens with a new one.
  async ({ effects }) => {
    const current = await credentialsJson.read((c) => c.apiKey).once()
    return { apiKey: current || utils.getDefaultString(keyCharset) }
  },

  async ({ effects, input }) => {
    const current = await credentialsJson.read((c) => c.apiKey).once()
    const key = input.apiKey
    const changed = key !== current
    if (changed) await credentialsJson.merge(effects, { apiKey: key })

    // The bridge address: plain HTTP inside the server, so a service that does
    // not trust this server's root CA still connects. The Interfaces page
    // never lists it.
    const bridge = await sdk.host
      .getBridgeAddress(effects, {
        hostId: apiHostId,
        internalPort: apiPort,
        ssl: false,
      })
      .once()

    return {
      version: '1',
      title: changed ? i18n('API Key Set') : i18n('API Key'),
      message: i18n(
        'Apps on other devices use this key with the Web UI and API interface address followed by /v1.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('API Key'),
            description: null,
            value: key,
            masked: true,
            copyable: true,
            qr: false,
            launchable: false,
          },
          ...(bridge
            ? [
                {
                  type: 'single' as const,
                  name: i18n('Base URL for services on this server'),
                  description: i18n(
                    'For Open WebUI and other services on this StartOS server, which cannot use the interface addresses.',
                  ),
                  value: `http://${bridge}/v1`,
                  masked: false,
                  copyable: true,
                  qr: false,
                  launchable: false,
                },
              ]
            : []),
        ],
      },
    }
  },
)
