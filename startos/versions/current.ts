import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.17:0',
  releaseNotes: {
    en_US:
      'Strata is updated to 0.2.17 (engine 0.1.63). The route tail skip, which made answers differ slightly, is now off by default. The first start after the update sets the model up again before it loads. Completed downloads are reused. New Coder downloads use an updated build. Full release notes: https://github.com/Niko1221/Strata/releases/tag/v0.2.17',
    es_ES:
      'Strata se actualiza a 0.2.17 (motor 0.1.63). El salto de cola de rutas, que hacía que las respuestas variaran ligeramente, ahora está desactivado por defecto. El primer inicio tras la actualización vuelve a preparar el modelo antes de cargarlo. Las descargas completadas se reutilizan. Las nuevas descargas del modelo Coder usan una versión actualizada. Notas completas de la versión: https://github.com/Niko1221/Strata/releases/tag/v0.2.17',
    de_DE:
      'Strata wird auf 0.2.17 aktualisiert (Engine 0.1.63). Der Route-Tail-Skip, durch den Antworten leicht abwichen, ist jetzt standardmäßig aus. Der erste Start nach dem Update richtet das Modell vor dem Laden neu ein. Abgeschlossene Downloads werden wiederverwendet. Neue Coder-Downloads verwenden eine aktualisierte Version. Vollständige Versionshinweise: https://github.com/Niko1221/Strata/releases/tag/v0.2.17',
    pl_PL:
      'Strata zaktualizowana do 0.2.17 (silnik 0.1.63). Pomijanie końcówki tras (route tail skip), przez które odpowiedzi nieznacznie się różniły, jest teraz domyślnie wyłączone. Pierwsze uruchomienie po aktualizacji ponownie przygotowuje model przed jego wczytaniem. Ukończone pobrania są ponownie wykorzystywane. Nowe pobrania modelu Coder korzystają ze zaktualizowanej wersji. Pełne informacje o wydaniu: https://github.com/Niko1221/Strata/releases/tag/v0.2.17',
    fr_FR:
      'Strata passe en 0.2.17 (moteur 0.1.63). Le saut de fin de route (route tail skip), qui faisait légèrement varier les réponses, est désormais désactivé par défaut. Le premier démarrage après la mise à jour prépare à nouveau le modèle avant de le charger. Les téléchargements terminés sont réutilisés. Les nouveaux téléchargements du modèle Coder utilisent une version mise à jour. Notes de version complètes : https://github.com/Niko1221/Strata/releases/tag/v0.2.17',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
