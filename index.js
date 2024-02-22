import express from 'express'
import dotenv from 'dotenv'
import { uploadImageToCloudinary } from './lib/services.js'
import { getSuggest } from './utils.js'
import { generateMj, makeVariations, upscaleImage } from './lib/midjourney.js'

dotenv.config()
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!!!')
})



app.post('/suggest', async (req, res) => {
  const data = req.body
  const { prompt } = data
  const suggestions = await getSuggest(prompt)
  res.send(suggestions)
})

app.post('/gen', async (req, res) => {
  const data = req.body
  const { prompt } = data
  try {
    const response = await generateMj(prompt)
    // const cloudinaryUrl = await uploadImageToCloudinary(response.url, prompt, 'style')
    // res.send({
    //   url: cloudinaryUrl,
    //   caption: prompt,
    // })
    console.log(response)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

app.post('/var', async (req, res) => {
  const data = req.body
  const { job, index } = data
  const response = await makeVariations(job, index)
  res.send(response)
  // console.log('response', response)
})

app.post('/upscale', async (req, res) => {
  const data = req.body
  const { job, index } = data
  const response = await upscaleImage(job, index)
  res.send(response)
  // console.log('response', response)
})

const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
