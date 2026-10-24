// The one interface: nginx on apiPort, in front of Strata on strataPort. It
// passes API-key requests through and puts the web app behind the UI password.
export const apiHostId = 'api'
export const apiPort = 8080
export const strataPort = 8082
export const uiUsername = 'admin'
export const uiRealm = 'Strata'

export type Preset = {
  family: 'qwen' | 'swift' | 'coder'
  model: 'Q2_0' | 'IQ2_XS' | 'IQ3_XXS' | 'IQ3_S' | 'IQ1_M'
  ramGB: number
  downloadGB: number
}

// From setup.py's MODELS and FAMILIES tables; ramGB is upstream's own floor.
export const presets = {
  iq2_xs: { family: 'qwen', model: 'IQ2_XS', ramGB: 48, downloadGB: 68 },
  q2_0: { family: 'qwen', model: 'Q2_0', ramGB: 48, downloadGB: 66 },
  iq3_xxs: { family: 'qwen', model: 'IQ3_XXS', ramGB: 60, downloadGB: 76 },
  iq3_s: { family: 'qwen', model: 'IQ3_S', ramGB: 62, downloadGB: 84 },
  coder: { family: 'coder', model: 'IQ1_M', ramGB: 32, downloadGB: 58 },
  'swift-iq2_xs': {
    family: 'swift',
    model: 'IQ2_XS',
    ramGB: 48,
    downloadGB: 68,
  },
  'swift-iq3_xxs': {
    family: 'swift',
    model: 'IQ3_XXS',
    ramGB: 60,
    downloadGB: 76,
  },
} as const satisfies Record<string, Preset>

export type PresetId = keyof typeof presets

export const contexts = ['32768', '65536', '131072'] as const

// The image's layout in the main volume (/data): `strata launch --data-dir`
// holds the model files, STRATA_INSTALL_DIR the run settings.
export const dataDir = 'Strata-data'
export const installDir = 'install'

// setup.py's tag for a family and model: models/<tag>/ holds the downloaded
// shards, packs/<tag in lower case>/ the prepared model.
export const modelTag = (preset: Preset) =>
  `${preset.family === 'qwen' ? '' : `${preset.family}-`}${preset.model}`

// Every preset is two shards (setup.py's model_shards).
export const modelShards = 2

// The run settings setup.py writes into installDir for a tag. The server keeps
// <name>.bak, .log and .shared-settings.json beside it.
export const configFile = (preset: Preset) =>
  `strata-${modelTag(preset).toLowerCase()}.json`
