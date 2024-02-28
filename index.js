import express from 'express'
import dotenv from 'dotenv'
import { uploadImageToCloudinary } from './lib/services.js'
import { getSuggest } from './utils.js'
import { generateMj, makeVariations, upscaleImage, getProgress } from './lib/midjourney.js'
import { response } from './temp2.js'
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
  const { prompt, id } = data
  try {
    const response = await generateMj(prompt, id)
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

app.get('/prog/:id', (req, res) => {
  const { id } = req.params
  const progress = getProgress(id)
  console.log("progess:",progress)
  
  // res.send(progress).status(200)
})

const PORT = process.env.PORT || 8888
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
