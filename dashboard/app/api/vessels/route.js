import fs from "fs";
import path from "path";

/* ---------------- Constants ---------------- */

const GFW_4WINGS_API_URL =
  "https://gateway.api.globalfishingwatch.org/v3/4wings/report";

const VESSEL_CACHE_TTL_MS = 10 * 60 * 1000;  // Cache vessel results for 10 minutes
let cachedGeoJson = null;
let cachedVesselResult = null;
let cachedVesselTime = 0;
let inFlightVesselRequest = null;

/* ---------------- API Route ---------------- */

export async function GET(request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);

    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    console.log("[API] /vessels request", { startTime, endTime });

    if (!startTime || !endTime) {
      return Response.json(
        { error: "Missing startTime or endTime query parameters" },
        { status: 400 }
      );
    }
    if (!cachedGeoJson) {
      const geojsonPath = path.join(
        process.cwd(),
        "data",
        "mpa_geojsons",
        "test_mpa.json"
      ); // TODO: externalize this to query param when we have multiple MPAs
      cachedGeoJson = JSON.parse(fs.readFileSync(geojsonPath, "utf8"));
    }

    const api_token = process.env.GFW_API_TOKEN;
    if (!api_token) {
      throw new Error("Missing GFW_API_TOKEN");
    }

    // Fetch vessels present in MPA for specified time range from GFW 4Wings API
    const now = Date.now();
    if (cachedVesselResult && now - cachedVesselTime < VESSEL_CACHE_TTL_MS) {
      console.log("[API] /vessels cached response", {
        datasets: Object.keys(vesselsByDataset).length,
        totalVessels,
        sampleVessel,
        });
      return Response.json(cachedVesselResult);
    }

    if (!inFlightVesselRequest) {
      inFlightVesselRequest = fetchVessels(
        startTime,
        endTime,
        cachedGeoJson,
        api_token
      )
        .then((result) => {
          cachedVesselResult = result;
          cachedVesselTime = Date.now();
          return result;
        })
        .finally(() => {
          inFlightVesselRequest = null;
        });
    }

    const vesselsByDataset = await inFlightVesselRequest;

    const totalVessels = Object.values(vesselsByDataset)
      .reduce((sum, arr) => sum + arr.length, 0);
    const sampleVessel = Object.values(vesselsByDataset)
      .find((arr) => Array.isArray(arr) && arr.length > 0)?.[0] || null;

    console.log("[API] /vessels response", {
      datasets: Object.keys(vesselsByDataset).length,
      totalVessels,
      sampleVessel,
    });

    return Response.json(vesselsByDataset);

  } catch (err) {
    console.error("[API] /vessels error", { message: err.message });
    return Response.json(
      { error: err.message },
      { status: 500 }
    );
  }
}


/* ---------------- GFW Logic ---------------- */

/** 
 * Fetch vessels present in a time range and geographic region from GFW 4Wings API
 */
async function fetchVessels(startIso, endIso, regionGeoJson, token) {
  const params = new URLSearchParams({
    format: "JSON",
    "group-by": "VESSEL_ID",
    "temporal-resolution": "ENTIRE",
    "datasets[0]": "public-global-presence:latest",
    // "datasets[1]": "public-global-sar-presence:latest",  // Uncomment to include SAR presence data (Imagery and ML-based)
    "date-range": `${startIso},${endIso}`,
    "spatial-aggregation": "True",
    "spatial-resolution": "LOW"
  });

  const url = `${GFW_4WINGS_API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      geojson: regionGeoJson
    })
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("[API] GFW error", { status: response.status, text });
    throw new Error(`GFW error ${response.status}: ${text}`);
  }

  return cleanResponse(await response.json());
}

/** 
 * Process GFW 4Wings response into:
 * {
 *   "dataset": [{ vessel }, ...]
 * }
 */
function cleanResponse(data) {
  const result = {};

  for (const entry of data.entries ?? []) {
    for (const [datasetKey, records] of Object.entries(entry)) {
      if (!Array.isArray(records)) continue;

      if (!result[datasetKey]) {
        result[datasetKey] = new Map();
      }

      for (const record of records) {
        const vesselId = record.vesselId;
        if (!vesselId) continue;

        if (!result[datasetKey].has(vesselId)) {
          result[datasetKey].set(vesselId, record);
        }
      }
    }
  }

  const output = {};
  for (const [datasetKey, vesselMap] of Object.entries(result)) {
    output[datasetKey] = Array.from(vesselMap.values());
  }

  return output;
}
