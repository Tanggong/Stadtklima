export function renderCityMap(city, center,canvas) {
  // Create a new map instance

  const container = document.getElementById(canvas);

  container.style.height = "100%";

  const osm = new ol.layer.Tile({
    source: new ol.source.OSM(), // Adding OpenStreetMap as the base layer
  });

  var Mcity_map = new ol.Map({
    target: "citymap-container",
    layers: [
      (osm),
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat(center), // Center the map at (0, 0)
      zoom: 11, // Initial zoom level
      projection: "EPSG:3857",
    }),
  });

  function styleFunction(feature) {
    let colors = d3.scaleThreshold(
      [20, 40, 60, 80],
      ["#F0FADB", "#C6EC79", "#97CD89", "#33A5F5", "#0970B9"]
    );

    let stroke = new ol.style.Stroke({ color: "white", width: 0.1 });
    let value = feature.getProperties().CCA_puf;
    let fill = new ol.style.Fill({ color: colors(value) });
    let style = new ol.style.Style({ stroke: stroke, fill: fill });
    return style;
  }

  var file = "geodata/" + city + ".json";
  // Load your TopoJSON data
  fetch("geodata/Berlin.json")
    .then((response) => response.json())
    .then((data) => {
      // Convert TopoJSON to GeoJSON
      var geojsonFormat = new ol.format.TopoJSON();
      var features = geojsonFormat.readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      // Create a vector source and layer
      var ccaSource = new ol.source.Vector({
        features: features,
      });
      var ccaLayer = new ol.layer.Vector({
        source: ccaSource,
        style: styleFunction,
      });
      ccaLayer.setOpacity(0.8);
      osm.setOpacity(0.5);

      // Add the vector layer to the map
      Mcity_map.addLayer(ccaLayer);
    });
}
