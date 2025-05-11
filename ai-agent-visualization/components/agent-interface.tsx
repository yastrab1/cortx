"use client";

import { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskExecution } from "@/hooks/useTaskExecution";
import { useTaskDependencies } from "@/hooks/useTaskDependencies";
import { useSpecialTaskHandler } from "@/hooks/useSpecialTaskHandler";
import { TaskSimulationService } from "@/services/taskSimulationService";
import { dummyTasks, initialPrompt } from "@/lib/dummy-data";
import TaskTree from "./task-rendering/task-tree/task-tree";
import ExecutionTimeline from "./execution-timeline";
import { ExecutionControls } from "./execution-controls";
import { ExecutionLogs } from "./execution-logs";
import { ExecutionState, TaskStatus, TaskData, TaskID } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { fetchStreamedData } from "@/app/hooks/fetchStreamedData";

export default function AgentInterface() {
  const [isProcessing, setIsProcessing] = useState(false);
  /*const [prompt, setPrompt] = useState(initialPrompt)
  
  const {
    state,
    setState,
    addLogEntry,
    handleError,
    updateProgress,
    getParentTaskId,
    checkAndCompleteParentTask,
    checkDependentTasks,
    planningIterationsRef
  } = useTaskExecution()

  // Initialize task simulation service
  const taskSimulation = new TaskSimulationService(
    addLogEntry,
    handleError,
    setState,
    getParentTaskId,
    checkAndCompleteParentTask,
    checkDependentTasks,
    updateProgress,
    planningIterationsRef
  )

  // Use hooks for dependency management and special task handling
  useTaskDependencies(isProcessing, dummyTasks, setState, addLogEntry)
  useSpecialTaskHandler(isProcessing, state, taskSimulation.simulateTaskPlanning.bind(taskSimulation), addLogEntry)

  const startProcess = () => {
    try {
      setIsProcessing(true)
      setState({
        taskExecutions: {},
        activeTaskIds: [],
        progress: 0,
        executionLog: [],
        error: null,
        taskDependencyMap: {}
      })
      planningIterationsRef.current = {} // Reset planning iterations counter

      // Start with the main planning task
      addLogEntry("Starting execution of prompt: " + prompt)
      taskSimulation.simulateMainPlanning(prompt)
    } catch (err) {
      handleError("Error starting process", err)
    }
  }*/

  const execState: ExecutionState = {
    tasks: { } as Record<TaskID, TaskData>,
    taskCountByStatus: { pending: 0, planning: 0, executing: 0, waiting_for_children: 0, completed: 0, failed: 0 } as Record<TaskStatus, number>,
    errors: [],
    executionLog: [],
  };
  const [state, setState] = useState<ExecutionState>(execState);

  const onStart = useCallback(() => {
    fetchStreamedData(initialPrompt, state, setState);
  }, [state, setState]);

  return (
    <Card className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          <ExecutionControls
            isProcessing={/*isProcessing*/ false}
            onStart={onStart}
            state={state}
          />

          <Tabs defaultValue="tree" className="w-full">
            <TabsList className="grid grid-cols-3 mb-6 bg-gray-800/50">
              <TabsTrigger value="tree">Task Tree</TabsTrigger>
              <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
              <TabsTrigger value="logs">Execution Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="tree" className="mt-0">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
                <TaskTree state={state} setState={setState} />
              </div>
            </TabsContent>

            <TabsContent value="timeline" className="mt-0">
              <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
                <ExecutionTimeline
                  taskExecutions={/*state.taskExecutions*/ {}}
                />
              </div>
            </TabsContent>

            <TabsContent value="logs" className="mt-0">
              <ExecutionLogs logs={state.executionLog} />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
