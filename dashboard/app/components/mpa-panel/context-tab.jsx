function toText(value) {
  const text = String(value || "").trim();
  return text.length > 0 ? text : null;
}

function toRichTextParts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((part) => {
      const mark = toText(part?.mark) || "";
      if (mark === "paragraph-break") {
        return { text: "", mark };
      }
      const rawText = part?.text;
      const text = rawText === null || rawText === undefined ? "" : String(rawText);
      if (text.trim().length === 0) {
        return null;
      }
      const href = toExternalHref(part?.href);
      return { text, mark, href };
    })
    .filter(Boolean);
}

function RichText({ parts }) {
  return parts.map((part, index) => {
    if (part.mark === "paragraph-break") {
      return (
        <span key={index}>
          <br />
          <br />
        </span>
      );
    }
    const content =
      part.href ? (
        <a href={part.href} target="_blank" rel="noreferrer">
          {part.text}
        </a>
      ) : (
        part.text
      );

    if (part.mark === "bold") {
      return <strong key={index}>{content}</strong>;
    }
    if (part.mark === "highlight") {
      return (
        <span key={index} className="context-highlight">
          {content}
        </span>
      );
    }
    if (part.mark === "bold-highlight") {
      return (
        <strong key={index} className="context-highlight">
          {content}
        </strong>
      );
    }
    return <span key={index}>{content}</span>;
  });
}

function toExternalHref(value) {
  const raw = toText(value);
  if (!raw) {
    return null;
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  return `https://${raw}`;
}

function formatHeaderLabel(value) {
  const text = toText(value);
  if (!text) {
    return null;
  }

  return text
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      if (word.length <= 3) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function toKeyFacts(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((fact) => {
      const rawValue = toText(fact?.value);
      const unit = toText(fact?.unit);
      const label = toText(fact?.label);
      if (!rawValue || !label) {
        return null;
      }
      return {
        value: unit ? `${rawValue} ${unit}` : rawValue,
        label
      };
    })
    .filter(Boolean);
}

function toRiskGroups(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((group, index) => {
      const header = formatHeaderLabel(group?.header) || `Category ${index + 1}`;
      const items = Array.isArray(group?.items)
        ? group.items.map((item) => toText(item)).filter(Boolean)
        : [];
      if (!items.length) {
        return null;
      }
      return { header, items };
    })
    .filter(Boolean);
}

function toGovernanceRows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const name = toText(entry?.name);
      const details = toText(entry?.details);
      if (!name || !details) {
        return null;
      }
      return { name, details };
    })
    .filter(Boolean);
}

function toContactRows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const name = toText(entry?.name);
      const title = toText(entry?.title);
      const email = toText(entry?.email);
      if (!name) {
        return null;
      }
      const details = [title, email].filter(Boolean).join(" | ");
      return { name, details: details || "Not available" };
    })
    .filter(Boolean);
}

function toResourceRows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const citation = toText(entry?.citation);
      const href = toExternalHref(entry?.url);
      const urlLabel = toText(entry?.url);
      if (!citation) {
        return null;
      }
      return { citation, href, urlLabel: urlLabel || "Not available" };
    })
    .filter(Boolean);
}

export default function ContextTab({ contextData }) {
  const openerParts = toRichTextParts(contextData?.opener);
  const keyFacts = toKeyFacts(contextData?.key_facts);
  const gistParts = toRichTextParts(contextData?.summary?.the_gist);
  const storyAngleParts = toRichTextParts(contextData?.summary?.story_angle);
  const locationDescriptionParts = toRichTextParts(contextData?.location?.description);
  const purposeDescriptionParts = toRichTextParts(contextData?.purpose?.description);
  const riskGroups = toRiskGroups(contextData?.risks);
  const restrictionsContextParts = toRichTextParts(contextData?.restrictions?.context);
  const restrictionBulletPoints = Array.isArray(contextData?.restrictions?.bullet_points)
    ? contextData.restrictions.bullet_points
        .map((item) => toRichTextParts(item))
        .filter((parts) => parts.length > 0)
    : [];
  const governanceRows = toGovernanceRows(contextData?.governance?.agencies);
  const treatyStatusUpdateParts = toRichTextParts(contextData?.high_seas_treaty_connection?.status_update);
  const treatyImplications = Array.isArray(contextData?.high_seas_treaty_connection?.implications)
    ? contextData.high_seas_treaty_connection.implications
        .map((item) => toRichTextParts(item))
        .filter((parts) => parts.length > 0)
    : [];
  const contactRows = toContactRows(contextData?.contacts);
  const resourceRows = toResourceRows(contextData?.resources);

  if (!openerParts.length) {
    return (
      <section className="context-empty">
        <p>Context for this region is not available yet.</p>
      </section>
    );
  }

  return (
    <section className="context-tab context-tab-enhanced">
      <section className="context-hero">
        <p className="context-opener">
          <RichText parts={openerParts} />
        </p>
        {gistParts.length > 0 ? (
          <p className="context-inline-summary">
            <strong>The Gist:</strong> <RichText parts={gistParts} />
          </p>
        ) : null}
        {storyAngleParts.length > 0 ? (
          <p className="context-inline-summary">
            <strong>Story Angle:</strong> <RichText parts={storyAngleParts} />
          </p>
        ) : null}
      </section>
      {keyFacts.length > 0 ? (
        <section className="context-key-facts context-block context-block-key-facts">
          <h3>Key Facts</h3>
          <div className="context-key-facts-grid">
            {keyFacts.map((fact, index) => (
              <article key={`key-fact-${index}`} className="summary-card context-key-fact-card">
                <p className="context-key-fact-value">{fact.value}</p>
                <p className="context-key-fact-label">{fact.label}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {locationDescriptionParts.length > 0 ? (
        <section className="context-quick-summary context-block context-block-location">
          <h3>Where Is It?</h3>
          <p>
            <RichText parts={locationDescriptionParts} />
          </p>
        </section>
      ) : null}
      {purposeDescriptionParts.length > 0 ? (
        <section className="context-quick-summary context-block context-block-purpose">
          <h3>Why Does It Exist?</h3>
          <p>
            <RichText parts={purposeDescriptionParts} />
          </p>
        </section>
      ) : null}
      {riskGroups.length > 0 ? (
        <section className="context-quick-summary context-block context-block-risk">
          <h3>What's at Risk?</h3>
          <div className="context-risk-grid">
            {riskGroups.map((group) => (
              <section key={group.header} className="context-risk-group">
                <h4>{group.header}</h4>
                <ul className="context-list">
                  {group.items.map((item, index) => (
                    <li key={`${group.header}-${index}`}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </section>
      ) : null}
      {restrictionsContextParts.length > 0 || restrictionBulletPoints.length > 0 ? (
        <section className="context-quick-summary context-block context-block-restrictions">
          <h3>What's Actually Restricted?</h3>
          {restrictionsContextParts.length > 0 ? (
            <p>
              <RichText parts={restrictionsContextParts} />
            </p>
          ) : null}
          {restrictionBulletPoints.length > 0 ? (
            <ul className="context-list">
              {restrictionBulletPoints.map((parts, index) => (
                <li key={`restriction-${index}`}>
                  <RichText parts={parts} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {governanceRows.length > 0 ? (
        <section className="context-quick-summary context-block context-block-governance">
          <h3>Who Governs It?</h3>
          <div className="context-governance-table-wrap">
            <table className="context-governance-table">
              <thead>
                <tr>
                  <th>Agency</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {governanceRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {treatyStatusUpdateParts.length > 0 || treatyImplications.length > 0 ? (
        <section className="context-quick-summary context-block context-block-treaty">
          <h3>How Does It Connect To The High Seas Treaty?</h3>
          {treatyStatusUpdateParts.length > 0 ? (
            <p>
              <RichText parts={treatyStatusUpdateParts} />
            </p>
          ) : null}
          {treatyImplications.length > 0 ? (
            <ul className="context-list">
              {treatyImplications.map((parts, index) => (
                <li key={`treaty-implication-${index}`}>
                  <RichText parts={parts} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
      {contactRows.length > 0 ? (
        <section className="context-quick-summary context-block context-block-contact">
          <h3>Points of Contact</h3>
          <div className="context-entry-list">
            {contactRows.map((row) => (
              <article key={row.name} className="context-entry-card">
                <h4>{row.name}</h4>
                <p>{row.details}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      {resourceRows.length > 0 ? (
        <section className="context-quick-summary context-block context-block-docs">
          <h3>Key Documents</h3>
          <div className="context-entry-list">
            {resourceRows.map((row) => (
              <article key={row.citation} className="context-entry-card">
                <h4>{row.citation}</h4>
                <p>
                  {row.href ? (
                    <a href={row.href} target="_blank" rel="noreferrer">
                      {row.urlLabel}
                    </a>
                  ) : (
                    row.urlLabel
                  )}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
