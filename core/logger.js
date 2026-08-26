import { createPinoLogger } from 'zapo-js'
import config from '../bot.config.js'

export const logger = await createPinoLogger({
  level: config.logLevel,
  pretty: true
})
