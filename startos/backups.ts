import { sdk } from './sdk'

// Models, packs and their setup configs are re-downloadable and stay out.
export const { createBackup, restoreInit } = sdk.setupBackups(async () =>
  sdk.Backups.ofVolumes('public').addSync({
    dataPath: '/media/startos/volumes/main/startos/',
    backupPath: '/media/startos/backup/volumes/main/startos/',
  }),
)
