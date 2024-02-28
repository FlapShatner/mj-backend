import express from 'express'
import {WebSocket, WebSocketServer} from 'ws'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './lib/services.js'
import { getSuggest } from './utils.js'
import { client, makeVariations, upscaleImage } from './lib/midjourney.js'
import { response } from './temp2.js'
import { tinyLizardWizard } from './temp.js'
import http from 'http';

dotenv.config()
const app = express()

const server = http.createServer(app);
app.use(express.json())

const wss = new WebSocketServer({ server })
const clients = {}

wss.on('connection', function connection(ws) {
  console.log('connected')
  const id = uuidv4()
  clients[id] = ws
  ws.send(JSON.stringify({ id:id }))

  ws.on('close', function close() {
    delete clients[id]
    console.log('disconnected')
  })
})

app.get('/', (req, res) => {
  res.send('Hello From  MJ Backend')
})

app.post('/suggest', async (req, res) => {
  const data = req.body
  const { prompt } = data
  const suggestions = await getSuggest(prompt)
  res.send(suggestions)
})


app.post('/var', async (req, res) => {
  const data = req.body
  const { job, index } = data
  try{
  const response = await makeVariations(job, index)
  const responseObj = await JSON.parse(response)
// const responseObj = tinyLizardWizard
  const cloudinaryUrl = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
  console.log('from server', cloudinaryUrl, JSON.stringify(responseObj) )
  res.send({
    meta:await responseObj,
    url: cloudinaryUrl
  }).status(200)
} catch (error) {
  console.log(error)
  res.send(error).status(500)
}
})

app.post('/upscale', async (req, res) => {
  const data = req.body
  const { job, index } = data
  try{
    const response = await upscaleImage(job, index)
    const responseObj = await JSON.parse(response)
  // const responseObj = tinyLizardWizard
    const cloudinaryUrl = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
    console.log('from server', cloudinaryUrl, JSON.stringify(responseObj) )
    res.send({
      meta:await responseObj,
      url: cloudinaryUrl
    }).status(200)
  } catch (error) {
    console.log(error)
    res.send(error).status(500)
  }
})

// app.get('/prog/:id', (req, res) => {
//   const { id } = req.params
//   console.log("id:",id)
//   const progress = getProgress(id)
//   console.log("progess:",progress)  
//   res.send(progress).status(200)
// })



app.post('/gen', async (req, res) => {
  const data = req.body
  const { prompt, wsId } = data
  try {
    const update = (progress) => {
      if (clients[wsId]) {
        const ws = clients[wsId]
        ws.send(JSON.stringify({status: progress}))
      }
    }
    const generateMj = async (prompt) => {
      await client.init()
      try {
        const job = await client.Imagine(prompt, (uri, progress) => {
          update(progress)
          console.log('loading', uri, 'progress', progress)
        })
        return JSON.stringify(job)
      } catch (error) {
        return { error: error.message }
      }
    }
    const response = await generateMj(prompt)
    const responseObj = JSON.parse(response)
    const cloudinaryUrl = await uploadImageToCloudinary(responseObj.uri, prompt, 'style')

    if (clients[wsId]) {
      clients[wsId].send(
        JSON.stringify({
          finalResult: {
            meta: JSON.stringify(responseObj),
            url: cloudinaryUrl,
            caption: prompt,
          },
        })
      )
    }
    res.json({ message: 'Processing started, updates will be sent via WebSocket.' })
    console.log(cloudinaryUrl)
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
})



const PORT = process.env.PORT || 8888
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
