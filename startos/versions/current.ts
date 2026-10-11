import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.1.41:1',
  releaseNotes: {
    en_US:
      'The Web UI interface opens the chat page behind a password, with no API key to paste (run "Set Web UI Password"); the API interface is unchanged for apps. The health check shows download progress, and says when a settings change only re-applies a downloaded model. New actions: "Connection Info" for Open WebUI and other services on this server, and "Delete Models" to free disk space. The logs show download progress, and Model settings saved in the web page now survive a restart.',
    es_ES:
      'La interfaz web abre la página de chat tras una contraseña, sin clave de API que pegar (ejecuta "Establecer contraseña de la interfaz web"); la interfaz API no cambia para las apps. La comprobación de estado muestra el progreso de la descarga e indica cuándo un cambio de ajustes solo vuelve a aplicar un modelo ya descargado. Nuevas acciones: "Datos de conexión" para Open WebUI y otros servicios de este servidor, y "Eliminar modelos" para liberar espacio. Los registros muestran el progreso de la descarga, y los ajustes del modelo guardados en la página web se conservan tras reiniciar.',
    de_DE:
      'Die Web-UI öffnet die Chatseite hinter einem Passwort, ohne API-Schlüssel zum Einfügen (führe „Web-UI-Passwort festlegen“ aus); die API-Schnittstelle bleibt für Apps unverändert. Die Zustandsprüfung zeigt den Download-Fortschritt und sagt, wenn eine Einstellungsänderung nur ein heruntergeladenes Modell neu übernimmt. Neue Aktionen: „Verbindungsdaten“ für Open WebUI und andere Dienste auf diesem Server sowie „Modelle löschen“, um Speicherplatz freizugeben. Die Protokolle zeigen den Download-Fortschritt, und auf der Webseite gespeicherte Modelleinstellungen überstehen einen Neustart.',
    pl_PL:
      'Interfejs WWW otwiera stronę czatu za hasłem, bez wklejania klucza API (uruchom „Ustaw hasło interfejsu WWW”); interfejs API dla aplikacji się nie zmienia. Kontrola stanu pokazuje postęp pobierania i informuje, gdy zmiana ustawień tylko ponownie stosuje pobrany model. Nowe akcje: „Dane połączenia” dla Open WebUI i innych usług na tym serwerze oraz „Usuń modele”, aby zwolnić miejsce na dysku. Logi pokazują postęp pobierania, a ustawienia modelu zapisane na stronie WWW przetrwają restart.',
    fr_FR:
      "L'interface web ouvre la page de chat derrière un mot de passe, sans clé d'API à coller (exécutez « Définir le mot de passe de l'interface web ») ; l'interface API ne change pas pour les applications. Le contrôle de santé affiche la progression du téléchargement et indique quand un changement de réglages ne fait que réappliquer un modèle déjà téléchargé. Nouvelles actions : « Informations de connexion » pour Open WebUI et les autres services de ce serveur, et « Supprimer des modèles » pour libérer de l'espace disque. Les journaux affichent la progression du téléchargement, et les réglages du modèle enregistrés dans la page web survivent à un redémarrage.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
