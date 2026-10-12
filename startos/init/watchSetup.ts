import { apiKey } from '../actions/apiKey'
import { setModel } from '../actions/setModel'
import { setUiPassword } from '../actions/setUiPassword'
import { credentialsJson } from '../fileModels/credentials.json'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const watchSetup = sdk.setupOnInit(async (effects) => {
  if (!(await credentialsJson.read((c) => c.apiKey).const(effects))) {
    await sdk.action.createOwnTask(effects, apiKey, 'critical', {
      reason: i18n('Set an API key so only your apps can use Strata'),
    })
  }
  if (!(await storeJson.read((s) => s.uiPassword).const(effects))) {
    await sdk.action.createOwnTask(effects, setUiPassword, 'critical', {
      reason: i18n(
        'Set a password for the Web UI so only you can open the chat page',
      ),
    })
  }
  if (!(await storeJson.read((s) => s.preset).const(effects))) {
    await sdk.action.createOwnTask(effects, setModel, 'critical', {
      reason: i18n(
        'Choose a model size before the first start; it is a 58-84 GB download',
      ),
    })
  }
})
