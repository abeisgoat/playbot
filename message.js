import fs from "fs";

const webhook = process.env.DISCORD_WEBHOOK_URL;
const boundary="ABC123";

const bodyStart = `--${boundary}
Content-Disposition: form-data; name="content"



--${boundary}
Content-Disposition: form-data; name="files[0]"; filename="image.png"
Content-Type: image/png

`

const body = Buffer.concat([
  Buffer.from(bodyStart), 
  fs.readFileSync("./image.png"), 
  Buffer.from(`\n--${boundary}--`)
]);

const resp = await fetch(webhook, {
    method: "POST",
    headers: { 
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Disposition": `form-data; name="payload_json"`
    },
    body,
});

console.log(await resp.text());