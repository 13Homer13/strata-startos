import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiHostId,
  apiPort,
  uiHostId,
  uiPort,
  uiRealm,
  uiUsername,
} from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // Apps send the API key, which Strata checks itself: no gate here, or
  // clients sending x-api-key (Anthropic SDKs) would be refused.
  const apiOrigin = await sdk.MultiHost.of(effects, apiHostId).bindPort(
    apiPort,
    { protocol: 'http' },
  )
  const api = sdk.createInterface(effects, {
    name: i18n('API'),
    id: 'api',
    description: i18n(
      'The OpenAI- and Anthropic-compatible API at /v1 for apps and coding agents. Needs the API key.',
    ),
    type: 'api',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  const receipts = [await apiOrigin.export([api])]

  // The Set Web UI Password task blocks the first start, so until a password
  // exists there is nothing behind this interface to gate.
  const password = await storeJson.read((s) => s.uiPassword).const(effects)
  if (password) {
    const uiOrigin = await sdk.MultiHost.of(effects, uiHostId).bindPort(
      uiPort,
      {
        protocol: 'http',
        addSsl: {
          auth: {
            type: 'basic',
            credentials: [{ username: uiUsername, password }],
            realm: uiRealm,
          },
        },
      },
    )
    const ui = sdk.createInterface(effects, {
      name: i18n('Web UI'),
      id: 'ui',
      description: i18n(
        "Strata's chat and monitor page. Log in as admin with the password from Set Web UI Password.",
      ),
      type: 'ui',
      masked: false,
      schemeOverride: null,
      username: null,
      path: '',
      query: {},
    })
    receipts.push(await uiOrigin.export([ui]))
  }

  return receipts
})
