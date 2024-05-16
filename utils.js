import { lowercaseTags } from './data/lowercaseTags.js'
import { excluded } from './data/excludeTags.js'

export const getSuggest = async (prompt) => {
 let queryArray = prompt.split(' ')
 let lowercaseArray = queryArray.map((word) => word.toLowerCase())
 let suggestions = []

 lowercaseArray = lowercaseArray.filter((word) => !excluded.includes(word.toLowerCase()))

 lowercaseArray.forEach((word) => {
  if (lowercaseTags.includes(word) && !suggestions.includes(word.toLowerCase())) {
   suggestions.push(word)
  }
 })

 return suggestions
}

export async function generateState() {
 const timestamp = Date.now().toString()
 const randomString = Math.random().toString(36).substring(2)
 return timestamp + randomString
}

export async function generateNonce(length) {
 const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
 let nonce = ''

 for (let i = 0; i < length; i++) {
  const randomIndex = Math.floor(Math.random() * characters.length)
  nonce += characters.charAt(randomIndex)
 }

 return nonce
}
