import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import dotenv from 'dotenv'
import { client } from './lib/midjourney.js'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './lib/services.js'
import suggestRoute from './routes/suggest.js'
import upscaleRoute from './routes/upscale.js'

dotenv.config()
const app = express()
const server = http.createServer(app)
app.use(express.json())

app.use('/suggest', suggestRoute)
app.use('/upscale', upscaleRoute)

const wss = new WebSocketServer({ server })
const connections = {}
const users = {}

const handleClose = (uuid) => {
 console.log(`connection ${uuid} closed`)
 delete connections[uuid]
 broadcast()
}

const broadcast = () => {
 Object.keys(connections).forEach((uuid) => {
  const connection = connections[uuid]
  const message = JSON.stringify(users)
  connection.send(message)
 })
}

wss.on('connection', (connection, req) => {
 console.log('connected')
 const id = uuidv4()
 connections[id] = connection
 connection.send(JSON.stringify({ event: 'id', id: id }))
 connection.on('close', () => handleClose(id))
 connection.on('message', (message) => handleMessage(message, id))
})
const update = (progress, id) => {
 console.log('update', progress, id)
 if (connections[id]) {
  const ws = connections[id]
  ws.send(JSON.stringify({ event: 'status', status: progress }))
 }
}

const sendResults = (results, id) => {
 if (connections[id]) {
  const ws = connections[id]
  ws.send(JSON.stringify({ event: 'variations', data: results }))
 }
}

const handleMessage = async (bytes, id) => {
 const message = JSON.parse(bytes)
 console.log('message', message)
 if (message.data) {
  if (message.event === 'generate') {
   const { prompt } = message.data
   if (!prompt) return
   await client.init()
   console.log('prompt', prompt)
   const job = await client.Imagine(prompt, (uri, progress) => {
    update(progress, id)
    console.log('loading', uri, 'progress', progress)
   })
   const responseObj = JSON.parse(job)
   const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')

   sendResults(imgData, id)
   console.log('job', job)
  }
 }
}

// const makeVariations = async (job, prompt, index) => {
//  await client.init()
//  const data = JSON.parse(job)
//  console.log('data', data)
//  try {
//   const variations = await client.Variation({
//    index: index,
//    msgId: data.id,
//    hash: data.hash,
//    flags: data.flags,
//    content: prompt,
//    // content: prompt, //remix mode require content
//    loading: (uri, progress) => {
//     prog = prog < 76 ? prog + 23 : 100
//     update(`${prog}%`)
//     console.log('loading', uri, 'progress', prog)
//    },
//   })
//   return JSON.stringify(variations)
//   // console.log('variations',variations)
//  } catch (error) {
//   return { error: error.message }
//  }
// }

const PORT = process.env.PORT || 8888
server.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`)
})
