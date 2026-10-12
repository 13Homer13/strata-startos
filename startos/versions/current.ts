import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.41:0',
  releaseNotes: {
    en_US:
      'Initial release for StartOS. Strata runs a large language model on an NVIDIA graphics card, with an OpenAI- and Anthropic-compatible API protected by an API key, and its own web app behind a password on the same "Web UI and API" interface. Choose the model size and context with "Set Model". Requires an NVIDIA GPU and at least 32 GB of RAM.',
    es_ES:
      'Lanzamiento inicial para StartOS. Strata ejecuta un modelo de lenguaje grande en una tarjeta gráfica NVIDIA, con una API compatible con OpenAI y Anthropic protegida por una clave de API, y su propia aplicación web tras una contraseña en la misma interfaz "Interfaz web y API". Elige el tamaño del modelo y el contexto con "Establecer modelo". Requiere una GPU NVIDIA y al menos 32 GB de RAM.',
    de_DE:
      'Erstveröffentlichung für StartOS. Strata führt ein großes Sprachmodell auf einer NVIDIA-Grafikkarte aus, mit einer OpenAI- und Anthropic-kompatiblen API, geschützt durch einen API-Schlüssel, und einer eigenen Web-App hinter einem Passwort auf derselben Schnittstelle „Web-UI und API“. Modellgröße und Kontext wählst du mit „Modell festlegen“. Erfordert eine NVIDIA-GPU und mindestens 32 GB RAM.',
    pl_PL:
      'Pierwsze wydanie dla StartOS. Strata uruchamia duży model językowy na karcie graficznej NVIDIA, z API zgodnym z OpenAI i Anthropic chronionym kluczem API oraz własną aplikacją WWW za hasłem na tym samym interfejsie „Interfejs WWW i API”. Rozmiar modelu i kontekst wybierasz akcją „Ustaw model”. Wymaga karty NVIDIA i co najmniej 32 GB RAM.',
    fr_FR:
      "Version initiale pour StartOS. Strata exécute un grand modèle de langage sur une carte graphique NVIDIA, avec une API compatible OpenAI et Anthropic protégée par une clé d'API, et sa propre application web derrière un mot de passe sur la même interface « Interface web et API ». Choisissez la taille du modèle et le contexte avec « Définir le modèle ». Nécessite un GPU NVIDIA et au moins 32 Go de RAM.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
