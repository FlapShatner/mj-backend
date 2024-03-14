import express from 'express'
import { getSuggest } from '../utils.js'
const router = express.Router()

router.post('/suggest', async (req, res) => {
 const data = req.body
 const { prompt } = data
 const suggestions = await getSuggest(prompt)
 res.send(suggestions)
})

export default router
