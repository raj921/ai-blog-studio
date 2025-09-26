import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Blog Studio - Generate Complete Blog Posts",
  description: "Create AI-powered blog posts with text, images, and automatic Storyblok CMS publishing",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}