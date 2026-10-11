import { sdk } from '../sdk'
import { connectionInfo } from './connectionInfo'
import { deleteModels } from './deleteModels'
import { setApiKey } from './setApiKey'
import { setModel } from './setModel'
import { setUiPassword } from './setUiPassword'

export const actions = sdk.Actions.of()
  .addAction(setApiKey)
  .addAction(setUiPassword)
  .addAction(setModel)
  .addAction(connectionInfo)
  .addAction(deleteModels)
