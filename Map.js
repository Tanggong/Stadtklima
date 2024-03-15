import { renderCityMap } from "/map_City.js";

// Define the SVG width and height by window size

adjustContainerSize();

const width = document.getElementById("map-container").clientWidth;
const height = document.getElementById("map-container").clientHeight;


  // the list of milion cities
  const mCity = [
    { gen: "Berlin", coord: [13.3777, 52.5182] },
    { gen: "Hamburg", coord: [9.992, 53.5502] },
    { gen: "München", coord: [11.5755, 48.1372] },
    { gen: "Köln", coord: [6.9583, 50.9413] },
  ];
  
// Create the SVG element
var map = d3
  .select("#map-container")
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

// Declare layers
const lyr_base = map.append("g");
const lyr_city = map.append("g");
const lyr_mCity = map.selectAll("g").data(mCity).enter().append("g").attr("display", "none").attr("id","mCity");
const lyr_popUp = map.append("g");

// Geojson File path
const files = ["geodata/CCA_80_u_mehr_Ant_Ew_vg_25_GEM.geojson", "geodata/Germany.geojson"];

let promises = [];

// Load each geojson file, geojson transfered and simplified from shp in QGIS
files.forEach((url) => promises.push(d3.json(url)));
Promise.all(promises).then(function (data) {
  var value_cities = data[0];
  var base_map = data[1];

  // Append base map paths
  lyr_base
    .selectAll("path")
    .data(base_map.features)
    .enter()
    .append("path")
    .attr("id", "base-map")
    .attr("d", path)
    .attr("fill", "transparent")
    .attr("stroke", "grey");

  // Append city paths
  lyr_city
    .selectAll("path")
    .data(value_cities.features)
    .enter()
    .append("path")
    .attr("id", "city")
    .attr("d", path)
    .attr("fill", (d) => color(d.properties.SUM_EW_Ant))
    .attr("title", "1");





  // filter polygon of the million city
  const mCityNames = mCity.map((mCity) => mCity.gen);

  const poly_mCity = lyr_city.selectAll("#city").filter(d => mCityNames.includes(d.properties.GEN));

  // as milion cities are clickable, so sho
  poly_mCity
  .transition()
  .duration(200) // Set transition duration (optional)
  .attr("transform", (d) => "translate(" + -1 + "," + -1 + ")") // Shift polygon
  .attr("cursor","pointer")
  .each(function (d) {
    // Create a single filter element within the transition (shared for all)
    const filter = d3
      .select(this.parentNode)
      .append("filter") // Append to parent group
      .attr("id", "highlightShadow"); // Use a single ID

    filter
      .append("feDropShadow")
      .attr("dx", 3) // Adjust shadow offset
      .attr("dy", 3)
      .attr("blur", 2) // Adjust shadow blur
      .attr("flood-color", "black");

    // Apply the filter with the same ID to all highlighted paths
    d3.select(this).attr("filter", "url(#highlightShadow)");
  });
  // Add Click event to jump to milion city

  poly_mCity.on("click", function(event, d) {

    const city = d.properties.GEN;
    const center = getCenter(city, mCity);
    renderCityMap(city,center,"canvas2");
    jumpToCity("canvas2");
  });

    // add point to milion cities, before click, it shouldn't shown
    const pnt_mCity = lyr_mCity
    .selectAll("circle")
    .data(mCity)
    .enter()
    .append("circle")
    .attr("cx", (d) => projection(d.coord)[0])
    .attr("cy", (d) => projection(d.coord)[1])
    .attr("r", 3)
    .attr("stroke", "black");

  const lbl_mCity = lyr_mCity
    .selectAll("text")
    .data(mCity)
    .enter()
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", (d) => projection(d.coord)[0])
    .attr("y", (d) => projection(d.coord)[1] - 10)
    .text((d) => d.gen)
    .attr("font-size", "18px")
    .attr("fill", "black")
    .attr("font-weight", "bold")
    .attr("class", "text-with-halo");
    
  lyr_mCity.on("click", function(event, d) {
    const city = d.gen;
    const center = d.coord;
    renderCityMap(city,center,"canvas2");
    jumpToCity("canvas2");
  });

  // Append tooltip to show information
  const tooltip = lyr_popUp.append("g").attr("class", "tooltip");
  // const infoWindow = lyr_popUp.append("g").attr("id", "infoBox");


  // Add mouse listener to display hover effect
  map
    .selectAll("#city")
    .on("touchmove mouseover mousemove", function (event, d) {
      tooltip.call(popUp, `${d.properties.GEN}`, `${d.properties.SUM_EW_Ant}`);
      tooltip.attr("transform", `translate(${d3.pointer(event, this)})`);

      d3.selectAll("#city").transition().duration(200).style("opacity", 0.5);
      d3.select(this).transition().duration(200).style("opacity", 1);
    })
    .on("touchend mouseleave", function () {
      tooltip.call(popUp, null);

      d3.selectAll("#city").transition().duration(200).style("opacity", 0.8);
      d3.select(this).transition().duration(200).style("stroke", null);
    });

  //append legend

  map
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width / 1.2},${height / 1.5})`)
    .append(() =>
      Legend(color, {
        title: "Anteil (%)",
      })
    );

  // add a button to show attributes
  document.getElementById("bnt_info").addEventListener("hover", infoBox());

  // Show Million Cities if tag is clicked
  document.getElementById("tag_MCity").addEventListener("click", showMCity);

  // Function to show the annotation of million cities
  function showMCity() {
    lyr_mCity.attr("display", "block");
    pnt_mCity
      .attr("cx", (d) => projection(d.coord)[0])
      .attr("cy", (d) => projection(d.coord)[1]);
    lbl_mCity
      .attr("x", (d) => projection(d.coord)[0])
      .attr("y", (d) => projection(d.coord)[1] - 10);
  }


  // Add event listener for window resize
  return window.addEventListener("resize", updateDimensions);
});

// scoll to next canvas and render city map
function jumpToCity(sectionId) {
  // renderCityMap("Berlin","canvas2");
  const targetSection = document.getElementById(sectionId);
    targetSection.scrollIntoView({ behavior: "smooth" });};

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
  projection = projection
    .center([10.4515, 51.1657]) // Center the map in the SVG
    .scale((winHeight / 22) * 100) // Zoom level
    .translate([winWidth / 2.5, winHeight / 2]);

  // Update path generator with the new projection
  path.projection(projection);

  // Update base map paths with the new projection
  map.selectAll("#base-map").attr("d", path);

  // Update city paths with the new projection
  map.selectAll("#city").attr("d", path);

  // Update legend with the new projection
  map
    .selectAll(".legend")
    .attr("transform", `translate(${winWidth / 1.2},${winHeight / 1.5})`);

  // disable mcity labels when resize
  lyr_mCity.attr("display", "none");
}

function adjustContainerSize() {
  const container = document.getElementById("canvas");
  const txtcontainer = document.getElementById("text-container");
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  if (windowWidth * windowHeight > 650000) {
    container.style.height = "100%";
  } else {
    container.style.height = "auto";
    txtcontainer.style.overflow = "auto";
    txtcontainer.style.justifyContent = "start";
  }
}

export function Legend(
  color,
  {
    title,
    tickSize = 5,
    width = 10 + tickSize,
    height = 200,
    marginTop = 30,
    marginRight = 0,
    marginBottom = 10 + tickSize,
    marginLeft = 0,
    ticks = width / 65,
    tickFormat,
    tickValues,
  } = {}
) {
  const legend = d3
    .create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  let tickAdjust = (g) => {
    g.selectAll(".tick line").attr("x1", marginLeft + marginRight - width);
    g.selectAll(".tick text").attr("font-size", 15).attr("font-family", "Segoe UI");
  };
  let y;

  // Continuous
  if (color.invertExtent) {
    const thresholds = color.thresholds
      ? color.thresholds() // scaleQuantize
      : color.quantiles
      ? color.quantiles() // scaleQuantile
      : color.domain(); // scaleThreshold

    const thresholdFormat =
      tickFormat === undefined
        ? (d) => d
        : typeof tickFormat === "string"
        ? d3.format(tickFormat)
        : tickFormat;

    // x = d3.scaleLinear()
    //     .domain([-1, color.range().length - 1])
    //     .rangeRound([marginLeft, width - marginRight]);

    y = d3
      .scaleLinear()
      .domain([-1, color.range().length -1])
      .rangeRound([marginTop, height - marginBottom]);

    legend
      .append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", marginLeft)
      .attr("y", (d, i) => y(i - 1))
      .attr("width", width - marginLeft - marginRight)
      .attr("height", (d, i) => y(i) - y(i - 1))
      .attr("fill", (d) => d);

    tickValues = d3.range(thresholds.length);
    tickFormat = (i) => thresholdFormat(thresholds[i], i);
  }

  legend
    .append("g")
    .attr("transform", `translate(${width - marginLeft},0)`)
    .call(
      d3
        .axisRight(y)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues)
        
    )
    .call(tickAdjust)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", marginLeft + marginRight - width)
        .attr("y", marginTop - 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("font-size", "16px")
        .attr("class", "title")
        .text(title)
    );

  return legend.node();
}

//get center from milion city list
function getCenter(cityName, citylist) {
  for (let i = 0; i < citylist.length; i++) {
    if (citylist[i].gen === cityName) {
      return citylist[i].coord;
    }
  }
  return null;
}


