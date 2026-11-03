import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.9:0',
  releaseNotes: {
    en_US:
      'Strata is updated to 0.2.9. Tool calls that the model writes slightly wrong now go through by default. On NVIDIA cards with 12 GB or less, the routing speed-up from 0.2.7 is off again, because it caused repeated text in long sessions. Prompts are about 2 to 6% faster, and several requests at once run faster. Downloaded models are kept.',
    es_ES:
      'Strata se actualiza a 0.2.9. Las llamadas a herramientas que el modelo escribe con pequeños errores ahora se procesan por defecto. En tarjetas NVIDIA de 12 GB o menos, la aceleración del enrutamiento de 0.2.7 vuelve a estar desactivada, porque provocaba texto repetido en sesiones largas. Los prompts son entre un 2 y un 6 % más rápidos, y varias solicitudes a la vez se atienden más rápido. Los modelos descargados se conservan.',
    de_DE:
      'Strata wird auf 0.2.9 aktualisiert. Tool-Aufrufe, die das Modell leicht fehlerhaft schreibt, werden jetzt standardmäßig ausgeführt. Auf NVIDIA-Karten mit 12 GB oder weniger ist die Routing-Beschleunigung aus 0.2.7 wieder aus, weil sie in langen Sitzungen zu wiederholtem Text führte. Prompts sind etwa 2 bis 6 % schneller, und mehrere gleichzeitige Anfragen laufen schneller. Heruntergeladene Modelle bleiben erhalten.',
    pl_PL:
      'Strata zaktualizowana do 0.2.9. Wywołania narzędzi, które model zapisze z drobnymi błędami, są teraz domyślnie wykonywane. Na kartach NVIDIA z 12 GB lub mniej przyspieszenie routingu z 0.2.7 jest znowu wyłączone, bo powodowało powtarzający się tekst w długich sesjach. Prompty są o około 2–6% szybsze, a kilka zapytań naraz działa szybciej. Pobrane modele zostają.',
    fr_FR:
      "Strata passe en 0.2.9. Les appels d'outils que le modèle écrit avec de petites erreurs passent désormais par défaut. Sur les cartes NVIDIA de 12 Go ou moins, l'accélération du routage de la 0.2.7 est de nouveau désactivée, car elle provoquait du texte répété dans les longues sessions. Les prompts sont environ 2 à 6 % plus rapides, et plusieurs requêtes simultanées sont plus rapides. Les modèles téléchargés sont conservés.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
