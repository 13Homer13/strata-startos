import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { uiUsername } from '../utils'

export const setUiPassword = sdk.Action.withoutInput(
  'set-ui-password',

  async ({ effects }) => {
    const alreadySet = !!(await storeJson
      .read((s) => s.uiPassword)
      .const(effects))
    return {
      name: alreadySet
        ? i18n('Reset Web UI Password')
        : i18n('Set Web UI Password'),
      description: i18n(
        'Generate the password your browser asks for on the Web UI. The username is always "admin".',
      ),
      warning: alreadySet
        ? i18n(
            'Replaces the current password. Browsers logged in with the old one are asked to log in again.',
          )
        : null,
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })
    await storeJson.merge(effects, { uiPassword: password })

    return {
      version: '1',
      title: i18n('Web UI Password Set'),
      message: i18n(
        'Log in to the Web UI with these credentials. Save the password now: running this action again replaces it.',
      ),
      result: {
        type: 'group',
        value: [
          {
            type: 'single',
            name: i18n('Username'),
            description: null,
            value: uiUsername,
            masked: false,
            copyable: true,
            qr: false,
          },
          {
            type: 'single',
            name: i18n('Password'),
            description: null,
            value: password,
            masked: true,
            copyable: true,
            qr: false,
          },
        ],
      },
    }
  },
)
