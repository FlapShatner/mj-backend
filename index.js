import express from 'express'
import { WebSocketServer } from 'ws'
import http from 'http'
import dotenv from 'dotenv'
import { client } from './lib/midjourney.js'
import { v4 as uuidv4 } from 'uuid'
import { uploadImageToCloudinary } from './lib/services.js'
import suggestRoute from './routes/suggest.js'
import api from './routes/api.js'

dotenv.config()
const app = express()
const server = http.createServer(app)
app.use(express.json())

app.use('/suggest', suggestRoute)
app.use('/', api)

app.get('/', (req, res) => {
    res.send('Hello From  MJ Backend')
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
        ws.send(JSON.stringify({ event: 'status', status: progress }))
    }
}

const sendResults = (resultsObj) => {
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
    const { prompt, shape, caption } = message.data
    if (!prompt) return
    await client.init()
    // console.log('prompt', prompt)
    const response = await makeGenerate(prompt, id)
    console.log('response', response)
    if (response.error) {
        sendError(response.error, id)
        return
    }
    const responseObj = await JSON.parse(response)
    const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content)
    const resultsObj = {
        imgData: imgData,
        meta: response,
        id: id,
        shape: shape,
        caption: caption,
        prompt: prompt,
        event: 'generate',
    }
    sendResults(resultsObj)
}

const handleUpscale = async (message, id) => {
    console.log('upscale message recieved from ', id)
    const { meta, activeIndex, shape, prompt, caption, style } = message.data
    const response = await makeUpscale(meta, activeIndex)
    const responseObj = await JSON.parse(response)
    console.log('responseObj', responseObj)
    if (responseObj.error) {
        sendError(responseObj.error, id)
        return
    }
    const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, style)
    const resultsObj = {
        imgData: imgData,
        meta: response,
        id: id,
        shape: shape,
        caption: caption,
        prompt: prompt,
        style: style,
        event: 'upscale',
    }
    sendResults(resultsObj)
}

const makeUpscale = async (job, index) => {
    await client.init()
    const data = JSON.parse(job)
    try {
        const upscale = await client.Upscale({
            index: index,
            msgId: data.id,
            hash: data.hash,
            flags: data.flags,
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
    const dataObj = { ...message.data, id: id, event: 'variations' }
    const response = await makeVariations(dataObj)
    const responseObj = JSON.parse(response)
    const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, dataObj.style)
    const resultsObj = {
        imgData: imgData,
        meta: response,
        id: id,
        event: 'variations',
        shape: dataObj.shape,
        caption: dataObj.caption,
        prompt: dataObj.prompt,
        style: dataObj.style,
    }
    sendResults(resultsObj)
}

const makeVariations = async (dataObj) => {
    const { meta, activeIndex, prompt, id } = dataObj
    await client.init()
    const data = JSON.parse(meta)
    try {
        const variations = await client.Variation({
            index: activeIndex,
            msgId: data.id,
            hash: data.hash,
            flags: data.flags,
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
    // console.log('message', message)
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
