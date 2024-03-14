import express from 'express'
import { upscaleImage } from '../lib/midjourney.js'
import { uploadImageToCloudinary } from '../lib/services.js'
const app = express()
app.use(express.json())
const router = express.Router()

router.post('/upscale', async (req, res) => {
 const data = req.body
 const { job, index } = data
 try {
  const response = await upscaleImage(job, index)
  const responseObj = await JSON.parse(response)
  const imgData = await uploadImageToCloudinary(responseObj.uri, responseObj.content, 'style')
  console.log('from server', imgData)
  res
   .send({
    meta: await responseObj,
    imgData: imgData,
   })
   .status(200)
 } catch (error) {
  console.log(error)
  res.send(error).status(500)
 }
})

export default router
