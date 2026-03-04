import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus ERP Pro",
  description: "نظام الإدارة الذكي للشركات",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet"/>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet"/>
      </head>
      <body style={{fontFamily:'Tajawal,sans-serif',margin:0,padding:0}}>
        {children}
      </body>
    </html>
  );
}
