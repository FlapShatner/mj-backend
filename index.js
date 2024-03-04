import express from 'express'
import {WebSocket, WebSocketServer} from 'ws'
import dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './lib/services.js'
import { getSuggest } from './utils.js'
import { client, upscaleImage } from './lib/midjourney.js'

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
  const { job, index, wsId } = data
  try{
    let prog = 0
    const update = (progress) => {
      if (clients[wsId]) {
        const ws = clients[wsId]
        ws.send(JSON.stringify({status: progress}))
      }
    }
   const makeVariations = async (job, index) => {
      client.Close()
      await client.init()
      const data = JSON.parse(job)
      console.log('data', data)
      try {
        const variations = await client.Variation({
          index: index,
          msgId: data.id,
          hash: data.hash,
          flags: data.flags,
          content: data.content,
          // content: prompt, //remix mode require content
          loading: (uri, progress) => {            
              prog = prog < 76 ? prog + 23: 100    
            update(`${prog}%`)
            console.log('loading', uri, 'progress', prog)
          },
        })
        return JSON.stringify(variations)
        // console.log('variations',variations)
      } catch (error) {
        return { error: error.message }
      }
    }
  const response = await makeVariations(job, index)
  const responseObj = await JSON.parse(response)
// const responseObj = tinyLizardWizard
  const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
  console.log('from server', imgData, JSON.stringify(responseObj) )
  res.send({
    meta:await responseObj,
    imgData: imgData
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
    const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
    console.log('from server', imgData, JSON.stringify(responseObj) )
    res.send({
      meta:await responseObj,
      imgData: imgData
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
    const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')

    res.send({
              meta: await responseObj,
              imgData: imgData,
              caption: prompt,
            }).status(200)
    console.log(imgData)
  } catch (error) {
    console.log(error)
    res.status(500).send(error)
  }
})



const PORT = process.env.PORT || 8888
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
