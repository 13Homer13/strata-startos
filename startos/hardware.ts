import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

export async function systemMemoryGB(effects: T.Effects): Promise<number> {
  try {
    const result = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'strata' },
      sdk.Mounts.of(),
      'detect-mem',
      (sub) => sub.exec(['cat', '/proc/meminfo']),
    )
    const match =
      typeof result.stdout === 'string'
        ? result.stdout.match(/MemTotal:\s+(\d+)\s+kB/)
        : null
    if (result.exitCode === 0 && match) {
      return Math.round(parseInt(match[1], 10) / 1024 / 1024)
    }
  } catch {}
  return 0
}
