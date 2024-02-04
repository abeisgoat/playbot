import fs from "fs";

const webhook = process.env.DISCORD_WEBHOOK_URL;

const boundary="ABC123";
const payload_json=JSON.stringify({ 
    content: "this is an image",
    attachments:    {
        "id": 0,
        "description": "Image of a cute little cat",
        "filename": "image.png"
    },
    files: {
      "thumbnail": {
        "url": "attachment://image.png"
      },
      "image": {
        "url": "attachment://image.png"
      }
    }
});

const body = `---${boundary}
Content-Disposition: form-data; name="payload_json"
Content-Type: application/json

${payload_json}
--${boundary}
Content-Disposition: form-data; name="files[0]"; filename="image.png"
Content-Type: image/png

`

const resp = await fetch(webhook, {
    method: "POST",
    headers: { 
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Disposition": `form-data; name="payload_json"`
    },
    body: Buffer.concat([
        Buffer.from(body), 
        fs.readFileSync("./image.png"), 
        Buffer.from(`\n--${boundary}--`)
    ]),
});

console.log(body);
console.log(await resp.text());