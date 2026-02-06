import "./globals.css";
import { Fraunces, Space_Grotesk } from "next/font/google";
import Sidebar from "./components/Sidebar";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Anomalous Marine Activity",
  description: "Dashboard for tracking marine activity, alerts, and zones.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${spaceGrotesk.variable}`}>
        <div className="app-shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark" />
              <div>
                <p className="brand-title">Our Platform Name</p>
                <p className="brand-subtitle">Anomalous activity monitor</p>
              </div>
            </div>
            <Sidebar />
            <div className="sidebar-footer">
              <p className="sidebar-meta">Last sync</p>
              <p className="sidebar-meta">5 min ago</p>
            </div>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
