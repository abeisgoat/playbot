#!/usr/bin/bash node
import sqlite3 from "sqlite3";
import yaml from "js-yaml";
import { readFileSync } from "fs";

const driver = sqlite3.verbose();

const db = new driver.Database("./data.db");

const key = process.env.GOOGLE_API_KEY;
const config = yaml.load(readFileSync("./bot.yml"));

const playlistUrl = (playlistId) =>
  `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${playlistId}&key=${key}`;
const videoUrl = (videoId) =>
  `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${key}`;
const channelUrl = (channelId) =>
  `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${key}`;
const get = async (url) => await (await fetch(url)).json();

const date = (minus) => {
  const d = new Date();
  d.setDate(d.getDate() - (minus || 0));
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

let playlistItems = [];
for (const playlistId in config.playlists) {
  const playlist = await get(playlistUrl(config.playlists[playlistId]));

  playlistItems = [...playlistItems, ...playlist.items];
}

const videoIds = playlistItems.map((item) => item.contentDetails.videoId);

const videoItems = (await get(videoUrl(videoIds))).items;

const videos = videoItems.reduce((obj, v) => {
  obj[v.id] = {
    id: v.id,
    ...v.statistics,
  };

  return obj;
}, {});

const channels = {};
for (const channelName in config.channels) {
  const channelId = config.channels[channelName];
  channels[channelName] = (await get(channelUrl(channelId))).items[0];
}

db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS video_snapshots (id TEXT PRIMARY KEY, date DATE, snapshot TEXT)",
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS channel_snapshots (id TEXT PRIMARY KEY, date DATE, snapshot TEXT)",
  );

  for (const channelName in config.channels) {
    const channelRaw = channels[channelName];
    const channel = {
      id: channelRaw.id,
      ...channelRaw.statistics,
    };

    db.run(
      "INSERT INTO channel_snapshots(id, date, snapshot) VALUES(?, ?, ?) ON CONFLICT(ID) DO UPDATE SET snapshot = excluded.snapshot",
      [`${date()}-${channel.id}`, new Date(), JSON.stringify(channel)],
    );
  }

  for (const record in videos) {
    const obj = videos[record];
    db.run(
      "INSERT INTO video_snapshots(id, date, snapshot) VALUES(?, ?,?) ON CONFLICT(id) DO UPDATE SET snapshot = excluded.snapshot",
      [`${date()}-${obj.id}`, new Date(), JSON.stringify(obj)],
    );
  }
});
db.close();

console.log("Daily database data added.");
