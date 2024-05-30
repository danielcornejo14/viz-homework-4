import { Handler } from '@netlify/functions'
import * as d3 from "d3";
import jsdom from "jsdom";

const { JSDOM } = jsdom;

const { document } = (new JSDOM('')).window;
global.document = document;

export const handler: Handler = async (event, context) => {
  const {file = "file"} = event.queryStringParameters;
  const files = {
    0: "/data/distritosHierarchy.json",
    1: "/data/flareHierarchy.json",
    2: "/data/vueHierarchy.json"
  }
  const response = await fetch(process.env.URL + files[file])
  const data = await response.json()

  const width = 800;
  const height = 600;


  const body = d3.select(document).select("body");
  body.selectAll("*").remove();
  const svg = body.append("svg");
    svg.attr("width", width).attr("height", height);

    const root = d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.value! - a.value!);

    const treemapRoot = d3
      .treemap()
      .tile(d3.treemapBinary)
      .size([width, height])
      .padding(1)(root);

    const nodes = svg
      .selectAll("g")
      .data(treemapRoot.leaves())
      .join("g")
      .attr("transform", (d) => `translate(${d.x0}, ${d.y0})`);

    const fader = (color: string) => d3.interpolateRgb(color, "#fff")(0.2);
    const color = d3.scaleOrdinal(d3.schemeCategory10.map(fader));

    nodes
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) =>
        color((d.ancestors().find((a) => a.depth === 1)?.data as any).name)
      );

    nodes
      .append("clipPath")
      .attr("id", (d, i) => `clip-${i}`)
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0);

    nodes
      .append("rect")
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) =>
        color((d.ancestors().find((a) => a.depth === 1)?.data as any).name)
      );

    nodes
      .filter((d) => d.x1 - d.x0 > 25 && d.y1 - d.y0 > 25)
      .append("text")
      .attr("x", 5)
      .attr("y", 15)
      .text((d) => (d.data as any).name);

    nodes.append("title").text((d) => (d.data as any).name);

    return {
      statusCode: 200,
      headers: {
        'Content-type': 'text/html; charset=UTF-8',
      },
      body: body.node().innerHTML
    }
}
