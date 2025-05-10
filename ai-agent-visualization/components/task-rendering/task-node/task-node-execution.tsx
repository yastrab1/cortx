import { AnimatePresence, motion } from "framer-motion"

interface TaskNodeExecutionProps {
  executionSteps: string[];
  status: string;
}

export function TaskNodeExecution({ executionSteps, status }: TaskNodeExecutionProps) {
  if (status !== "executing" || executionSteps.length === 0) return null
  return (
    <div className="ml-6 mt-2">
      <div className="text-xs font-medium text-purple-400 mb-1">Execution:</div>
      <div className="space-y-1 bg-purple-900/10 p-2 rounded border border-purple-900/20">
        <AnimatePresence>
          {executionSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs"
            >
              <div className="text-purple-300">{step}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
} 