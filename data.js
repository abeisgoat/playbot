import sqlite3 from "sqlite3";

const driver = sqlite3.verbose();
const db = new driver.Database("./data.db");
export function getModel() {
  const model = {
    history: {
      videos: {},
      channels: {},
    },
    metadata: {
        videos: {},
        channels: {},
    }
  };
  let _resolve;
  const p = new Promise((resolve) => (_resolve = resolve));
  let checks = 0;
  let resolveIfChecked = () => {
    if (++checks == 4) {
      _resolve(model);
    }
  };

  db.all(
    `
SELECT
id,
JSON_EXTRACT(snapshot, "$.id") as video_id,
date,
CAST(JSON_EXTRACT(snapshot, "$.viewCount") as INTEGER) as viewCount,
CAST(JSON_EXTRACT(snapshot, "$.likeCount") as INTEGER) as likeCount,
CAST(JSON_EXTRACT(snapshot, "$.commentCount") as INTEGER) as commentCount
FROM video_snapshots ORDER BY date DESC
`,
    [],
    (err, rows) => {
      if (err) {
        throw err;
      }

      rows.forEach((row) => {
        if (!model.history.videos[row.video_id]) {
          model.history.videos[row.video_id] = [];
        }
        model.history.videos[row.video_id].push(row);
      });
      resolveIfChecked();
    },
  );

  db.all(
    `
SELECT
id,
JSON_EXTRACT(snapshot, "$.id") as channel_id,
date,
CAST(JSON_EXTRACT(snapshot, "$.viewCount") as INTEGER) as viewCount,
CAST(JSON_EXTRACT(snapshot, "$.subscriberCount") as INTEGER) as subscriberCount,
CAST(JSON_EXTRACT(snapshot, "$.videoCount") as INTEGER) as videoCount
FROM channel_snapshots ORDER BY date DESC
`,
    [],
    (err, rows) => {
      if (err) {
        throw err;
      }

      rows.forEach((row) => {
        if (!model.history.channels[row.channel_id]) {
          model.history.channels[row.channel_id] = [];
        }
        model.history.channels[row.channel_id].push(row);
      });

      resolveIfChecked();
    },
  );

    db.all(
        `
SELECT
id,
snapshot
FROM channel_metadata
`,
        [],
        (err, rows) => {
            if (err) {
                throw err;
            }

            rows.forEach((row) => {
                model.metadata.channels[row.id] = JSON.parse(row.snapshot);
            });

            resolveIfChecked();
        },
    );

    db.all(
        `
SELECT
id,
snapshot
FROM video_metadata
`,
        [],
        (err, rows) => {
            if (err) {
                throw err;
            }

            rows.forEach((row) => {

                model.metadata.videos[row.id] = JSON.parse(row.snapshot);
            });

            resolveIfChecked();
        },
    );

  return p;
}
