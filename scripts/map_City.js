import {Legend} from "/Map.js";

export function renderCityMap(city, center, canvas) {

  const mapcontainer = document.getElementById("citymap-container");
  const container = document.getElementById(canvas);
  const sidebarContainer =document.getElementById("citymap-sidebar");

  // turn canvas to visible
  container.style.visibility = "visible";

  //if container is not empty, first clear the content
  function clearCanvas() {
    if(mapcontainer != ""){
      mapcontainer.innerHTML = "";
      sidebarContainer.innerHTML = "";
    };
  };

    clearCanvas();

    // set container height

    container.style.height = "100%";

  // //set background map
  // const osm = new ol.layer.Tile({
  //   source: new ol.source.OSM(), // Adding OpenStreetMap as the base layer
  // });

  // set background Map, using WMS TopPlusOpen
  const base = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        url:"https://sgx.geodatenzentrum.de/wms_topplus_open",
        params: {'LAYERS': 'web_light_grau', 'TILED': true},
    }) 
  });

  var Mcity_map = new ol.Map({
    layers: [
      base
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat(center), // Center the map at (0, 0)
      zoom: 11, // Initial zoom level
      projection: "EPSG:3857",
    }),
    target: "citymap-container",
  });
  

    //set color palette
    let colors = d3.scaleThreshold(
      [20, 40, 60, 80],
      ['#fdee86', '#a7e159', '#75c676', '#3faa95', '#0089b9']
    );

  //set styling function for choropleth map
  function styleFunction(feature) {
    let stroke = new ol.style.Stroke({ color: "white", width: 0.1 });
    let value = feature.getProperties().CCA_puf;
    let fill = new ol.style.Fill({ color: colors(value) });
    let style = new ol.style.Style({ stroke: stroke, fill: fill });
    return style;
  }

  var file = "geodata/" + city + ".json";
  // Load TopoJSON data
  fetch(file)
    .then((response) => response.json())
    .then((data) => {
      // Convert TopoJSON to GeoJSON
      var geojsonFormat = new ol.format.TopoJSON();
      var features = geojsonFormat.readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      // Create a vector source and layer
      var ccaSource = new ol.source.Vector();      
      ccaSource.addFeatures(features);

      var ccaLayer = new ol.layer.Vector({
        source: ccaSource,
        style: styleFunction,
      });
      ccaLayer.setOpacity(0.8);

      
      // Add the vector layer to the map
      Mcity_map.addLayer(ccaLayer);
    });


    //set legend
    const sidebarHeight = sidebarContainer.clientHeight; // Get the height of the left container

    // Create the SVG element to set legend
    var sidebar = d3
      .select("#citymap-sidebar")
      .append("svg")
      .attr("height", sidebarHeight);
    
    sidebar
        .append("g")
        .attr("id", "lgd_citymap")
        .attr("class", "legend")
        .attr("transform", `translate(50,${sidebarHeight/1.5})`)
        .append(() =>
          Legend(colors, {
            title: "Kühlkapazitätspunkte",
          })
        );
    
    // add event listener for close button
    const closeButton = document.getElementById("close-button");
    closeButton.addEventListener("click", () => {
      container.style.visibility = "hidden";
      clearCanvas();
    });
}

