import 'dotenv/config'
import { Midjourney } from 'freezer-midjourney-api'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './services.js'
import { WebSocketServer } from 'ws'

const client = new Midjourney({
  ServerId: process.env.SERVER_ID,
  ChannelId: process.env.CHANNEL_ID,
  SalaiToken: process.env.SALAI_TOKEN,
  Debug: false,
  Ws: true,
})
