const { Client, LocalAuth } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode-terminal");
const bodyParser = require("body-parser");
const axios = require("axios");
const mime = require("mime-types");

const app = express();
app.use(bodyParser.json());

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("🔒 Scan QR code to login");
});

client.on("ready", () => {
  console.log("✅ WhatsApp is ready!");
});

client.initialize();

// Kirim pesan teks
app.post("/send", async (req, res) => {
  const { number, message } = req.body;
  const chatId = number + "@c.us";

  try {
    await client.sendMessage(chatId, message);
    res.send({ status: "sent", number });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Kirim pesan media
app.post("/send-media", async (req, res) => {
  const { number, fileUrl, caption } = req.body;
  const chatId = number + "@c.us";

  try {
    const response = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const mimetype = response.headers["content-type"] || mime.lookup(fileUrl);

    const media = new (require("whatsapp-web.js").MessageMedia)(
      mimetype,
      Buffer.from(response.data, "binary").toString("base64"),
      "media"
    );

    await client.sendMessage(chatId, media, { caption });
    res.send({ status: "sent", number });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
