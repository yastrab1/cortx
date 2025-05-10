"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { Task } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2 } from "lucide-react"

interface PlanningPhaseProps {
  isPlanning: boolean
  plan: Task[] | null
}

export default function PlanningPhase({ isPlanning, plan }: PlanningPhaseProps) {
  const [planningSteps, setPlanningSteps] = useState<string[]>([])

  useEffect(() => {
    if (isPlanning) {
      const steps = [
        "Analyzing request...",
        "Identifying required tasks...",
        "Determining dependencies...",
        "Optimizing execution order...",
        "Finalizing plan...",
      ]

      let currentStep = 0
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setPlanningSteps((prev) => [...prev, steps[currentStep]])
          currentStep++
        } else {
          clearInterval(interval)
        }
      }, 600)

      return () => {
        clearInterval(interval)
        setPlanningSteps([])
      }
    }
  }, [isPlanning])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span className="mr-2">Planning Phase</span>
          {isPlanning && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          {plan && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {planningSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center text-sm text-gray-600 dark:text-gray-300"
              >
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                {step}
              </motion.div>
            ))}
          </AnimatePresence>

          {plan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-4 border-t pt-4 dark:border-gray-700"
            >
              <h3 className="font-medium mb-2 text-gray-800 dark:text-white">Generated Plan:</h3>
              <div className="space-y-2">
                {plan.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                  >
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{task.goal}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
