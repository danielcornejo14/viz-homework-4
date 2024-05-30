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

        const partition = d3.partition()
            .size([width, height])
            .padding(1);  

       
        const root = d3.hierarchy(data)
            .sum(d => d.value)  
            .sort((a: any, b: any) => b.height - a.height || b.value - a.value);

        partition(root);

       
        const color = d3.scaleOrdinal(d3.schemeCategory10);

        svg.selectAll('rect')
            .data(root.descendants())
            .enter()
            .append('rect')
            .attr('x', (d:any) => d.x0)
            .attr('y', (d:any) => d.y0)
            .attr('width', (d:any) => d.x1 - d.x0)
            .attr('height', (d:any) => d.y1 - d.y0)
            .style('fill', d => color(d.depth.toString()));


        svg.selectAll('text')
            .data(root.descendants().filter((d:any) => d.x1 - d.x0 > 40))
            .enter()
            .append('text')
            .attr('x', (d:any) => d.x0 + 10) 
            .attr('y', (d:any) => d.y0 + 20) 
            .text(d => d.data.name)
            .attr('font-size', '12px')
            .attr('fill', 'white');

  return {
    statusCode: 200,
    headers: {
      'Content-type': 'text/html; charset=UTF-8',
    },
    body: body.node().innerHTML
  }
}
