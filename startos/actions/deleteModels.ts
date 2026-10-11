import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { deleteModel, downloadedModels, formatGB } from '../modelFiles'
import { sdk } from '../sdk'
import { PresetId, presets } from '../utils'
import { presetLabels } from './setModel'

const { InputSpec, Value } = sdk

const isPresetId = (id: string): id is PresetId => id in presets

const inputSpec = InputSpec.of({
  models: Value.dynamicMultiselect(async () => {
    const active = await storeJson.read((s) => s.preset).once()
    const models = await downloadedModels()
    const values: Record<string, string> = {}
    for (const { id, bytes, sharedBytes } of models) {
      values[id] =
        `${presetLabels[id]} · ${formatGB(bytes)} GB` +
        (sharedBytes > 0
          ? ` (${i18n('${shared} GB shared with another size', { shared: formatGB(sharedBytes) })})`
          : '') +
        (id === active ? ` · ${i18n('in use')}` : '')
    }
    return {
      name: i18n('Models to delete'),
      description:
        models.length > 0
          ? i18n(
              'The model in use cannot be deleted; switch to another one with "Set Model" first. A file shared with another size is freed only when every size using it is deleted.',
            )
          : i18n('No model is downloaded.'),
      default: [],
      values,
      minLength: 1,
      disabled: active && active in values ? [active] : false,
    }
  }),
})

export const deleteModels = sdk.Action.withInput(
  'delete-models',

  async ({ effects }) => ({
    name: i18n('Delete Models'),
    description: i18n(
      'Free disk space by removing downloaded model sizes you no longer use.',
    ),
    warning: i18n(
      'The files are deleted permanently. A deleted size is downloaded again (58-84 GB) if you choose it in "Set Model" later.',
    ),
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {},

  async ({ effects, input }) => {
    const active = await storeJson.read((s) => s.preset).once()
    const onDisk = new Map((await downloadedModels()).map((m) => [m.id, m]))
    const chosen = input.models.filter(isPresetId)
    if (chosen.includes(active as PresetId)) {
      throw new Error(
        i18n(
          'The model in use cannot be deleted. Switch to another one with "Set Model" first.',
        ),
      )
    }
    if (chosen.length === 0 || chosen.some((id) => !onDisk.has(id))) {
      throw new Error(i18n('That model is no longer on disk.'))
    }

    for (const id of chosen) await deleteModel(id)

    const left = new Set((await downloadedModels()).map((m) => m.id))
    const failed = chosen.filter((id) => left.has(id))
    if (failed.length > 0) {
      throw new Error(
        i18n('Could not delete: ${models}', {
          models: failed.map((id) => presetLabels[id]).join(', '),
        }),
      )
    }
    return {
      version: '1' as const,
      title: i18n('Models Deleted'),
      message: i18n('Deleted ${models}.', {
        models: chosen.map((id) => presetLabels[id]).join(', '),
      }),
      result: null,
    }
  },
)
