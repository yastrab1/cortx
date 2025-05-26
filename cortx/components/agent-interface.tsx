"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initialPrompt } from "@/lib/dummy-data";
import TaskTree from "./task-rendering/task-tree/task-tree";
import ExecutionTimeline from "./execution-timeline";
import { ExecutionControls } from "./execution-controls";
import { ExecutionLogs } from "./execution-logs";
import { ExecutionState, TaskStatus, TaskData, TaskID } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { fetchStreamedData } from "@/app/hooks/fetchStreamedData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePostHog } from "posthog-js/react";

export default function AgentInterface() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPrompt, setUserPrompt] = useState(initialPrompt);
  const posthog = usePostHog();

  const execState: ExecutionState = {
    tasks: { } as Record<TaskID, TaskData>,
    taskCountByStatus: { pending: 0, planning: 0, executing: 0, waiting_for_children: 0, completed: 0, failed: 0 } as Record<TaskStatus, number>,
    errors: [],
    executionLog: [],
  };
  const [state, setState] = useState<ExecutionState>(execState);

  useEffect(() => {
    console.log("state", state);

    // Check if the root task is completed
    if (state.tasks["root"] && state.tasks["root"].status === "completed") {
      setIsProcessing(false);
    }
  }, [state]);

  const onStart = useCallback(() => {
    setIsProcessing(true);
    // Track prompt submission event
    posthog.capture("prompt_submitted", {
      prompt_length: userPrompt.length,
      prompt_content: userPrompt.substring(0, 100) // Only capture first 100 chars for privacy
    });
    fetchStreamedData(userPrompt, setState);
  }, [userPrompt, state, setState, posthog]);

  return (
    <Card className="border border-gray-800 bg-gray-900/50 backdrop-blur-sm shadow-lg overflow-hidden">
      <CardContent className="p-6">
        <div className="space-y-6">
          <ExecutionControls
            isProcessing={isProcessing}
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

          <div className="mt-6 flex gap-2">
            <Input
              placeholder="Enter your prompt here..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessing && userPrompt.trim()) {
                  e.preventDefault();
                  onStart();
                }
              }}
              className="flex-grow bg-gray-800 border-gray-700 text-white"
              disabled={isProcessing}
            />
            <Button 
              onClick={onStart} 
              disabled={isProcessing || !userPrompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? "Processing..." : "Execute"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
