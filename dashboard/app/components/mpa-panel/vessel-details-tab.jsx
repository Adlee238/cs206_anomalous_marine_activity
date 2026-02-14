"use client";

import { useState } from "react";
import SpecificVesselView from "./specific-vessel-view";
import VesselTableView from "./vessel-table-view";

export default function VesselDetailsTab({
  visibleHeaders,
  rowsToShow,
  sortBy,
  order,
  onSort,
  deepDiveData
}) {
  const [selectedVessel, setSelectedVessel] = useState(null);

  if (selectedVessel) {
    return (
      <SpecificVesselView
        vessel={selectedVessel}
        onBack={() => setSelectedVessel(null)}
        deepDiveData={deepDiveData}
      />
    );
  }

  return (
    <VesselTableView
      visibleHeaders={visibleHeaders}
      rowsToShow={rowsToShow}
      sortBy={sortBy}
      order={order}
      onSort={onSort}
      onSelectVessel={setSelectedVessel}
    />
  );
}
