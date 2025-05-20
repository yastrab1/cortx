import TaskTree from "../task-rendering/task-tree/task-tree";
import ExecutionTimeline from "../execution-timeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentLog } from "./AgentLog";

interface AgentTabsProps {
  taskExecutions: any;
  activeTaskIds: string[];
  executionLog: string[];
}

export function AgentTabs({ taskExecutions, activeTaskIds, executionLog }: AgentTabsProps) {
  return (
    <Tabs defaultValue="tree" className="w-full">
      <TabsList className="grid grid-cols-3 mb-6 bg-gray-800/50">
        <TabsTrigger value="tree">Task Tree</TabsTrigger>
        <TabsTrigger value="timeline">Execution Timeline</TabsTrigger>
        <TabsTrigger value="logs">Execution Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="tree" className="mt-0">
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
          <TaskTree taskExecutions={taskExecutions} activeTaskIds={activeTaskIds} />
        </div>
      </TabsContent>

      <TabsContent value="timeline" className="mt-0">
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto">
          <ExecutionTimeline taskExecutions={taskExecutions} />
        </div>
      </TabsContent>

      <TabsContent value="logs" className="mt-0">
        <div className="bg-gray-900/30 rounded-lg border border-gray-800 p-4 h-[600px] overflow-auto font-mono text-sm">
          <AgentLog executionLog={executionLog} />
        </div>
      </TabsContent>
    </Tabs>
  );
} 