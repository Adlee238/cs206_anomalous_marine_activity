"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAX_ROWS,
  getNorthCenter,
  getRiskSummary,
  getSortedRows,
  getVisibleHeaders
} from "../../../lib/mpa-viewer";
import VesselDetailsTab from "./vessel-details-tab";
import PolicyTab from "./policy-tab";
import SummaryTab from "./summary-tab";

const MAP_WIDTH = 760;
const MAP_HEIGHT = 420;

export default function MainMapExperience({ northPaths, records, deepDiveData }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [sortBy, setSortBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [panelWidth, setPanelWidth] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const svgRef = useRef(null);
  const panelRef = useRef(null);

  const northCenter = useMemo(() => getNorthCenter(northPaths), [northPaths]);

  useEffect(() => {
    function handleMouseMove(event) {
      if (!isResizing || !panelRef.current || !svgRef.current) {
        return;
      }

      const panelLeft = panelRef.current.getBoundingClientRect().left;
      const svgWidth = svgRef.current.getBoundingClientRect().width;
      const minWidth = 320;
      const maxWidth = Math.max(minWidth, svgWidth * 0.85);
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

  const visibleHeaders = useMemo(() => getVisibleHeaders(records), [records]);
  const riskSummary = useMemo(() => getRiskSummary(records), [records]);
  const rowsToShow = useMemo(
    () => getSortedRows(records, sortBy, order, MAX_ROWS),
    [records, sortBy, order]
  );

  function handleSort(header) {
    if (sortBy === header) {
      setOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(header);
    setOrder("asc");
  }

  const zoomScale = panelOpen ? 2 : 1;
  const mapTransform = panelOpen
    ? `translate(${northCenter.x} ${northCenter.y}) scale(${zoomScale}) translate(${-northCenter.x} ${-northCenter.y})`
    : "translate(0 0)";

  return (
    <main className="map-page">
      <header className="platform-header">
        <h1>Anomalous Marine Activity</h1>
      </header>

      <section className="map-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="mpa-map"
          role="img"
          aria-label="Charlie-Gibbs MPA map"
        >
          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} className="map-water" />

          <g transform={mapTransform}>
            {northPaths.map((points, index) => (
              <polygon
                key={`north-${index}`}
                points={points}
                className="map-region map-region-clickable"
                onClick={() => setPanelOpen(true)}
              />
            ))}
          </g>
        </svg>

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
            <h2>Charlie-Gibbs North MPA (June 1, 2024 to September 1, 2024)</h2>
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
              className={activeTab === "policy" ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab("policy")}
            >
              policy
            </button>
          </div>

          <div className="panel-body">
            {activeTab === "summary" ? <SummaryTab riskSummary={riskSummary} /> : null}

            {activeTab === "vessel-details" ? (
              <VesselDetailsTab
                visibleHeaders={visibleHeaders}
                rowsToShow={rowsToShow}
                sortBy={sortBy}
                order={order}
                onSort={handleSort}
                deepDiveData={deepDiveData}
              />
            ) : null}

            {activeTab === "policy" ? <PolicyTab /> : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
