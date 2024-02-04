import satori from "satori";
import { readFileSync, writeFileSync } from "fs";
import { Resvg } from "@resvg/resvg-js";

const attributes = {
  width: 600,
  height: 600,
};

const svg = await satori(
  {
    type: "div",
    props: {
      children: [
        {
          type: "img",
          props: {
            src: "https://yt3.googleusercontent.com/EINPgUCs47PqBCzMTfn5KEIo3-Ry96fr7EA5XGpA5f1OA_HS77Tt0yXxLYFRmlXIiO3bIN1kJ2E=s176-c-k-c0x00ffffff-no-rj",
            width: "100px",
            height: "100px,",
          },
        },
        {
          type: "div",
          props: { 
            children: "Daily Summary",
            style: {fontFamily: "Roboto", fontSize: "1.3em"}
          },
        },
      ],
      style: { color: "black", padding: "10px", display: "flex", gap: "10px" },
    },
  },
  {
    ...attributes,
    fonts: [
      {
        name: "Roboto",
        data: readFileSync("fonts/Roboto/Roboto-Light.ttf"),
        weight: 400,
        style: "light",
      },
      {
        name: "Roboto-Bold",
        data: readFileSync("fonts/Roboto/Roboto-Bold.ttf"),
        weight: 600,
        style: "bold",
      },
    ],
  },
);

const opts = {
  background: "rgba(238, 235, 230, .9)",
  fitTo: {
    mode: "width",
    value: attributes.width,
  },
  font: {
    fontFiles: [],
    loadSystemFonts: false,
  },
};
const resvg = new Resvg(svg, opts);
const pngData = resvg.render();
const pngBuffer = pngData.asPng();

writeFileSync("./image.png", pngBuffer);
