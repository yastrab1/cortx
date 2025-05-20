"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Sparkles, MessageSquare, Zap, Shield, ArrowRight, Send, Loader2 } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const demoRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(true)
  const [charIndex, setCharIndex] = useState(0)

  const heroTexts = ["Build powerful AI experiences", "Create intelligent conversations", "Design the future of chat"]

  const features = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Natural Conversations",
      description: "Engage users with fluid, human-like conversations powered by advanced language models.",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Optimized for speed with responses generated in milliseconds, not seconds.",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure by Design",
      description: "Enterprise-grade security with end-to-end encryption and data privacy controls.",
    },
  ]

  // Improved typewriter effect
  useEffect(() => {
    const textToType = heroTexts[currentTextIndex]

    if (isTyping) {
      // Typing phase
      if (charIndex < textToType.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(textToType.substring(0, charIndex + 1))
          setCharIndex(charIndex + 1)
        }, 100)
        return () => clearTimeout(timeout)
      } else {
        // Finished typing, wait before erasing
        const timeout = setTimeout(() => {
          setIsTyping(false)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      // Erasing phase
      if (charIndex > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(textToType.substring(0, charIndex - 1))
          setCharIndex(charIndex - 1)
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        // Finished erasing, move to next text
        const timeout = setTimeout(() => {
          setCurrentTextIndex((prevIndex) => (prevIndex + 1) % heroTexts.length)
          setIsTyping(true)
        }, 500)
        return () => clearTimeout(timeout)
      }
    }
  }, [isTyping, charIndex, currentTextIndex, heroTexts])

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    setMessages([...messages, { role: "user", content: input }])
    setInput("")
    setIsLoading(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm Cortx, your AI assistant. I can help you build powerful applications, answer questions, or just chat about ideas. What would you like to explore today?",
        },
      ])
      setIsLoading(false)
    }, 1500)
  }

  const scrollToDemo = () => {
    demoRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <main className="min-h-screen bg-[#121212] text-white">
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/20 to-[#121212] z-0"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -inset-[10px] opacity-50">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-slate-700/20 rounded-full filter blur-3xl"></div>
            <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-slate-600/20 rounded-full filter blur-3xl"></div>
          </div>
        </div>

        <motion.div
          className="container mx-auto text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-slate-300 mr-2" />
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-white">
              Cortx
            </h1>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 min-h-[60px] md:min-h-[72px]">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-white">
              {displayedText}
            </span>
            <span className="inline-block w-[3px] h-[30px] md:h-[40px] bg-slate-300 animate-blink ml-1"></span>
          </h2>

          <p className="text-slate-300 text-xl max-w-2xl mx-auto mb-10">
            Cortx is a next-generation AI chat interface that helps you create meaningful conversations with your users.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/chat"
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium flex items-center justify-center transition-all"
            >
              Open Chat <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <button
              onClick={scrollToDemo}
              className="px-6 py-3 bg-transparent border border-slate-600 hover:border-slate-500 rounded-lg font-medium transition-all"
            >
              Learn More
            </button>
          </div>
        </motion.div>

        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowRight className="h-6 w-6 transform rotate-90" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-[#151515]">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Cortx?</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Built with the latest AI technology to deliver exceptional conversational experiences.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="bg-[#1a1a1a] p-6 rounded-xl border border-gray-800"
                variants={itemVariants}
              >
                <div className="bg-slate-800 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section ref={demoRef} className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience Cortx</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Try out the Cortx chat interface and see how it can transform your user interactions.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="bg-[#1a1a1a] border-b border-gray-800 px-4 py-3 flex items-center">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-slate-300" />
                <h3 className="text-lg font-medium">Cortx Demo</h3>
              </div>
              <div className="ml-auto">
                <Link
                  href="/chat"
                  className="text-sm text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
                >
                  Open Full Chat <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <div className="h-80 overflow-y-auto p-4 bg-[#121212]">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="flex justify-center my-12">
                    <h2 className="text-xl font-medium text-white">How can I help you today?</h2>
                  </div>
                )}

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
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
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
              </div>
            </div>

            <div className="border-t border-gray-800 bg-[#1a1a1a] p-4">
              <form onSubmit={handleDemoSubmit} className="relative">
                <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#2a2a2a] focus-within:ring-1 focus-within:ring-slate-400 transition-all">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Send a message..."
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
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[#151515]">
        <motion.div
          className="container mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-slate-300 max-w-2xl mx-auto mb-8">
            Join thousands of developers building the next generation of AI-powered applications with Cortx.
          </p>
          <Link
            href="/chat"
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-lg transition-all inline-block"
          >
            Get Started Now
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-[#121212] py-8 px-4 border-t border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Sparkles className="h-5 w-5 text-slate-300 mr-2" />
            <span className="text-lg font-medium">Cortx</span>
          </div>
          <div className="text-slate-400 text-sm">© {new Date().getFullYear()} Cortx AI. All rights reserved.</div>
        </div>
      </footer>
    </main>
  )
}
