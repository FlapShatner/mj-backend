import express from 'express'
import dotenv from 'dotenv'
import { generateState, generateNonce } from '../utils.js'
const app = express()
app.use(express.json())
const router = express.Router()

router.get('/status', (req, res) => {
 res.send('Server is running!')
})

router.get('/', async (req, res) => {
 console.log('auth')
 const clientId = process.env.CLIENT_ID
 const state = await generateState()
 const nonce = await generateNonce(16)
 const authorizationRequestUrl = new URL(`https://shopify.com/squirrels-and-squirrels/auth/oauth/authorize`)

 authorizationRequestUrl.searchParams.append('scope', 'openid email https://api.customers.com/auth/customer.graphql')
 authorizationRequestUrl.searchParams.append('client_id', clientId)
 authorizationRequestUrl.searchParams.append('response_type', 'code')
 authorizationRequestUrl.searchParams.append('redirect_uri', process.env.REDIRECT_URI)
 authorizationRequestUrl.searchParams.append('state', state)
 authorizationRequestUrl.searchParams.append('nonce', nonce)

 const response = await fetch(authorizationRequestUrl)
})

router.post('/callback', async (req, res) => {
 const shopId = process.env.SHOP_ID
 const clientId = process.env.CLIENT_ID
 const redirectUri = process.env.REDIRECT_URI
 const code = req.params.code
 const clientSecret = process.env.CLIENT_SECRET
 const credentials = btoa(`${clientId}:${clientSecret}`)
 const body = new URLSearchParams()
 body.append('grant_type', 'authorization_code')
 body.append('client_id', clientId)
 body.append('redirect_uri', redirectUri)
 body.append('code', code)
 const headers = {
  'content-type': 'application/x-www-form-urlencoded',
  // Confidential Client
  Authorization: `Basic ${credentials}`,
 }
 const response = await fetch(`https://shopify.com/${shopId}/auth/oauth/token`, {
  method: 'POST',
  headers: headers,
  body,
 })
 const { access_token, expires_in, id_token, refresh_token } = await response.json()
 console.log('access_token', access_token)
})

export default router
