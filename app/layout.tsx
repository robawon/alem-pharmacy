import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Alem Pharmacy Management System",
  description: "Multi-role clinical, retail, and inventory operations platform for Alem Pharmacy.",
  icons: {
    icon: [{ url: "/1.jpeg", type: "image/jpeg" }],
    apple: "/1.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}