"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/",
    label: "Map",
    caption: "Live vessel activity",
  },
  {
    href: "/alerts",
    label: "Alerts",
    caption: "Anomalies and incidents",
  },
];

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <nav className="nav">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-label">{item.label}</span>
            <span className="nav-caption">{item.caption}</span>
          </Link>
        );
      })}
    </nav>
  );
}
