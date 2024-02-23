import express, { json } from 'express';
import { post, get } from 'axios';
const app = express();
app.use(json());

// DiscordService equivalent in Express
class DiscordService {
  async sendImagineCommand(prompt) {
    const postUrl = "https://discord.com/api/v9/interactions";
    const uniqueId = this.generateId();
    const postPayload = {
      // Your payload here
    };
    const postHeaders = {
      authorization: "<your auth token>",
      "Content-Type": "application/json"
    };

    try {
      const response = await post(postUrl, postPayload, { headers: postHeaders });
      console.log(response.data);
    } catch (error) {
      console.error(error);
    }

    return uniqueId;
  }

  generateId() {
    return Math.floor(Math.random() * 1000);
  }

  async getResultFromMidjourney(id) {
    const headers = {
      "Authorization": "MIDJOURNEY_TOKEN",
      "Content-Type": "application/json"
    };
    const channelUrl = `https://discord.com/api/v9/channels/${CHANNEL_ID}/messages?limit=50`;

    try {
      const response = await get(channelUrl, { headers: headers });
      const data = response.data;

      // Your message filtering logic here

      return matchingMessage;
    } catch (error) {
      // Handle error
    }
  }

  async fetchAndEncodeImage(url) {
    try {
      const response = await get(url, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:${response.headers['content-type']};base64,${base64}`;
    } catch (error) {
      // Handle error
    }
  }
}

const discordService = new DiscordService();

// Express routes equivalent to NestJS controllers
app.post('/discord/imagine', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const result = await discordService.sendImagineCommand(prompt);
    res.json({ id: result });
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.get('/discord/mj/results/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await discordService.getResultFromMidjourney(id);
    res.json(result);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
