#!/usr/bin/env node
import "dotenv/config";

const key = process.env.GOOGLE_API_KEY;
const webhook = process.env.DISCORD_WEBHOOK_URL;
const rtdb = process.env.FIREBASE_DATABASE_URL;

const playlists = {
  all: "PLa4xcZh0RlQdsv5UICeWLHvmVYDvrqwhZ",
  newest: "PLa4xcZh0RlQc7XhhoCrgZyaXTScK1XvJO",
};

const playlistUrl = (playlistId) =>
  `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&key=${key}`;
const videoUrl = (videoId) =>
  `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`;
const databaseUrl = (date) =>
  `https://boosteroven-default-rtdb.firebaseio.com/history/${date}.json`;

const padded = (s, n) =>
  s.toString() + new Array(n - s.toString().length).fill(" ").join("");
const lpadded = (s, n) =>
  new Array(n - s.toString().length).fill(" ").join("") + s.toString();

const commated = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const get = async (url) => await (await fetch(url)).json();
const message = [];

const date = (minus) => {
  const d = new Date();
  d.setDate(d.getDate() - (minus || 0));
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

(async () => {
  const playlistAll = await get(playlistUrl(playlists.all));
  const playlistNewest = await get(playlistUrl(playlists.newest));

  const items = [...playlistAll.items, ...playlistNewest.items];

  const ids = items.map((item) => item.contentDetails.videoId);

  const videoItems = (await get(videoUrl(ids))).items;

  const info = videoItems.reduce((obj, v) => {
    obj[v.id] = {
      title: v.snippet.title,
      ...v.statistics,
    };
    return obj;
  }, {});

  const infoOrdered = Object.keys(info).sort(function (a, b) {
    return info[b].viewCount - info[a].viewCount;
  });

  const prevInfo = await fetch(databaseUrl(date(1))).then((r) => r.json());
  let totals = {
    viewDiff: 0,
    viewCount: 0,
    commentCount: 0,
    likeCount: 0,
  };

  for (const index in infoOrdered) {
    const key = infoOrdered[index];
    const video = info[key];
    const prevVideo = prevInfo[key];
    const viewDiff = video.viewCount - prevVideo.viewCount;
    totals.viewDiff += viewDiff;
    totals.viewCount += parseInt(video.viewCount);
    totals.commentCount += parseInt(video.commentCount);
    totals.likeCount += parseInt(video.likeCount);

    message.push(`${parseInt(index) + 1}. **${video.title}**`);
    message.push(
      `\`📷 ${padded(commated(video.viewCount), 8)}+${padded(viewDiff, 4)} 💬 ${padded(video.commentCount, 4)} 👍 ${((video.likeCount / video.viewCount) * 100).toFixed(1)}%\``,
    );
  }

  message.push(new Array(45).fill("-").join(""));
  message.push(
    `\`📷 ${padded(commated(totals.viewCount), 8)}+${padded(totals.viewDiff, 4)} 💬 ${padded(totals.commentCount, 4)} 👍 ${((totals.likeCount / totals.viewCount) * 100).toFixed(1)}%\``,
  );

  const firebaseResponse = await fetch(databaseUrl(date()), {
    method: "PUT",
    body: JSON.stringify(info),
  });
  const firebaseJson = await firebaseResponse.json();

  if (process.env.DRYRUN != "true") {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message.join("\n") }),
    });
  } else {
    console.log(message.join("\n"));
  }
})();
