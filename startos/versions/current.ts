import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.22:0',
  releaseNotes: {
    en_US:
      'Strata is updated to 0.2.22 (engine 0.1.69). Agents no longer stay paused after an update, and long tool calls through /v1/responses keep their connection open. The first start after the update sets the model up again before it loads. Completed downloads are reused. Full release notes: https://github.com/Niko1221/Strata/releases/tag/v0.2.22',
    es_ES:
      'Strata se actualiza a 0.2.22 (motor 0.1.69). Los agentes ya no quedan en pausa tras una actualización, y las llamadas largas a herramientas por /v1/responses mantienen la conexión abierta. El primer inicio tras la actualización vuelve a preparar el modelo antes de cargarlo. Las descargas completadas se reutilizan. Notas completas de la versión: https://github.com/Niko1221/Strata/releases/tag/v0.2.22',
    de_DE:
      'Strata wird auf 0.2.22 aktualisiert (Engine 0.1.69). Agenten bleiben nach einem Update nicht mehr pausiert, und lange Tool-Aufrufe über /v1/responses halten ihre Verbindung offen. Der erste Start nach dem Update richtet das Modell vor dem Laden neu ein. Abgeschlossene Downloads werden wiederverwendet. Vollständige Versionshinweise: https://github.com/Niko1221/Strata/releases/tag/v0.2.22',
    pl_PL:
      'Strata zaktualizowana do 0.2.22 (silnik 0.1.69). Agenci nie pozostają już wstrzymani po aktualizacji, a długie wywołania narzędzi przez /v1/responses utrzymują połączenie. Pierwsze uruchomienie po aktualizacji ponownie przygotowuje model przed jego wczytaniem. Ukończone pobrania są ponownie wykorzystywane. Pełne informacje o wydaniu: https://github.com/Niko1221/Strata/releases/tag/v0.2.22',
    fr_FR:
      "Strata passe en 0.2.22 (moteur 0.1.69). Les agents ne restent plus en pause après une mise à jour, et les longs appels d'outils via /v1/responses gardent leur connexion ouverte. Le premier démarrage après la mise à jour prépare à nouveau le modèle avant de le charger. Les téléchargements terminés sont réutilisés. Notes de version complètes : https://github.com/Niko1221/Strata/releases/tag/v0.2.22",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
