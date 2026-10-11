export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'No API key. Run the "Set API Key" action.': 0,
  'No model chosen. Run the "Set Model" action.': 1,
  'Strata API': 2,
  'The model is loaded and the API is ready': 3,
  'The model is loading': 4,

  // interfaces.ts

  // actions/setApiKey.ts
  'Set API Key': 8,
  'Reset API Key': 9,
  'Generate the key that apps, coding agents and Open WebUI send to use Strata. Running this again replaces the existing key.': 10,
  'Replaces the current API key. Strata restarts to apply it, and every app using the old key needs the new one.': 11,
  'API Key Set': 12,
  'Use this key with the API interface address followed by /v1 in any OpenAI-compatible app. Save it now: running this action again replaces it.': 13,
  'API Key': 14,

  // actions/setModel.ts
  'Set Model': 15,
  'Choose which size of the model Strata runs, how much context it keeps and whether it reads pictures. A new size is downloaded on the next start.': 16,
  'Strata restarts to apply this. A size not downloaded yet takes a long time to fetch and prepare, and each size stays on disk.': 17,
  Model: 18,
  'Sizes this server does not have enough RAM for are disabled. Each one is a download of 58-84 GB.': 19,
  '${ram} GB RAM, ${download} GB download': 20,
  'Qwen3.8-Flash-Next IQ2_XS (recommended)': 21,
  'Qwen3.8-Flash-Next Q2_0 (fastest)': 22,
  'Qwen3.8-Flash-Next IQ3_XXS (better quality, slower)': 23,
  'Qwen3.8-Flash-Next IQ3_S (best quality, slowest)': 24,
  'Coder (for coding; fits 32 GB of RAM)': 25,
  'Swift 1.5 IQ2_XS (shorter thinking)': 26,
  'Swift 1.5 IQ3_XXS (shorter thinking)': 27,
  Context: 28,
  'How much text the model keeps in mind at once. Coding agents such as opencode need 128K. Longer contexts use more memory.': 29,
  Images: 30,
  'Let the model read pictures. On the GPU it needs more video memory; on the CPU it is slower but uses none.': 31,
  Off: 32,
  'On (GPU)': 33,
  'On (CPU)': 34,
  'Unknown model size.': 35,

  // init/watchSetup.ts
  'Set an API key so only your apps can use Strata': 36,
  'Choose a model size before the first start; it is a 58-84 GB download': 37,

  // main.ts
  'No Web UI password. Run the "Set Web UI Password" action.': 38,
  'The model is downloaded. Preparing it and applying its settings: a few minutes, longer the first time.': 39,
  'Downloading the model: ${done} of ${total} GB (${percent}%)': 40,
  'Web UI': 41,
  'The Web UI is ready': 42,
  'The Web UI is not ready': 43,
  'Strata is not ready yet: it is downloading, preparing or loading the model. The Strata API health check in StartOS shows how far it is.': 44,
  'This page reloads by itself.': 45,

  // interfaces.ts
  API: 46,
  'The OpenAI- and Anthropic-compatible API at /v1 for apps and coding agents. Needs the API key.': 47,
  "Strata's chat and monitor page. Log in as admin with the password from Set Web UI Password.": 48,

  // actions/setUiPassword.ts
  'Set Web UI Password': 49,
  'Reset Web UI Password': 50,
  'Generate the password for logging in to the Web UI interface. The username is always "admin".': 51,
  'Replaces the current password. Browsers logged in with the old one are asked to log in again.': 52,
  'Web UI Password Set': 53,
  'Log in to the Web UI interface with these credentials. Save the password now: running this action again replaces it.': 54,
  Username: 55,
  Password: 56,

  // actions/deleteModels.ts
  '${shared} GB shared with another size': 57,
  'in use': 58,
  'Models to delete': 59,
  'The model in use cannot be deleted; switch to another one with "Set Model" first. A file shared with another size is freed only when every size using it is deleted.': 60,
  'No model is downloaded.': 61,
  'Delete Models': 62,
  'Free disk space by removing downloaded model sizes you no longer use.': 63,
  'The files are deleted permanently. A deleted size is downloaded again (58-84 GB) if you choose it in "Set Model" later.': 64,
  'The model in use cannot be deleted. Switch to another one with "Set Model" first.': 65,
  'That model is no longer on disk.': 66,
  'Could not delete: ${models}': 67,
  'Models Deleted': 68,
  'Deleted ${models}.': 69,

  // actions/connectionInfo.ts
  'Connection Info': 70,
  'Show the address and API key that other services on this server, such as Open WebUI, use to reach Strata.': 71,
  'The Strata API has no internal address yet.': 72,
  'For services on this server, such as Open WebUI. Apps on other devices use the API interface address followed by /v1 instead.': 73,
  'Base URL': 74,

  // init/watchSetup.ts
  'Set a password for the Web UI so only you can open the chat page': 75,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
