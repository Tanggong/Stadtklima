adjustContainerSize();

// Define the SVG width and height by window size
const width = document.getElementById("map-container").clientWidth;
const height = document.getElementById("map-container").clientHeight;

// Create the SVG element
var map = d3
  .select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Define the projection (Mercator) EPSG 4326
var projection = d3
  .geoMercator()
  .center([10.4515, 51.1657]) // Center the map in the SVG
  .scale((height / 22) * 100) // Zoom level
  .translate([width / 2.5, height / 2]); // Translate to the center

// set the color palette (ioer secondary colors)
var color = d3.scaleThreshold(
  [55, 65, 75, 85],
  ["#f5d300", "#ccc40b", "#22942c", "#007c6e", "#0089b9"]
);

// Create a path generator
var path = d3.geoPath().projection(projection);

// Geojson File path
const files = [
  "CCA_80_u_mehr_Ant_Ew_vg_25_GEM.geojson",
  "Germany.geojson",
];

let promises = [];

// Load each geojson file, geojson transfered and simplified from shp in QGIS
files.forEach((url) => promises.push(d3.json(url)));
Promise.all(promises).then(function (data) {
  var value_cities = data[0];
  var base_map = data[1];

  // Append base map paths
  map.append('g')
    .selectAll("#base_map")
    .data(base_map.features)
    .enter()
    .append("path")
    .attr("id", "base-map")
    .attr("d", path)
    .attr("fill", "transparent")
    .attr("stroke", "grey");

  // Append city paths
  map.append('g')
    .selectAll("#city")
    .data(value_cities.features)
    .enter()
    .append("path")
    .attr("id", "city")
    .attr("d", path)
    .attr("fill", (d) => color(d.properties.SUM_EW_Ant))
    .attr("title", "1");

  // Append tooltip to show information
  const tooltip = map.append("g").attr("class", "tooltip");

  // Add mouse listener to display hover effect
  map
    .selectAll("#city")
    .on("touchmove mouseover", function (event, d) {
      tooltip.call(
        popUp,
        `${d.properties.GEN}`,
        `${d.properties.SUM_EW_Ant}`
      );
      tooltip.attr("transform", `translate(${d3.pointer(event, this)})`);

      d3.selectAll("#city")
        .transition()
        .duration(200)
        .style("opacity", 0.5);
      d3.select(this).transition().duration(200).style("opacity", 1);
    })
    .on("touchend mouseleave", function () {
      tooltip.call(popUp, null);

      d3.selectAll("#city")
        .transition()
        .duration(200)
        .style("opacity", 0.8);
      d3.select(this).transition().duration(200).style("stroke", null);
    });


    // //enable zoom
  // const zoom = true;

  // var zoomable = d3
  //   .zoom()
  //   .scaleExtent([1, 2])
  //   .on("zoom", function (event) {
  //     map.selectAll("path").attr("transform", event.transform);
  //     tooltip.attr("transform", `d3.pointer(event, this)`); // Update tooltip position
  //   });

  // optional zoom effect, tooltips location wrong after zoomed
  // map.call(zoomable);

  // Add event listener for window resize
  window.addEventListener("resize", updateDimensions);
});

legend =Legend(color, {
title: "Anteil (%)"
});
d3.select("#legend").append(() => legend);
// define a pop up window
function popUp(g, name, value) {
  if (!value) return g.style("display", "none");

  g.style("display", null)
    .style("pointer-events", "none")
    .style("font-size", "14px");

  const path = g
    .selectAll("path")
    .data([null])
    .join("path")
    .attr("fill", "white")
    .attr("stroke", "black");

  const text = g
    .selectAll("text")
    .data([null])
    .join("text")
    .call((text) =>
      text
        .selectAll("tspan")
        .data([
          // Use an array to bind name and value
          `${name}`,
          `Anteil: ${d3.format(".2f")(value)}%`, // Second tspan for value
        ])
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i) => `${i * 1.1}em`)
        .style("font-weight", (_, i) => (i ? "bold" : null))
        .text((d) => d)
    );

  const { x, y, width: w, height: h } = text.node().getBBox();
  text.attr("transform", `translate(${-w / 2},${y - 15})`);
  path.attr(
    "d",
    `M${-w / 2 - 10},-5 H-5l5,5l5,-5H${w / 2 + 10}v${-h - 10}h-${w + 20}z`
  );
}

// Function to update SVG dimensions when window is resized
function updateDimensions() {
  adjustContainerSize();
  const winWidth = document.getElementById("map-container").clientWidth; // Get the width of the left container
  const winHeight = document.getElementById("map-container").clientHeight; // Get the height of the left container

  // Update SVG dimensions
  map.attr("width", winWidth).attr("height", winHeight);

  // Update projection
  projection
    .center([10.4515, 51.1657]) // Center the map in the SVG
    .scale((winHeight / 22) * 100) // Zoom level
    .translate([winWidth / 2.5, winHeight / 2]);

  // Update path generator with the new projection
  path.projection(projection);

  // Update base map paths with the new projection
  map.selectAll("#base-map").attr("d", path);

  // Update city paths with the new projection
  map.selectAll("#city").attr("d", path);
}

function adjustContainerSize() {
  const container = document.getElementById("canvas");
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (windowWidth * windowHeight < 650000) {
    container.style.height = "auto";
  } else {
    container.style.height = "100%";
  }
}

function Legend(color, {
  title,
tickSize = 5,
width = 10 + tickSize, 
height = 200,
marginTop = 20,
marginRight = 0,
marginBottom = 10 + tickSize,
marginLeft = 0,
ticks = width / 65,
tickFormat,
tickValues
} = {}) {


const legend = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .style("overflow", "visible")
  .style("display", "block");

let tickAdjust = g => {
g.selectAll(".tick line").attr("x1", marginLeft + marginRight - width)
g.selectAll(".tick text").attr("font-size",12);      
};
let y;

// Continuous
if (color.invertExtent) {
const thresholds
    = color.thresholds ? color.thresholds() // scaleQuantize
    : color.quantiles ? color.quantiles() // scaleQuantile
    : color.domain(); // scaleThreshold

const thresholdFormat
    = tickFormat === undefined ? d => d
    : typeof tickFormat === "string" ? d3.format(tickFormat)
    : tickFormat;

// x = d3.scaleLinear()
//     .domain([-1, color.range().length - 1])
//     .rangeRound([marginLeft, width - marginRight]);

    y = d3.scaleLinear()
    .domain([-1, color.range().length - 1])
    .rangeRound([marginTop, height - marginBottom]);

    legend.append("g")
  .selectAll("rect")
  .data(color.range())
  .join("rect")
    .attr("x", marginLeft)
    .attr("y", (d, i) => y(i - 1))
    .attr("width", width - marginLeft - marginRight)
    .attr("height", (d, i) => y(i) - y(i - 1))
    .attr("fill", d => d);

tickValues = d3.range(thresholds.length);
tickFormat = i => thresholdFormat(thresholds[i], i);
};

legend.append("g")
.attr("transform", `translate(${width - marginLeft},0)`)
  .call(d3.axisRight(y)
    .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
    .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
    .tickSize(tickSize)
    .tickValues(tickValues))
  .call(tickAdjust)
  .call(g => g.select(".domain").remove())
  .call(g => g.append("text")
    .attr("x", marginLeft + marginRight - width )
    .attr("y", marginTop- 6)
    .attr("fill", "currentColor")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .attr("font-size","15px")
    .attr("class", "title")
    .text(title));

return legend.node();
}