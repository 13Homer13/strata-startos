import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.12:0',
  releaseNotes: {
    en_US:
      "Strata is updated to 0.2.12, with faster prompts on 12 GB cards, a tuned DFlash2 drafter and fixes for tool calls from apps such as Claude Desktop. The package icon is now Strata's own logo. Downloaded models are kept. This version needs StartOS 0.4.1 or later.",
    es_ES:
      'Strata se actualiza a 0.2.12, con indicaciones más rápidas en tarjetas de 12 GB, un borrador DFlash2 ajustado y correcciones en las llamadas a herramientas desde aplicaciones como Claude Desktop. El icono del paquete es ahora el logotipo propio de Strata. Los modelos descargados se conservan. Esta versión requiere StartOS 0.4.1 o posterior.',
    de_DE:
      'Strata wird auf 0.2.12 aktualisiert: schnellere Prompts auf 12-GB-Karten, ein abgestimmter DFlash2-Drafter und Korrekturen bei Tool-Aufrufen aus Apps wie Claude Desktop. Das Paketsymbol ist jetzt das eigene Logo von Strata. Heruntergeladene Modelle bleiben erhalten. Diese Version erfordert StartOS 0.4.1 oder neuer.',
    pl_PL:
      'Strata zaktualizowana do 0.2.12: szybsze przetwarzanie promptów na kartach 12 GB, dostrojony drafter DFlash2 i poprawki wywołań narzędzi z aplikacji takich jak Claude Desktop. Ikona pakietu to teraz własne logo Strata. Pobrane modele zostają zachowane. Ta wersja wymaga StartOS 0.4.1 lub nowszego.',
    fr_FR:
      'Strata passe en 0.2.12, avec des prompts plus rapides sur les cartes de 12 Go, un drafter DFlash2 ajusté et des corrections des appels d’outils depuis des applications comme Claude Desktop. L’icône du paquet est désormais le logo de Strata. Les modèles téléchargés sont conservés. Cette version nécessite StartOS 0.4.1 ou ultérieur.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
