import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// On the public volume so dependent services can read the key.
const shape = z.looseObject({
  apiKey: z.string().catch(''),
})

export const credentialsJson = FileHelper.json(
  { base: sdk.volumes.public, subpath: 'credentials.json' },
  shape,
)
