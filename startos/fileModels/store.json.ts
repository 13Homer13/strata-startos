import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { contexts, presets, PresetId } from '../utils'

const presetIds = Object.keys(presets) as [PresetId, ...PresetId[]]

const shape = z.looseObject({
  preset: z.enum(presetIds).nullable().catch(null),
  context: z.enum(contexts).catch('32768'),
  vision: z.enum(['no', 'yes', 'cpu']).catch('no'),
  uiPassword: z.string().optional().catch(undefined),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startos/store.json' },
  shape,
)
