import { i18n } from './i18n'
import { sdk } from './sdk'
import { apiHostId, apiPort } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // nginx checks the Web UI password itself, and only for requests without an
  // API key: a proxy gate here would refuse every app sending one.
  const origin = await sdk.MultiHost.of(effects, apiHostId).bindPort(apiPort, {
    protocol: 'http',
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI and API'),
    id: 'strata',
    description: i18n(
      'The chat page, behind the Web UI password, and the OpenAI- and Anthropic-compatible API at /v1, which needs the API key.',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })
  return [await origin.export([ui])]
})
