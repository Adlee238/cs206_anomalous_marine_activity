"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  MAX_ROWS,
  getRiskSummary,
  getVisibleHeaders
} from "../../../lib/mpa-viewer";
import VesselDetailsTab from "./vessel-details-tab";
import ContextTab from "./context-tab";
import SummaryTab from "./summary-tab";

const WORLD_CENTER = [20, 0];
const WORLD_ZOOM = 2;
const FOCUS_ZOOM = 4;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const RISK_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};
const RISK_COLORS = {
  critical: { fill: "#cf3e36", stroke: "#8f251f", activeStroke: "#5f1511" },
  high: { fill: "#e2534a", stroke: "#a63029", activeStroke: "#6e1f1a" },
  medium: { fill: "#d5b436", stroke: "#8d7520", activeStroke: "#5d4d14" },
  low: { fill: "#4d9a6f", stroke: "#2f6347", activeStroke: "#1d3d2c" },
  unknown: { fill: "#168094", stroke: "#0f4f5d", activeStroke: "#083741" }
};

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false
});
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false
});
const GeoJSON = dynamic(() => import("react-leaflet").then((mod) => mod.GeoJSON), {
  ssr: false
});

function flattenCoordinates(coordinates, points = []) {
  if (!Array.isArray(coordinates)) {
    return points;
  }

  if (coordinates.length >= 2 && typeof coordinates[0] === "number") {
    points.push(coordinates);
    return points;
  }

  coordinates.forEach((value) => flattenCoordinates(value, points));
  return points;
}

function extractGeojsonPoints(geojson) {
  if (!geojson) {
    return [];
  }

  if (geojson.type === "FeatureCollection") {
    return geojson.features.flatMap((feature) => extractGeojsonPoints(feature));
  }

  if (geojson.type === "Feature") {
    if (!geojson.geometry) {
      return [];
    }
    return extractGeojsonPoints(geojson.geometry);
  }

  if (geojson.type === "GeometryCollection") {
    return geojson.geometries.flatMap((geometry) => extractGeojsonPoints(geometry));
  }

  return flattenCoordinates(geojson.coordinates, []);
}

function getGeojsonBounds(geojson) {
  const points = extractGeojsonPoints(geojson)
    .map((point) => [Number(point[1]), Number(point[0])])
    .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

  if (!points.length) {
    return null;
  }

  let minLat = points[0][0];
  let maxLat = points[0][0];
  let minLng = points[0][1];
  let maxLng = points[0][1];

  points.forEach(([lat, lng]) => {
    if (lat < minLat) {
      minLat = lat;
    }
    if (lat > maxLat) {
      maxLat = lat;
    }
    if (lng < minLng) {
      minLng = lng;
    }
    if (lng > maxLng) {
      maxLng = lng;
    }
  });

  return [
    [minLat, minLng],
    [maxLat, maxLng]
  ];
}

function normalizeRiskCategory(value) {
  const category = String(value || "").trim().toLowerCase();
  if (category in RISK_ORDER) {
    return category;
  }
  return "";
}

function getHighestRiskCategory(records) {
  let highest = "";
  let highestRank = 0;

  records.forEach((row) => {
    const category = normalizeRiskCategory(row?.risk_category);
    const rank = RISK_ORDER[category] || 0;
    if (rank > highestRank) {
      highest = category;
      highestRank = rank;
    }
  });

  return highest || "unknown";
}

function getLayerStyle(isActive, hasValidData, highestRiskCategory) {
  if (!hasValidData) {
    return {
      color: "#8d9ca2",
      weight: isActive ? 2.5 : 1.5,
      fillColor: "#b7c0c4",
      fillOpacity: 0.5,
      opacity: 0.9,
      interactive: true,
      className: "mpa-region-path"
    };
  }

  const palette = RISK_COLORS[highestRiskCategory] || RISK_COLORS.unknown;
  return {
    color: isActive ? palette.activeStroke : palette.stroke,
    weight: isActive ? 3 : 2,
    fillColor: palette.fill,
    fillOpacity: 0.72,
    interactive: true,
    className: "mpa-region-path"
  };
}

export default function MainMapExperience({ mpaRegions, defaultMpaId, deepDiveData }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedMpaId, setSelectedMpaId] = useState(defaultMpaId || "");
  const [panelWidth, setPanelWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const mapWrapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const panelRef = useRef(null);

  const selectedRegion = useMemo(() => {
    return (
      mpaRegions.find((region) => region.mpaId === selectedMpaId) ||
      mpaRegions.find((region) => region.hasValidData) ||
      mpaRegions[0] ||
      null
    );
  }, [mpaRegions, selectedMpaId]);
  const selectedRecords = selectedRegion?.records || [];
  const regionRiskById = useMemo(() => {
    const riskMap = new Map();
    mpaRegions.forEach((region) => {
      riskMap.set(region.mpaId, getHighestRiskCategory(region.records || []));
    });
    return riskMap;
  }, [mpaRegions]);

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizing || !panelRef.current || !mapWrapRef.current) {
        return;
      }

      const panelLeft = panelRef.current.getBoundingClientRect().left;
      const mapWidth = mapWrapRef.current.getBoundingClientRect().width;
      const minWidth = 320;
      const maxWidth = Math.max(minWidth, mapWidth * 0.85);
      const nextWidth = event.clientX - panelLeft;
      const clampedWidth = Math.max(minWidth, Math.min(nextWidth, maxWidth));
      setPanelWidth(clampedWidth);
    }

    function handleMouseUp() {
      setIsResizing(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map || !selectedRegion) {
      return;
    }

    if (!panelOpen) {
      map.setView(WORLD_CENTER, WORLD_ZOOM, { animate: true });
      return;
    }

    const bounds = getGeojsonBounds(selectedRegion.geojson);
    if (bounds) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: FOCUS_ZOOM, animate: true });
      return;
    }

    map.setView(WORLD_CENTER, FOCUS_ZOOM, { animate: true });
  }, [panelOpen, selectedRegion]);

  const visibleHeaders = useMemo(() => getVisibleHeaders(selectedRecords), [selectedRecords]);
  const riskSummary = useMemo(() => getRiskSummary(selectedRecords), [selectedRecords]);
  const rowsToShow = useMemo(() => selectedRecords.slice(0, MAX_ROWS), [selectedRecords]);

  return (
    <main className="map-page">
      <header className="platform-header">
        <h1>Anomalous Marine Activity</h1>
      </header>

      <section className="map-stage">
        <div ref={mapWrapRef} className="map-wrap">
          <MapContainer
            center={WORLD_CENTER}
            zoom={WORLD_ZOOM}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            zoomControl
            className="mpa-map leaflet-map"
            worldCopyJump
            ref={leafletMapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {mpaRegions.map((region) => (
              <GeoJSON
                key={region.mpaId}
                data={region.geojson}
                style={() =>
                  getLayerStyle(
                    region.mpaId === selectedRegion?.mpaId,
                    Boolean(region.hasValidData),
                    regionRiskById.get(region.mpaId)
                  )
                }
                onEachFeature={(_, layer) => {
                  layer.on({
                    click: () => {
                      setSelectedMpaId(region.mpaId);
                      setPanelOpen(true);
                    }
                  });
                }}
              />
            ))}
          </MapContainer>
        </div>

        <aside
          ref={panelRef}
          className={`info-panel ${panelOpen ? "open" : ""}`}
          style={panelWidth ? { "--panel-width": `${panelWidth}px` } : undefined}
        >
          <div
            className="panel-resize-handle"
            onMouseDown={() => setIsResizing(true)}
            role="separator"
            aria-label="Resize panel"
            aria-orientation="vertical"
          />
          <div className="panel-top">
            <h2>{selectedRegion?.displayName || "MPA Region"}, from Jan. 1, 2024 to Dec. 31, 2024</h2>
            <button
              type="button"
              className="panel-close"
              onClick={() => setPanelOpen(false)}
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          <div className="panel-tabs">
            <button
              type="button"
              className={activeTab === "summary" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("summary")}
            >
              summary
            </button>
            <button
              type="button"
              className={activeTab === "vessel-details" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("vessel-details")}
            >
              vessel details
            </button>
            <button
              type="button"
              className={activeTab === "context" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("context")}
            >
              context
            </button>
          </div>

          <div className="panel-body">
            {activeTab === "summary" ? (
              <SummaryTab
                riskSummary={riskSummary}
                records={selectedRecords}
                regionMetadata={selectedRegion?.regionMetadata}
              />
            ) : null}

            {activeTab === "vessel-details" ? (
              <VesselDetailsTab
                visibleHeaders={visibleHeaders}
                rowsToShow={rowsToShow}
                deepDiveData={deepDiveData}
              />
            ) : null}

            {activeTab === "context" ? (
              <ContextTab contextData={selectedRegion?.context} regionName={selectedRegion?.displayName} />
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
