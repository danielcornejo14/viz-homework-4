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
  const radius = Math.min(width, height) / 2; // Calculating the radius for the radial layout

  // Create a radial tree layout
  const cluster = d3
    .cluster()
    .size([360, radius - 10]) // Angle in degrees and radius of the cluster
    .separation((a, b) => 1); // Separation between nodes

  const root = d3.hierarchy(data).sum((d) => 1); // Weight of the nodes, useful for partitioning

  cluster(root);

  // Create links as curved paths
  const linkGenerator = d3
    .linkRadial<d3.HierarchyPointNode<any>, d3.HierarchyPointNode<any>>()
    .angle((d) => ((d.x as any) / 180) * Math.PI)
    .radius((d) => d.y);

  svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`)
    .selectAll("path")
    .data(root.links())
    .enter()
    .append("path")
    .attr("d", linkGenerator as any) // Cast linkGenerator to the correct type
    .style("fill", "none")
    .style("stroke", "#555");

  const fader = (color: string) => d3.interpolateRgb(color, "#fff")(0.2);
  const color = d3.scaleOrdinal(d3.schemeCategory10.map(fader));
  // Create nodes as circles
  const nodes = svg
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`)
    .selectAll("circle")
    .data(root.descendants())
    .enter()
    .append("circle")
    .attr(
      "transform",
      (d) => `rotate(${(d.x as any) - 90}) translate(${d.y}, 0)`
    )
    .attr("r", 5)
    .style("fill", (d) => color((d.children ? d : d.parent) as any));


      nodes.append("title").text((d) => d.data.name);


      return {
        statusCode: 200,
        headers: {
          'Content-type': 'text/html; charset=UTF-8',
        },
        body: body.node().innerHTML
      }
}
