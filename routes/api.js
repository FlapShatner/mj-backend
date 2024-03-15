import express from 'express'
import { upscaleImage } from '../lib/midjourney.js'
import { uploadImageToCloudinary } from '../lib/services.js'
import { client } from '../lib/midjourney.js'
const app = express()
app.use(express.json())
const router = express.Router()

router.post('/upscale', async (req, res) => {
 console.log('called upscale')
 const data = req.body.job
 const { meta, activeIndex, shape, prompt, caption, style } = data
 console.log('meta', meta)
 const response = await makeUpscale(meta, activeIndex)
 const responseObj = await JSON.parse(response)
 if (responseObj.error) {
  throw new Error(responseObj.error)
 }
 const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, style)
 const resultsObj = {
  imgData: imgData,
  meta: response,
  shape: shape,
  caption: caption,
  prompt: prompt,
  style: style,
  event: 'upscale',
 }
 try {
  res.send(resultsObj).status(200)
  return
 } catch (error) {
  console.log(error)
  res.send(error).status(500)
  return
 }
})

const makeUpscale = async (job, index) => {
 console.log('makeUpscale called')
 client.Close()
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
  console.log('upscale', upscale)
  return JSON.stringify(upscale)
 } catch (error) {
  return { error: error.message }
 }
}

export default router
