import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import dotenv from 'dotenv'
import { client } from './lib/midjourney.js'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './lib/services.js'
import suggestRoute from './routes/suggest.js'
import api from './routes/api.js'
import auth from './routes/auth.js'
import { responseData } from './temp.js'
import { job } from './job.js'

dotenv.config()
const app = express()
const server = http.createServer(app)
app.use(express.json())

app.use('/suggest', suggestRoute)
app.use('/', api)
app.use('/auth', auth)

app.get('/', (req, res) => {
 res.send('Hello From  MJ Backend!')
})

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
  ws.send(JSON.stringify({ event: 'status', data: progress }))
 }
}

const sendResults = (resultsObj) => {
 console.log('resultsObj', resultsObj)
 const { id } = resultsObj
 if (connections[id]) {
  const ws = connections[id]
  ws.send(JSON.stringify(resultsObj))
 }
}

const sendError = (error, id) => {
 if (connections[id]) {
  const ws = connections[id]
  ws.send(JSON.stringify({ event: 'error', error: error }))
 }
}

const handleGenerate = async (message, id) => {
 if (!message.data.data) return
 console.log('generate message recieved from ', id, message.data.data)
 const { prompt, caption, productId, isGrid, ff, size, secVar, style, secVarLabel } = JSON.parse(message.data.data)
 if (!prompt) return
 await client.init()
 console.log('message:', message)
 const response = await makeGenerate(prompt, id)
 console.log('response', response)
 if (response.error) {
  sendError(response.error, id)
  return
 }
 const responseObj = await JSON.parse(response)
 const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content)
 const resultsObj = {
  id: id,
  event: 'generate',
  data: {
   imgData: imgData,
   productId: productId,
   isGrid: isGrid,
   ff: ff,
   size: size,
   secVar: secVar,
   meta: responseObj,
   style: style,
   caption: caption,
   prompt: prompt,
   secVarLabel: secVarLabel,
  },
 }
 sendResults(resultsObj)
}

const handleUpscale = async (message, id) => {
 console.log('upscale message recieved from ', id)
 const { event, data } = message.data
 const dataObj = { event: event, id: id, data: JSON.parse(data) }
 const { generated } = dataObj.data
 console.log('upscale message', dataObj)
 const response = await makeUpscale(dataObj)
 const responseObj = await JSON.parse(response)
 console.log('responseObj', responseObj)

 if (responseObj.error) {
  sendError(responseObj.error, id)
  return
 }

 const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, generated.style)
 const resultsObj = {
  id: id,
  event: 'upscale',
  data: {
   imgData: imgData,
   meta: responseObj,
   productId: generated.productId,
   isGrid: generated.isGrid,
   isUpscaled: true,
   ff: generated.ff,
   size: generated.size,
   secVar: generated.secVar,
   secVarLabel: generated.secVarLabel,
   caption: generated.caption,
   prompt: generated.prompt,
   style: generated.style,
  },
 }

 sendResults(resultsObj)
}

const makeUpscale = async (dataObj) => {
 const { event, id, data } = dataObj
 const { generated, index, prompt } = data
 const { meta } = generated
 try {
  const upscale = await client.Upscale({
   index: index,
   msgId: meta.id,
   hash: meta.hash,
   flags: meta.flags,
   loading: (uri, progress) => {
    console.log('loading', uri, 'progress', progress)
   },
  })
  return JSON.stringify(upscale)
 } catch (error) {
  return { error: error.message }
 }
}

const makeGenerate = async (prompt, id) => {
 try {
  await client.init()
  const job = await client.Imagine(prompt, (uri, progress) => {
   update(progress, id)
   console.log('loading', uri, 'progress', progress)
  })
  return JSON.stringify(job)
 } catch (error) {
  return { error: error.message }
 }
}

const handleVariations = async (message, id) => {
 console.log('var message', message)

 const dataObj = { event: message.event, id: message.id, data: JSON.parse(message.data) }
 const generated = dataObj.data.generated
 const response = await makeVariations(dataObj)
 const responseObj = await JSON.parse(response)
 console.log('responseObj', responseObj)
 const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, dataObj.style)
 const resultsObj = {
  id: id,
  event: 'variations',
  data: {
   imgData: imgData,
   meta: responseObj,
   productId: generated.productId,
   isGrid: generated.isGrid,
   ff: generated.ff,
   size: generated.size,
   secVar: generated.secVar,
   secVarLabel: generated.secVarLabel,
   caption: generated.caption,
   prompt: generated.prompt,
   style: generated.style,
  },
 }
 sendResults(resultsObj)
}

const makeVariations = async (dataObj) => {
 const { event, id, data } = dataObj
 const { generated, index, prompt } = data
 const { meta } = generated
 console.log('makeVars:', data)
 await client.init()
 try {
  const variations = await client.Variation({
   index: index,
   msgId: meta.id,
   hash: meta.hash,
   flags: meta.flags,
   content: prompt,
   loading: (uri, progress) => {
    update(progress, id)
    console.log('loading', uri, 'progress', progress)
   },
  })
  return JSON.stringify(variations)
 } catch (error) {
  return { error: error.message }
 }
}

const handleMessage = async (bytes, id) => {
 const message = JSON.parse(bytes)
 //  console.log('message', message)
 if (message.data) {
  if (message.event === 'generate') {
   handleGenerate(message, id)
  } else if (message.event === 'variations') {
   handleVariations(message, id)
  } else if (message.event === 'upscale') {
   handleUpscale(message, id)
   console.log('received upscale req')
  }
 }
}

const PORT = process.env.PORT || 8888
server.listen(PORT, () => {
 console.log(`Server is running on port ${PORT}`)
})
