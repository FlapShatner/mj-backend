import express from 'express'
import dotenv from 'dotenv'
import { uploadImageToCloudinary } from './lib/services.js'
import { getSuggest } from './utils.js'
import { generateMj, makeVariations, upscaleImage } from './lib/midjourney.js'

import { tinyLizardWizard } from './temp.js'

dotenv.config()
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello From  MJ Backend')
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
    const responseObj = JSON.parse(response)
    // const responseObj = tinyLizardWizard
    
    const cloudinaryUrl = await uploadImageToCloudinary(responseObj.uri, prompt, 'style')
    res.send({
      meta: JSON.stringify(responseObj),
      url: cloudinaryUrl,
      caption: prompt,
    })
    console.log(cloudinaryUrl)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

app.post('/var', async (req, res) => {
  const data = req.body
  const { job, index } = data
  // const response = await makeVariations(job, index)
  // const responseObj = JSON.parse(response)
  const responseObj = tinyLizardWizard
  const cloudinaryUrl = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
  res.send({
    meta: JSON.stringify(responseObj),
    url: cloudinaryUrl
  })
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
