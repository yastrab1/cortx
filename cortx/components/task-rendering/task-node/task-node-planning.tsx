import { AnimatePresence, motion } from "framer-motion"

interface TaskNodePlanningProps {
  planningSteps: string[]
  status: string
}

export function TaskNodePlanning({ planningSteps, status }: TaskNodePlanningProps) {
  if (status === "pending" || planningSteps.length === 0) return null
  return (
    <div className="ml-6 mt-2">
      <div className="text-xs font-medium text-blue-400 mb-1">Planning:</div>
      <div className="space-y-1 bg-blue-900/10 p-2 rounded border border-blue-900/20">
        <AnimatePresence>
          {planningSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs text-gray-400"
            >
              {step}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
} 