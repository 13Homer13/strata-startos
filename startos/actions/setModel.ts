import { storeJson } from '../fileModels/store.json'
import { systemMemoryGB } from '../hardware'
import { i18n } from '../i18n'
import { downloadProgress } from '../modelFiles'
import { sdk } from '../sdk'
import { contexts, PresetId, presets } from '../utils'

const { InputSpec, Value } = sdk

export const presetLabels: Record<PresetId, string> = {
  iq2_xs: i18n('Qwen3.8-Flash-Next IQ2_XS (recommended)'),
  q2_0: i18n('Qwen3.8-Flash-Next Q2_0 (fastest)'),
  iq3_xxs: i18n('Qwen3.8-Flash-Next IQ3_XXS (better quality, slower)'),
  iq3_s: i18n('Qwen3.8-Flash-Next IQ3_S (best quality, slowest)'),
  coder: i18n('Coder (for coding; fits 32 GB of RAM)'),
  'swift-iq2_xs': i18n('Swift 1.5 IQ2_XS (shorter thinking)'),
  'swift-iq3_xxs': i18n('Swift 1.5 IQ3_XXS (shorter thinking)'),
}

const isPresetId = (id: string): id is PresetId => id in presets

const inputSpec = InputSpec.of({
  preset: Value.dynamicSelect(async ({ effects }) => {
    const ramGB = await systemMemoryGB(effects)
    const ids = Object.keys(presets) as PresetId[]
    const fits = (id: PresetId) => ramGB === 0 || ramGB >= presets[id].ramGB
    const label = async (id: PresetId) => {
      const { ramGB: ram, downloadGB: download } = presets[id]
      const size = (await downloadProgress(presets[id])).done
        ? i18n('${ram} GB RAM, downloaded', { ram })
        : i18n('${ram} GB RAM, ${download} GB download', { ram, download })
      return `${presetLabels[id]} · ${size}`
    }
    return {
      name: i18n('Model'),
      description: i18n(
        'Sizes this server does not have enough RAM for are disabled. A size not downloaded yet is a download of 58-84 GB.',
      ),
      default: fits('iq2_xs') ? 'iq2_xs' : 'coder',
      values: Object.fromEntries(
        await Promise.all(ids.map(async (id) => [id, await label(id)])),
      ),
      disabled: ids.filter((id) => !fits(id)),
    }
  }),
  context: Value.select({
    name: i18n('Context'),
    description: i18n(
      'How much text the model keeps in mind at once. Coding agents such as opencode need 128K. Longer contexts use more memory.',
    ),
    default: '32768',
    values: {
      '32768': '32K',
      '65536': '64K',
      '131072': '128K',
    } satisfies Record<(typeof contexts)[number], string>,
  }),
  vision: Value.select({
    name: i18n('Images'),
    description: i18n(
      'Let the model read pictures. On the GPU it needs more video memory; on the CPU it is slower but uses none.',
    ),
    default: 'no',
    values: {
      no: i18n('Off'),
      yes: i18n('On (GPU)'),
      cpu: i18n('On (CPU)'),
    },
  }),
})

export const setModel = sdk.Action.withInput(
  'set-model',

  async ({ effects }) => ({
    name: i18n('Set Model'),
    description: i18n(
      'Choose which size of the model Strata runs, how much context it keeps and whether it reads pictures. A new size is downloaded on the next start.',
    ),
    warning: i18n(
      'Strata restarts to apply this. A size not downloaded yet takes a long time to fetch and prepare, and each size stays on disk.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().once()
    if (!store?.preset) return {}
    return {
      preset: store.preset,
      context: store.context,
      vision: store.vision,
    }
  },

  async ({ effects, input }) => {
    if (!isPresetId(input.preset)) {
      throw new Error(i18n('Unknown model size.'))
    }
    const before = await storeJson.read().once()
    const unchanged =
      before?.preset === input.preset &&
      before.context === input.context &&
      before.vision === input.vision
    if (unchanged) return null

    // `strata launch` sets the model up again on the next start when a choice
    // changed, reusing downloaded files and keeping the web app's Model settings.
    await storeJson.merge(effects, {
      preset: input.preset,
      context: input.context,
      vision: input.vision,
    })
    return null
  },
)
