import 'dotenv/config'
import { Midjourney } from 'freezer-midjourney-api'

export const client = new Midjourney({
  ServerId: process.env.SERVER_ID,
  ChannelId: process.env.CHANNEL_ID,
  SalaiToken: process.env.SALAI_TOKEN,
  Debug: false,
  MaxWait:500,
Limit:80,
  Ws: true,
})



let jobProgress = {}

export const getProgress = (id) => {
  return jobProgress[id]
}


export const generateMj = async (prompt, id) => {
  await client.init()
  try {
    const job = await client.Imagine(prompt, (uri, progress) => {
      jobProgress[id] = progress 
      console.log('loading', uri, 'progress', progress)
    })
    return JSON.stringify(job)
  } catch (error) {
    return { error: error.message }
  }
}

export const makeVariations = async (job, index) => {
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
        console.log('loading', uri, 'progress', progress)
      },
    })
    return JSON.stringify(variations)
    // console.log('variations',variations)
  } catch (error) {
    return { error: error.message }
  }
}
client.Close()

export const upscaleImage = async (job, index) => {
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
    return JSON.stringify(upscale)
  } catch (error) {
    return { error: error.message }
  }
}
client.Close()

// const Variation = await client.Custom({
//   msgId: Imagine.id,
//   flags: Imagine.flags,
//   customId: V1CustomID,
//   content: prompt, //remix mode require content
//   loading: (uri, progress) => {
//     console.log("loading", uri, "progress", progress);
//   },
// });
// console.log(Variation);
// const U1CustomID = Imagine.options?.find((o) => o.label === "U1")?.custom;
// if (!U1CustomID) {
//   console.log("no U1");
//   return;
// }
// // Upscale U1
// const Upscale = await client.Custom({
//   msgId: Imagine.id,
//   flags: Imagine.flags,
//   customId: U1CustomID,
//   loading: (uri, progress) => {
//     console.log("loading", uri, "progress", progress);
//   },
// });
// if (!Upscale) {
//   console.log("no Upscale");
//   return;
// }
// console.log(Upscale);
// const zoomout = Upscale?.options?.find((o) => o.label === "Custom Zoom");
// if (!zoomout) {
//   console.log("no zoomout");
//   return;
// }
