import satori from 'satori'

const svg = await satori(
  <div style={{ color: 'black' }}>hello, world</div>,
  {
    width: 600,
    height: 400,
    fonts: [
      {
        name: 'Roboto',
        data: readFileSync("fonts/Roboto/Roboto-Medium.ttf"),
        weight: 400,
        style: 'normal',
      },
    ],
  },
)
