import type { Metadata } from "next";
import "./globals.css";
import { Open_Sans } from 'next/font/google'

export const metadata: Metadata = {
  title: "Streaming Availability React Components Demo",
  description: "Streaming Availability React Components Demo",
};

const openSans = Open_Sans({
    subsets: ['latin'],
    display: 'swap',
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en">
      <body
          className={`${openSans.className} antialiased`}
      >
      {children}
      </body>
      </html>
  );
}
