// Define projection configurations for different regions
const projectionConfigs = {
  california: {
    type: 'albers',
    rotate: [120, 0],
    center: [0, 37.7],
    scale: 2700
  },
  washington: {
    type: 'albers',
    rotate: [120, 0],
    center: [0, 47],
    scale: 4000
  },
  americanSamoa: {
    type: 'mercator',
    center: [-170.7, -14.3],
    scale: 40000
  },
  alabama: {
    type: 'albers',
    rotate: [87, 0],  // Alabama's approximate central longitude
    center: [0, 32.7], // Alabama's approximate central latitude
    scale: 4500
  },
  alaska: {
    type: 'mercator',
    center: [-150, 62],
    scale: 500
  },
  arizona: {
    type: 'albers',
    rotate: [112, 0],
    center: [0, 34.2],
    scale: 4000
  },
  arkansas: {
    type: 'albers',
    rotate: [92, 0],
    center: [0, 34.8],
    scale: 5000
  },
  colorado: {
    type: 'albers',
    rotate: [105.5, 0],
    center: [0, 39],
    scale: 4000
  },
  connecticut: {
    type: 'albers',
    rotate: [72.7, 0],
    center: [0, 41.6],
    scale: 14000
  },
  delaware: {
    type: 'albers',
    rotate: [75.5, 0],
    center: [0, 39],
    scale: 13000
  },
  florida: {
    type: 'albers',
    rotate: [83, 0],
    center: [0, 28],
    scale: 4000
  },
  georgia: {
    type: 'albers',
    rotate: [83.5, 0],
    center: [0, 32.9],
    scale: 5000
  },
  hawaii: {
    type: 'mercator',
    center: [-157.5, 20.0],
    scale: 6000
  },

};

function createMapVis(data, region, containerId) {
  const width = 960;
  const height = 500;

  // Check if SVG exists
  let svg = d3.select(`#${containerId}`).select("svg");
  
  // Only create new SVG if it doesn't exist
  if (svg.empty()) {
    svg = d3.select(`#${containerId}`)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");
  }

  // Create projection based on region configuration
  const config = projectionConfigs[region];
  let projection;
  
  if (config.type === 'albers') {
    projection = d3.geoAlbers()
      .rotate(config.rotate)
      .center(config.center)
      .scale(config.scale);
  } else if (config.type === 'mercator') {
    projection = d3.geoMercator()
      .center(config.center)
      .scale(config.scale);
  }
  
  projection.translate([width / 2, height / 2]);

  // Create path generator
  const pathGenerator = d3.geoPath().projection(projection);

  // Get or create path
  let path = svg.select("path");
  if (path.empty()) {
    path = svg.append("path")
      .attr("fill", "#ccc")
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .attr("d", ""); // Initialize with empty path
  }

  // Extract geometry from GeoJSON data
  const geometry = data.type === 'Feature' ? data.geometry : data;

  // Handle GeometryCollection
  let workingGeometry;
  if (geometry.type === 'GeometryCollection') {
    // Use the first geometry in the collection
    workingGeometry = geometry.geometries[0];
    console.log('Working with first geometry from collection:', workingGeometry);
    console.log('GeometryCollection contents:', geometry.geometries);
  } else {
    workingGeometry = geometry;
  }

  // Add validation for geometry
  if (!workingGeometry || !workingGeometry.coordinates) {
    console.log('Debug - received data:', data);
    console.log('Debug - extracted geometry:', workingGeometry);
    console.error('Invalid geometry data - missing coordinates');
    return;
  }

  // Get coordinates with validation
  let coordinates;
  try {
    // Check geometry type and handle accordingly
    switch (workingGeometry.type) {
      case 'MultiPolygon':
        coordinates = workingGeometry.coordinates[0][0];
        break;
      case 'Polygon':
        coordinates = workingGeometry.coordinates[0];
        break;
      default:
        console.error('Unsupported geometry type:', workingGeometry.type);
        return;
    }

    // Validate coordinates
    if (!coordinates || !coordinates.length) {
      console.error('Empty coordinates array');
      return;
    }

  } catch (error) {
    console.error('Error accessing coordinates:', error);
    console.log('Geometry structure:', workingGeometry);
    return;
  }

  // Generate path data with validation
  let d0;
  try {
    // Use the original geometry for path generation
    d0 = pathGenerator(geometry);
    if (!d0) {
      console.error('Path generator returned null');
      return;
    }
    console.log('Generated path data:', d0);
  } catch (error) {
    console.error('Error generating path:', error);
    return;
  }

  // Handle the transition
  const currentPath = path.attr("d");
  const newPath = d0;

  console.log('Transition debug:', {
    containerId,
    region,
    hasCurrentPath: !!currentPath,
    hasNewPath: !!newPath,
    currentPathStart: currentPath?.substring(0, 50),
    newPathStart: newPath?.substring(0, 50)
  });

  // For initial render (no previous path)
  if (!currentPath || currentPath === "") {
    console.log('Initial render - no transition needed');
    path.attr("d", newPath);
    return;
  }

  // For transitions between states using Flubber
  console.log('Starting Flubber transition');
  path.transition()
    .duration(2000)
    .attrTween("d", function() {
      try {
        // This is where we actually use Flubber
        const interpolator = flubber.interpolate(currentPath, newPath, {
          maxSegmentLength: 2,  // Lower number = smoother transition
          string: true
        });
        return interpolator;
      } catch (error) {
        console.error('Flubber interpolation error:', error);
        // Fallback to direct transition if Flubber fails
        return d3.interpolateString(currentPath, newPath);
      }
    });

  console.log('Transition setup complete');
}
 
function init() {
  // Debug logging for data loading
  d3.json("./data/california.json").then(data => {
      console.log('California data structure:', data);
      createMapVis(data, 'california', 'vis');
  }).catch(error => {
      console.error('Error loading California data:', error);
      console.log('Stack trace:', error.stack);
  });

  // Load and display Alabama in second vis initially
  d3.json("./data/alabama.json").then(data => {
      createMapVis(data, 'alabama', 'vis2');
  }).catch(error => console.error('Error loading Alabama data:', error));

  // Add event listener for radio buttons
  document.getElementById('stateSelector').addEventListener('change', (event) => {
    const selectedState = event.target.value;
    console.log('Radio button changed to:', selectedState); // Debug selected state

    // Disable radio buttons during transition to prevent multiple triggers
    const radioButtons = document.querySelectorAll('#stateSelector input[type="radio"]');
    radioButtons.forEach(button => button.disabled = true);

    d3.json(`./data/${selectedState}.json`)
        .then(data => {
            console.log('Successfully loaded data for:', selectedState, data); // Debug data loading
            createMapVis(data, selectedState, 'vis2');
        })
        .catch(error => {
            console.error(`Error loading ${selectedState} data:`, error);
        })
        .finally(() => {
            // Re-enable radio buttons after transition
            radioButtons.forEach(button => button.disabled = false);
        });
  });
}