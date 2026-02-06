"use client";

import { useMemo, useState } from "react";

const PAGE_SIZE = 5;

export default function VesselTable({ vessels }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(vessels.length / PAGE_SIZE));

  const currentRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return vessels.slice(start, start + PAGE_SIZE);
  }, [page, vessels]);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="alert-table-wrap">
      <table className="alert-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Country</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((vessel) => (
            <tr key={`${vessel.name}-${vessel.country}`}>
              <td>{vessel.name}</td>
              <td>{vessel.country}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert-pagination">
        <button
          className="alert-page-button"
          type="button"
          disabled={!canPrev}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Prev
        </button>
        <span className="alert-page-label">
          Page {page} of {totalPages}
        </span>
        <button
          className="alert-page-button"
          type="button"
          disabled={!canNext}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
