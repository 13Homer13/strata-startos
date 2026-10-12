import { sdk } from '../sdk'
import { apiKey } from './apiKey'
import { deleteModels } from './deleteModels'
import { setModel } from './setModel'
import { setUiPassword } from './setUiPassword'

export const actions = sdk.Actions.of()
  .addAction(apiKey)
  .addAction(setUiPassword)
  .addAction(setModel)
  .addAction(deleteModels)
