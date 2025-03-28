function createVis(polygon) {
  const width = 960;
  const height = 500;

  const projection = d3.geoAlbers()
    .rotate([120, 0])
    .center([0, 37.7])
    .scale(2700);

  const svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  const path = svg.append("path")
    .attr("fill", "#ccc")
    .attr("stroke", "#333");

  const coordinates0 = polygon.coordinates[0].map(projection);
  const coordinates1 = circle(coordinates0);
  const d0 = "M" + coordinates0.join("L") + "Z";
  const d1 = "M" + coordinates1.join("L") + "Z";

  loop();

  async function loop() {
    await path
      .attr("d", d0)
      .transition()
      .duration(5000)
      .attr("d", d1)
      .transition()
      .delay(5000)
      .attr("d", d0)
      .end();
    requestAnimationFrame(loop);
  }
}

function circle(coordinates) {
  const circle = [];
  let length = 0;
  const lengths = [length];
  let p0 = coordinates[0];
  let p1, x, y, i = 0;
  const n = coordinates.length;

  while (++i < n) {
    p1 = coordinates[i];
    x = p1[0] - p0[0];
    y = p1[1] - p0[1];
    lengths.push((length += Math.sqrt(x * x + y * y)));
    p0 = p1;
  }

  const area = d3.polygonArea(coordinates);
  const radius = Math.sqrt(Math.abs(area) / Math.PI);
  const centroid = d3.polygonCentroid(coordinates);
  const angleOffset = -Math.PI / 2;
  const k = (2 * Math.PI) / lengths[lengths.length - 1];

  i = -1;
  while (++i < n) {
    const angle = angleOffset + lengths[i] * k;
    circle.push([
      centroid[0] + radius * Math.cos(angle),
      centroid[1] + radius * Math.sin(angle)
    ]);
  }

  return circle;
}


function handleMultiPolygon(geometryCollection) {
  const width = 960;
  const height = 500;

  // the rest of the code is good just make sure to change the projection to the one you want
  const projection = d3.geoAlbers()
  .rotate([120, 0])     // Washington is around 120°W longitude
  .center([0, 47])      // Washington is around 47°N latitude
  .scale(4000);         // Adjust scale for Washington's size

  const svg = d3.select("#vis2")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");
    

  const path = svg.append("path")
    .attr("fill", "#ccc")
    .attr("stroke", "#333");

  // Access the first geometry in the GeometryCollection
  if (geometryCollection.geometries && geometryCollection.geometries.length > 0) {
    const geometry = geometryCollection.geometries[0]; // Get the first geometry

    if (geometry.type === "MultiPolygon") {
      const coordinates0 = geometry.coordinates[0][0].map(projection);
      const coordinates1 = circle(coordinates0);
      const d0 = "M" + coordinates0.join("L") + "Z";
      const d1 = "M" + coordinates1.join("L") + "Z";

      loop();

      async function loop() {
        await path
          .attr("d", d0)
          .transition()
          .duration(5000)
          .attr("d", d1)
          .transition()
          .delay(5000)
          .attr("d", d0)
          .end();
        requestAnimationFrame(loop);
      }
    } else {
      console.error("Unsupported geometry type:", geometry.type);
    }
  } else {
    console.error("No geometries found in the GeometryCollection.");
  }
}

function init() {
  d3.json("./data/california.json").then(data => {
      console.log(data);
      createVis(data);
  })
  .catch(error => console.error('Error loading data:', error));

  d3.json("./data/maryland.json")
  .then(data => {
    console.log("Maryland Data:", data); // Log the data to inspect its structure
    handleMultiPolygon(data);
  })
  .catch(error => console.error('Error loading multipolygon.json:', error));

  d3.json("./data/washington.json")
  .then(data => {
    console.log("washington Data:", data); // Log the data to inspect its structure
    handleMultiPolygon(data);
  })
  .catch(error => console.error('Error loading multipolygon.json:', error));
}

window.addEventListener('load', init);

