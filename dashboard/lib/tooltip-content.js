export const TOOLTIP_CONTENT = {
  mmsi:
    "A Maritime Mobile Service Identity (MMSI) is a unique 9-digit number assigned to each vessel for identifying it in digital, radio, and AIS communications.",
  darkActivity:
    "Dark activity refers to periods longer than 6 hours when we could not detect a vessel. This may happen because its AIS tracker was turned off, or because detection coverage/equipment was insufficient in that area.",
  detectionRisk:
    "Upon detection of a vessel, we determine the risk it poses to the region based on the severity of suspicious behavior it may be engaging in: Low, Medium, High, or Critical. For instance, if a ship is thought to be fishing for a long period in an area that prohibits fishing, the risk level is automatically high.",
  riskSignals: {
    critical:
      "A vessel with a critical risk score shows highly suspicious or repeated illegal activity and should be prioritized for immediate investigation.",
    high: "A vessel with a high risk score shows elevated risk behavior and should be reviewed promptly. We recommend beginning investigation.",
    medium:
      "A vessel with a medium risk score shows notable risk behavior that may indicate illegal activity, but with less certainty than high or critical levels. We recommend continued monitoring.",
    low: "A vessel with a low risk score shows comparatively low-risk behavior. Routine observation is recommended."
  },
  vesselTableHeaders: {
    vessel_name: "Registered vessel name.",
    flag: "Country where the vessel is registered.",
    total_violations:
      "The number of instances a vessel was detected with partaking in a suspicious activity.",
    violation_types:
      "Types of suspicious activities the vessel was detected with. Possible categories include:"
  },
  specificVessel: {
    visitsInRegion:
      "Is the ship frequently returning to the area? Investigate why it keeps returning, especially if fishing is heavily restricted.",
    vesselType:
      "Vessel type is determined using AIS data and vessel registry lists. This is the category of vessel based on industry.",
    vesselTypeCategories: {
      Carrier:
        "A large ship designed to transport goods or aircraft, such as oil tankers and aircraft carriers.",
      "Seismic Vessel":
        "A specialized research or survey ship used to map the seabed, typically for offshore oil and gas exploration.",
      Passenger: "Ships designed primarily to carry people, such as cruise ships.",
      Other:
        "A catch-all category for vessels that do not fit neatly into defined types, such as some research ships or dredgers.",
      Support:
        "Vessels that provide logistical and operational assistance to other ships or offshore installations.",
      Bunker:
        "Ships that supply bunker fuel to other vessels at sea or in port, like a floating fuel station.",
      Gear:
        "Vessels equipped with specialized equipment, often used in construction, salvage, or heavy-lift operations.",
      Cargo:
        "General-purpose ships that transport goods, including containers, dry cargo, refrigerated cargo, and freight.",
      Fishing:
        "Vessels used for commercial fishing, including trawlers, longliners, seiners, and factory ships.",
      Discrepancy:
        "The registry lists the vessel as non-fishing, but behavior models suggest it may be fishing."
    },
    gearType:
      "Gear Type indicates the method of fishing used by the ship to catch different species and/ or quantities of fish. Certain gear types are often prohibited in MPAs.",
    visitDurationHours:
      "If a ship spends more time than most other boats in an MPA investigate further. The more time a ship is spending in an MPA, the more likely it is fishing (a slow activity). Note that this parameter excludes AIS-off hours (dark activity).",
    averageSpeedKnots:
      "Ships moving at 2-6 knots indicate higher risk of illegal activity (fishing, idling and the transfer of illegal goods or ballast water exchange)."
  },
  violationTypeDescriptions: {
   //ILLEGAL_FISHING:
   //   "The vessel appears to be actively fishing inside a protected area where this activity is restricted.",
    SUSPECTED_TRANSSHIPMENT:
      "The vessel appears to be meeting another vessel at sea in a way that may indicate cargo or catch transfer.",
    SUSPICIOUS_LOITERING:
      "The vessel is lingering in one area for an unusual amount of time, which can suggest suspicious behavior.",
    HIGH_IMPACT_FISHING:
      "The vessel engages in substantial fishing activity, which can seriously impact the protected area.",
    MODERATE_IMPACT_FISHING:
      "The vessel engages in moderate fishing activity, resulting in notable pressure on the protected area.",
    LOW_IMPACT_FISHING:
      "The vessel engages in low-impact fishing activity, but is still in a protected area where fishing may be restricted."
  }
};
