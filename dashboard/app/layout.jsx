import "./globals.css";

export const metadata = {
  title: "Marine Activity Dashboard",
  description: "Explore vessel and MPA report CSV datasets."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
