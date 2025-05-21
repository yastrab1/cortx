import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { PostHogProvider } from "../components/PostHogProvider"
import { AuthProvider } from "../contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Cortx - Advanced AI Assistant",
  description: "A modern, bleeding-edge AI chat interface",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </AuthProvider>
      </body>
    </html>
  )
}