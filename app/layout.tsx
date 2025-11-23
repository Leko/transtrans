import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { Theme } from "@radix-ui/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - TransTrans",
    default: "TransTrans",
  },
  description: "Live Transcription and Translation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Prompt API */}
        <meta
          httpEquiv="origin-trial"
          content="AgX7LTKOrYJKAUt2DWhmmCEjrynlWZJWB0uds6Pxksqx9s8XFRrXxb6Ujh28btJZxE3FSCKISMBDo1qdOZyxUQEAAABpeyJvcmlnaW4iOiJodHRwczovL3RyYW5zdHJhbnMudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiQUlQcm9tcHRBUElNdWx0aW1vZGFsSW5wdXQiLCJleHBpcnkiOjE3NzQzMTA0MDB9"
        />
        {/* Proofreader API */}
        <meta
          httpEquiv="origin-trial"
          content="ApaBF5PJ0ggeheHKjNrydkbKitjEhuB/73OJ46s5Z+5b2x9uAK1zV5xvzvVf+HmPJNpveIbj3YdVEx77fFEA/w8AAABfeyJvcmlnaW4iOiJodHRwczovL3RyYW5zdHJhbnMudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiQUlQcm9vZnJlYWRlckFQSSIsImV4cGlyeSI6MTc3OTE0ODgwMH0="
        />
        {/* Rewriter API */}
        <meta
          httpEquiv="origin-trial"
          content="Ai7UaMPC8AcYoYVatNh0dfX+GJ+4Igtop5AKmoBZ/3a5XG76vjSUN1papvAErcmWhwTpn4AgwTQyWsHq+y3cRwQAAABceyJvcmlnaW4iOiJodHRwczovL3RyYW5zdHJhbnMudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiQUlSZXdyaXRlckFQSSIsImV4cGlyeSI6MTc3NjcyOTYwMH0="
        />
        {/* Writer API */}
        <meta
          httpEquiv="origin-trial"
          content="AjPZ5imJOU5v3sIELpwqxuiYQRi0x/VOVIdaVBNu5ukzVbkUmAU0jiTTZ00QZYeOmZ7i432M3WXNC5YgHtG3jwYAAABaeyJvcmlnaW4iOiJodHRwczovL3RyYW5zdHJhbnMudmVyY2VsLmFwcDo0NDMiLCJmZWF0dXJlIjoiQUlXcml0ZXJBUEkiLCJleHBpcnkiOjE3NzY3Mjk2MDB9"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Theme>
          <div className="h-screen bg-black text-white font-sans flex flex-col">
            <header className="shrink-0 flex items-center justify-between p-4">
              <h1 className="text-2xl font-bold">TransTrans</h1>
              <nav>
                <a
                  href="https://github.com/Leko/transtrans"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </nav>
            </header>
            <main className="flex-1 min-h-0">{children}</main>
            <footer className="shrink-0">
              <p className="text-sm text-center flex items-center justify-center gap-2 p-4">
                &copy; 2025-
                <a
                  href="https://github.com/Leko"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Leko
                </a>
              </p>
            </footer>
          </div>
        </Theme>
      </body>
    </html>
  );
}
