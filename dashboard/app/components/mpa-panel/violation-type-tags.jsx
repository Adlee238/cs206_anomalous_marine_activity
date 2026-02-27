import Tooltip from "../ui/tooltip";
import { getViolationTypeDescription, parseViolationTypes } from "../../../lib/violation-types";

export default function ViolationTypeTags({ value, emptyLabel = "None" }) {
  const types = parseViolationTypes(value);

  if (!types.length) {
    return <span>{emptyLabel}</span>;
  }

  return (
    <span className="violation-type-list">
      {types.map((type, index) => (
        <span key={type} className="violation-type-item">
          <span>{type}</span>
          <Tooltip
            ariaLabel={`What does ${type} mean?`}
            content={getViolationTypeDescription(type)}
            placement="top"
            variant="superscript"
          />
          {index < types.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}
