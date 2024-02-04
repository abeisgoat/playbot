import satori from 'satori'
import {readFileSync, writeFileSync} from 'fs'
import { Resvg } from '@resvg/resvg-js'

const attributes = {
  width: 600,
  height: 400
}

const svg = await satori(
  {
    type: 'div',
    props: {
      children: 'This is a test image with the Roboto font.',
      style: { color: 'black', padding: "10px" },
    },
  },
  {
    ...attributes,
    fonts: [
      {
        name: 'Roboto',
        data: readFileSync("fonts/Roboto/Roboto-Light.ttf"),
        weight: 400,
        style: 'light',
      },
    ],
  },
)

const opts = {
  background: 'rgba(238, 235, 230, .9)',
  fitTo: {
    mode: 'width',
    value: attributes.width,
  },
  font: {
    fontFiles: [],
    loadSystemFonts: false, 
  },
}
const resvg = new Resvg(svg, opts)
const pngData = resvg.render()
const pngBuffer = pngData.asPng()

writeFileSync("./image.png", pngBuffer);
