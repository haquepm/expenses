import type { Metadata, Viewport } from "next";import "./globals.css";import PwaRegister from "./pwa-register";
export const metadata:Metadata={title:"Crescent Expense Management",description:"Employee advance, expense and settlement portal",manifest:"/manifest.webmanifest",applicationName:"Crescent Expenses"};
export const viewport:Viewport={themeColor:"#10251f",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><PwaRegister/>{children}</body></html>}
