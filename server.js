import express from "express";
import https from "https";
import { constants } from "crypto";
import iconv from "iconv-lite";

const app = express();

app.get("/proxy", (req, res) => {
  const target = req.query.url;
  if (!target) return res.status(400).send("url required");

  const agent = new https.Agent({
    secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT
  });

  https.get(target, { agent }, (resp) => {
    const chunks = [];

    resp.on("data", (chunk) => chunks.push(chunk));

    resp.on("end", () => {
      const buffer = Buffer.concat(chunks);

      // Content-Type から charset を推定
      const contentType = resp.headers["content-type"] || "";
      let charset = "utf-8";

      const match = contentType.match(/charset=([^;]+)/i);
      if (match) {
        charset = match[1].toLowerCase();
      }

      // Shift_JIS や EUC-JP を正しくデコード
      const decoded = iconv.decode(buffer, charset);

      res.send(decoded);
    });
  }).on("error", (err) => {
    res.status(500).send(err.message);
  });
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`proxy running on ${port}`));
