import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Crescent Expense Management", description: "Employee advance, expense and settlement portal", manifest: "/manifest.webmanifest", applicationName: "Crescent Expenses" };
export const viewport: Viewport = { themeColor: "#10251f", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
