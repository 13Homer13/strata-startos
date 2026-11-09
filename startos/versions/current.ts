import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.13:0',
  releaseNotes: {
    en_US:
      'Strata is updated to 0.2.13 (engine 0.1.59), with new DFlash2 drafting defaults for some cards and a fix for loading the expert store on Linux when the file cache can hold it. Downloaded models are kept. This version needs StartOS 0.4.1 or later.',
    es_ES:
      'Strata se actualiza a 0.2.13 (motor 0.1.59), con nuevos valores predeterminados del borrador DFlash2 para algunas tarjetas y una corrección en la carga del almacén de expertos en Linux cuando la caché de archivos puede contenerlo. Los modelos descargados se conservan. Esta versión requiere StartOS 0.4.1 o posterior.',
    de_DE:
      'Strata wird auf 0.2.13 aktualisiert (Engine 0.1.59): neue DFlash2-Drafter-Standardwerte für einige Karten und eine Korrektur beim Laden des Expertenspeichers unter Linux, wenn der Dateicache ihn aufnehmen kann. Heruntergeladene Modelle bleiben erhalten. Diese Version erfordert StartOS 0.4.1 oder neuer.',
    pl_PL:
      'Strata zaktualizowana do 0.2.13 (silnik 0.1.59): nowe domyślne ustawienia draftera DFlash2 dla niektórych kart i poprawka wczytywania magazynu ekspertów w Linuksie, gdy pamięć podręczna plików może go pomieścić. Pobrane modele zostają zachowane. Ta wersja wymaga StartOS 0.4.1 lub nowszego.',
    fr_FR:
      'Strata passe en 0.2.13 (moteur 0.1.59), avec de nouveaux réglages par défaut du drafter DFlash2 pour certaines cartes et une correction du chargement du magasin d’experts sous Linux lorsque le cache de fichiers peut le contenir. Les modèles téléchargés sont conservés. Cette version nécessite StartOS 0.4.1 ou ultérieur.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
