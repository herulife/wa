const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const qrcode = require("qrcode-terminal");
const bodyParser = require("body-parser");
const axios = require("axios");
const mime = require("mime-types");

const app = express();
app.use(bodyParser.json());

// Inisialisasi client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ["--no-sandbox"], // wajib kalau di Railway
  },
});

// Tampilkan QR code di terminal saat pertama kali
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Jika berhasil login
client.on("ready", () => {
  console.log("✅ WhatsApp is ready!");
});

// Mulai koneksi WhatsApp
client.initialize();

// ===============================
// Endpoint: Kirim Pesan Teks
// ===============================
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

// ===============================
// Endpoint: Kirim Media dari URL
// ===============================
app.post("/send-media", async (req, res) => {
  const { number, fileUrl, caption } = req.body;
  const chatId = number + "@c.us";

  try {
    const response = await axios.get(fileUrl, {
      responseType: "arraybuffer",
    });

    const mimeType = response.headers["content-type"];
    const extension = mime.extension(mimeType);

    const media = new MessageMedia(
      mimeType,
      Buffer.from(response.data).toString("base64"),
      "file." + extension
    );

    await client.sendMessage(chatId, media, {
      caption: caption || "",
    });

    res.send({ status: "sent", number });
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// ===============================
// Jalankan server Express
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
