import { Handler } from '@netlify/functions'
import * as d3 from "d3";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

const { document } = (new JSDOM('')).window;
global.document = document;

export const handler: Handler = async (event, context) => {

  let svgCoordinates = [];
  const width = 800;
  const height = 300;

  function convertLatLngToSVG(latitude: number, longitude: number, width: number, height: number): [number, number] {
    const x = (longitude + 180) * (width / 360);
    const y = (90 - latitude) * (height / 180);
    return [x, y];
  }

  const getMapData = () => {
    fetch('data/usa.txt')
      .then(response => response.text())
      .then(text => {
        const lines = text.split('\n');
        const usaSates: any = [];
        let state: any = []
        for (let line of lines) {
          let splitLine = line.split(',');
          if (splitLine.length === 2) {
            state.push(splitLine)
          }
          else if (state.length > 0) {
            usaSates.push(state)
            state = []
          }
        }
        const newSvgCoordinates = usaSates.map((state: any) => {
          return state.map(([latitude, longitude]: [number, number]) => {
            return convertLatLngToSVG(latitude, longitude, width, height);
          });
        });
        svgCoordinates = newSvgCoordinates;
      }).catch(error => {
        console.error(error);
      });
  }

  getMapData();

  const paths = svgCoordinates.map((stateCoordinates: any, index) => {

    const pathGenerator = d3.path();
    pathGenerator.moveTo(stateCoordinates[0][0], stateCoordinates[0][1]);
    for (let i = 1; i < stateCoordinates.length; i++) {
      pathGenerator.lineTo(stateCoordinates[i][0], stateCoordinates[i][1]);
    }
    pathGenerator.closePath();
    return pathGenerator.toString();
  });


  let body = d3.select(document).select("body");
  let svg = body.append("svg")
    .attr("width", width)
    .attr("height", height);

  let group = svg.append("g")
    .attr("transform","translate(1950,570) scale(5 5) scale(-1,1) rotate(-90)")
  group.selectAll("path")
    .data(paths)
    .enter()
    .append("path")
    .attr("d", d => d)

  
  return {
    statusCode: 200,
    headers: {
      'Content-type': 'text/html; charset=UTF-8',
    },
    body: body.node().innerHTML
  }
}
