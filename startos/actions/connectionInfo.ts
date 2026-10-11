import { credentialsJson } from '../fileModels/credentials.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { apiHostId, apiPort } from '../utils'

export const connectionInfo = sdk.Action.withoutInput(
  'connection-info',

  async ({ effects }) => ({
    name: i18n('Connection Info'),
    description: i18n(
      'Show the address and API key that other services on this server, such as Open WebUI, use to reach Strata.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const apiKey = await credentialsJson.read((c) => c.apiKey).once()
    if (!apiKey) {
      throw new Error(i18n('No API key. Run the "Set API Key" action.'))
    }
    // The bridge address: plain HTTP inside the server, so a service that does
    // not trust this server's root CA still connects.
    const bridge = await sdk.host
      .getBridgeAddress(effects, {
        hostId: apiHostId,
        internalPort: apiPort,
        ssl: false,
      })
      .once()
    if (!bridge) {
      throw new Error(i18n('The Strata API has no internal address yet.'))
    }

    return {
      version: '1',
      title: i18n('Connection Info'),
      message: i18n(
        'For services on this server, such as Open WebUI. Apps on other devices use the API interface address followed by /v1 instead.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Base URL'),
            description: null,
            value: `http://${bridge}/v1`,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('API Key'),
            description: null,
            value: apiKey,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
