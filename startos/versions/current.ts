import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.11:0',
  releaseNotes: {
    en_US:
      'Strata is updated to 0.2.11. On one graphics card the DFlash2 drafter is now the default: the first start after this update downloads about 1.2 GB once, and Strata then answers one request at a time, so apps that send requests together wait their turn. Downloaded models are kept. This version needs StartOS 0.4.1 or later.',
    es_ES:
      'Strata se actualiza a 0.2.11. Con una sola tarjeta gráfica, el borrador DFlash2 es ahora el predeterminado: el primer inicio tras esta actualización descarga unos 1,2 GB una sola vez, y Strata responde después a una solicitud cada vez, de modo que las aplicaciones que envían solicitudes a la vez esperan su turno. Los modelos descargados se conservan. Esta versión requiere StartOS 0.4.1 o posterior.',
    de_DE:
      'Strata wird auf 0.2.11 aktualisiert. Bei einer Grafikkarte ist jetzt der DFlash2-Drafter der Standard: Der erste Start nach diesem Update lädt einmalig etwa 1,2 GB herunter, und Strata beantwortet danach jeweils eine Anfrage, sodass Apps, die gleichzeitig Anfragen senden, warten müssen. Heruntergeladene Modelle bleiben erhalten. Diese Version erfordert StartOS 0.4.1 oder neuer.',
    pl_PL:
      'Strata zaktualizowana do 0.2.11. Przy jednej karcie graficznej domyślny jest teraz drafter DFlash2: pierwsze uruchomienie po tej aktualizacji jednorazowo pobiera około 1,2 GB, a potem Strata odpowiada na jedno żądanie naraz, więc aplikacje wysyłające żądania jednocześnie czekają na swoją kolej. Pobrane modele zostają zachowane. Ta wersja wymaga StartOS 0.4.1 lub nowszego.',
    fr_FR:
      'Strata passe en 0.2.11. Avec une seule carte graphique, le drafter DFlash2 est désormais utilisé par défaut : le premier démarrage après cette mise à jour télécharge environ 1,2 Go une seule fois, puis Strata répond à une requête à la fois, et les applications qui envoient des requêtes en même temps attendent leur tour. Les modèles téléchargés sont conservés. Cette version nécessite StartOS 0.4.1 ou ultérieur.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
