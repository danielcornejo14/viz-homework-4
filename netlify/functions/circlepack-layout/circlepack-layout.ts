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
  const height = 800;

  const body = d3.select(document).select("body");
  body.selectAll("*").remove();
  const svg = body.append("svg");
    svg.attr("width", width).attr("height", height);

    const color = d3.scaleSequential([0, 5], d3.interpolateMagma); // Color scale based on depth

    // Set up the circle pack layout
    const pack = d3.pack().size([width, height]).padding(3); // Padding between circles

    // Prepare the root node data
    const root = d3
      .hierarchy(data)
      .sum((d) => d.value) // Here the value determines the area of the circle
      .sort((a: any, b: any) => b.value - a.value); // Sort to ensure smaller circles are drawn last

    // Layout the data
    pack(root);

    // Draw the circles for each node
    const nodes = svg
      .append("g")
      .selectAll("circle")
      .data(root.descendants())
      .join("circle")
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y)
      .attr("r", (d: any) => d.r)
      .style("fill", (d) => color(d.depth))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // Optional: Add text labels to the circles
    svg
      .append("g")
      .selectAll("text")
      .data(root.descendants().filter((d: any) => d.r > 20)) // Only add labels to circles with a radius > 20 for readability
      .join("text")
      .attr("x", (d: any) => d.x)
      .attr("y", (d: any) => d.y)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em") // Vertical alignment
      .text((d) => d.data.name)
      .attr("fill", "white")
      .attr("font-size", "12px");

      return {
        statusCode: 200,
        headers: {
          'Content-type': 'text/html; charset=UTF-8',
        },
        body: body.node().innerHTML
      }
}