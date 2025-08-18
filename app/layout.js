import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sessionwrapper from "@/components/Sessionwrapper";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Get Me A Chai",
  description: "Crowd funding platform for startups with chai",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Sessionwrapper>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Navbar />
            <div className="min-h-[87vh] relative w-full h-full bg-[var(--background)]">
              <main className="relative z-10">{children}</main>
            </div>
            <Footer />
            <Toaster
              position="top-right"
              reverseOrder={false}
              toastOptions={{
                style: {
                  background: "#333",
                  color: "#fff",
                  fontSize: "14px",
                },
                success: {
                  duration: 3000,
                  style: { background: "green", color: "white" },
                },
                error: {
                  duration: 5000,
                  style: { background: "red", color: "white" },
                },
              }}
            />
          </ThemeProvider>
        </Sessionwrapper>
      </body>
    </html>
  );
}
