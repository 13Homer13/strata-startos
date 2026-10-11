import { utils } from '@start9labs/start-sdk'
import { credentialsJson } from '../fileModels/credentials.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setApiKey = sdk.Action.withoutInput(
  'set-api-key',

  async ({ effects }) => {
    const alreadySet = !!(await credentialsJson
      .read((c) => c.apiKey)
      .const(effects))
    return {
      name: alreadySet ? i18n('Reset API Key') : i18n('Set API Key'),
      description: i18n(
        'Generate the key that apps, coding agents and Open WebUI send to use Strata. Running this again replaces the existing key.',
      ),
      warning: alreadySet
        ? i18n(
            'Replaces the current API key. Strata restarts to apply it, and every app using the old key needs the new one.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const apiKey = utils.getDefaultString({ charset: 'a-z,A-Z,0-9', len: 40 })
    await credentialsJson.merge(effects, { apiKey })

    return {
      version: '1',
      title: i18n('API Key Set'),
      message: i18n(
        'Use this key with the API interface address followed by /v1 in any OpenAI-compatible app. Save it now: running this action again replaces it.',
      ),
      result: {
        type: 'single',
        name: i18n('API Key'),
        description: null,
        value: apiKey,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
