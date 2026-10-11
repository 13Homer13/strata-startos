import { lstat, readdir, rm, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { sdk } from './sdk'
import {
  configFile,
  modelShards,
  modelTag,
  Preset,
  PresetId,
  presets,
} from './utils'

// What setup.py keeps per model in the main volume (STRATA_DATA). The vision
// encoder (models/mmproj-*.gguf) and the MTP draft layer (mtp/) are shared by
// every model and stay.
const modelPaths = (preset: Preset) => [
  `models/${modelTag(preset)}`,
  `packs/${modelTag(preset).toLowerCase()}`,
  `config/${configFile(preset)}`,
  `config/${configFile(preset)}.bak`,
]

async function readdirSafe(path: string): Promise<string[]> {
  try {
    return await readdir(path)
  } catch (e: any) {
    if (e.code === 'ENOENT') return []
    throw e
  }
}

// A setup run renames <shard>.part to <shard> under our feet.
async function sizeOf(path: string): Promise<number> {
  try {
    return (await stat(path)).size
  } catch (e: any) {
    if (e.code === 'ENOENT') return 0
    throw e
  }
}

// How far setup.py's download of a model's shards is: the bytes of finished
// shards and .part files, and whether every shard has its .done mark.
export async function downloadProgress(
  preset: Preset,
): Promise<{ bytes: number; done: boolean }> {
  const dir = sdk.volumes.main.subpath(`models/${modelTag(preset)}`)
  const names = await readdirSafe(dir)
  let bytes = 0
  for (const name of names) {
    if (name.endsWith('.gguf') || name.endsWith('.gguf.part')) {
      bytes += await sizeOf(join(dir, name))
    }
  }
  const finished = names.filter(
    (n) => n.endsWith('.gguf') && names.includes(`${n}.done`),
  )
  return { bytes, done: finished.length >= modelShards }
}

// Files with more than one link (shard 2, which setup.py hard-links between
// the Qwen sizes and the Coder) free nothing until every link is gone.
async function diskUsage(
  path: string,
): Promise<{ bytes: number; sharedBytes: number }> {
  let info
  try {
    info = await lstat(path)
  } catch (e: any) {
    if (e.code === 'ENOENT') return { bytes: 0, sharedBytes: 0 }
    throw e
  }
  if (!info.isDirectory()) {
    return {
      bytes: info.size,
      sharedBytes: info.isFile() && info.nlink > 1 ? info.size : 0,
    }
  }
  const total = { bytes: 0, sharedBytes: 0 }
  for (const child of await readdirSafe(path)) {
    const u = await diskUsage(join(path, child))
    total.bytes += u.bytes
    total.sharedBytes += u.sharedBytes
  }
  return total
}

export type DownloadedModel = {
  id: PresetId
  bytes: number
  sharedBytes: number
}

// Every preset with anything of its own on disk, finished or not.
export async function downloadedModels(): Promise<DownloadedModel[]> {
  const found: DownloadedModel[] = []
  for (const id of Object.keys(presets) as PresetId[]) {
    const total = { bytes: 0, sharedBytes: 0 }
    let exists = false
    for (const path of modelPaths(presets[id])) {
      const full = sdk.volumes.main.subpath(path)
      exists ||= await lstat(full).then(
        () => true,
        () => false,
      )
      const u = await diskUsage(full)
      total.bytes += u.bytes
      total.sharedBytes += u.sharedBytes
    }
    if (exists) found.push({ id, ...total })
  }
  return found
}

export async function deleteModel(id: PresetId): Promise<void> {
  for (const path of modelPaths(presets[id])) {
    await rm(sdk.volumes.main.subpath(path), { recursive: true, force: true })
  }
}

export const formatGB = (bytes: number) => (bytes / 1e9).toFixed(1)
