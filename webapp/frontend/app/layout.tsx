import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DataCo Morocco — Junior DS Internship",
  description:
    "An interactive showcase of an end-to-end ML project predicting Moroccan apartment prices. Built by AYAutomate.",
  openGraph: {
    title: "DataCo Morocco — Junior DS Internship",
    description: "Predict apartment prices across Morocco. An end-to-end ML project showcase.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
