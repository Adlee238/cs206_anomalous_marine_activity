const MAP_WIDTH = 760;
const MAP_HEIGHT = 420;
const MAP_PADDING = 22;

export function extractRings(geojson) {
  const rings = [];

  for (const feature of geojson.features || []) {
    const geometry = feature.geometry;
    if (!geometry) {
      continue;
    }

    if (geometry.type === "Polygon") {
      for (const ring of geometry.coordinates || []) {
        rings.push(ring);
      }
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates || []) {
        for (const ring of polygon || []) {
          rings.push(ring);
        }
      }
    }
  }

  return rings;
}

export function buildProjectedPaths(rings) {
  if (!rings.length) {
    return [];
  }

  const allPoints = rings.flat();
  const longitudes = allPoints.map((point) => point[0]);
  const latitudes = allPoints.map((point) => point[1]);
  const minLon = Math.min(...longitudes);
  const maxLon = Math.max(...longitudes);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);

  const spanLon = Math.max(maxLon - minLon, 1e-9);
  const spanLat = Math.max(maxLat - minLat, 1e-9);
  const scaleX = (MAP_WIDTH - MAP_PADDING * 2) / spanLon;
  const scaleY = (MAP_HEIGHT - MAP_PADDING * 2) / spanLat;
  const scale = Math.min(scaleX, scaleY);

  const contentWidth = spanLon * scale;
  const contentHeight = spanLat * scale;
  const offsetX = (MAP_WIDTH - contentWidth) / 2;
  const offsetY = (MAP_HEIGHT - contentHeight) / 2;

  return rings.map((ring) => {
    const points = ring.map(([lon, lat]) => {
      const x = (lon - minLon) * scale + offsetX;
      const y = MAP_HEIGHT - ((lat - minLat) * scale + offsetY);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return points.join(" ");
  });
}

export function buildGlobalProjectedPaths(
  rings,
  width = MAP_WIDTH,
  height = MAP_HEIGHT,
  padding = MAP_PADDING
) {
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  return rings.map((ring) => {
    const points = ring.map(([lon, lat]) => {
      const x = ((Number(lon) + 180) / 360) * usableWidth + padding;
      const y = ((90 - Number(lat)) / 180) * usableHeight + padding;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    });
    return points.join(" ");
  });
}
