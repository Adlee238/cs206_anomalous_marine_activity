"use client";

import { useEffect, useRef, useState } from "react";

export default function Tooltip({
  content,
  ariaLabel = "More information",
  variant = "default",
  placement = "bottom",
  className = "",
  triggerClassName = "",
  bubbleClassName = "",
  children
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [resolvedPlacement, setResolvedPlacement] = useState(placement);
  const [align, setAlign] = useState("center");
  const rootRef = useRef(null);
  const bubbleRef = useRef(null);
  const rootClassName =
    `tooltip-root tooltip-${variant} tooltip-place-${resolvedPlacement} tooltip-align-${align} ${
      isOpen ? "tooltip-open" : ""
    } ${className}`.trim();
  const resolvedTrigger = children || <span className="tooltip-trigger-icon">?</span>;

  useEffect(() => {
    if (!isOpen || !bubbleRef.current) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!bubbleRef.current) {
        return;
      }

      const rect = bubbleRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const edgePadding = 10;

      let nextAlign = "center";
      if (rect.left < edgePadding) {
        nextAlign = "start";
      } else if (rect.right > viewportWidth - edgePadding) {
        nextAlign = "end";
      }

      let nextPlacement = placement;
      if (placement === "top" && rect.top < edgePadding) {
        nextPlacement = "bottom";
      } else if (placement === "bottom" && rect.bottom > viewportHeight - edgePadding) {
        nextPlacement = "top";
      }

      setAlign(nextAlign);
      setResolvedPlacement(nextPlacement);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, placement, content]);

  useEffect(() => {
    const hostHeader = rootRef.current?.closest?.("th");
    if (!hostHeader) {
      return;
    }

    if (isOpen) {
      hostHeader.classList.add("tooltip-host-open");
    } else {
      hostHeader.classList.remove("tooltip-host-open");
    }

    return () => {
      hostHeader.classList.remove("tooltip-host-open");
    };
  }, [isOpen]);

  return (
    <span ref={rootRef} className={rootClassName}>
      <span
        className={`tooltip-trigger ${triggerClassName}`.trim()}
        tabIndex={0}
        aria-label={ariaLabel}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((current) => !current);
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {resolvedTrigger}
      </span>
      <span ref={bubbleRef} className={`tooltip-bubble ${bubbleClassName}`.trim()} role="tooltip">
        {content}
      </span>
    </span>
  );
}
