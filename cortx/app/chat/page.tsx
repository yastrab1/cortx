"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import prompt from "@/lib/synapsis";

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "Hello! I'm Cortx, your AI assistant. How can I help you today?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage = {
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Send message to the specified endpoint
      const response = await prompt(input)


      const data = {content:response.response}

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content || "I'm having trouble processing that right now.",
        },
      ])
    } catch (error) {
      console.error("Error sending message:", error)
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#121212]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="h-5 w-5 text-slate-300" />
            <span className="text-sm text-slate-300">Back</span>
          </Link>
          <div className="flex items-center gap-2 mx-auto">
            <Sparkles className="h-5 w-5 text-slate-300" />
            <h1 className="text-xl font-medium text-white">Cortx</h1>
          </div>
          <div className="w-20"></div> {/* Spacer to center the title */}
        </div>
      </header>

      {/* Chat container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
      >
        <div className="max-w-3xl mx-auto space-y-4 py-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === "user" ? "bg-slate-700 text-white" : "bg-[#2a2a2a] text-gray-100"
                  }`}
                >
                  {message.content.split("\n").map((text, i) => (
                    <p key={i} className="mb-1 last:mb-0 text-sm">
                      {text}
                    </p>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="bg-[#2a2a2a] rounded-lg px-3 py-2 text-gray-100">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-800 bg-[#1a1a1a] p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#2a2a2a] focus-within:ring-1 focus-within:ring-slate-400 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder="Type your message here..."
                className="w-full bg-transparent px-4 py-3 text-white placeholder-gray-500 focus:outline-none"
                disabled={isLoading}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-md p-2 text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
