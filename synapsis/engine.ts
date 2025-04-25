import {ExecutionGraph, Plan, RawPlan, RawTask, Task} from "./types";
import {generatePlan} from "./plannerModel"
import {CoreMessage, experimental_createMCPClient, generateText, ToolSet} from "ai";

const mcpURLRegistry: string[] = ["localhost:3000/sse"]

class MCPRegistry {
    private static instance: MCPRegistry;
    public tools: ToolSet = {};

    private constructor() {
    }

    public static async createInstance(): Promise<MCPRegistry> {
        const instance = new MCPRegistry();

        for (const url of mcpURLRegistry) {
            const server = await experimental_createMCPClient({
                transport: {type: "sse", url},
            });

            const newTools = await server.tools();
            instance.tools = {
                ...instance.tools,
                ...newTools,
            };
        }

        return instance;
    }

    public static async getInstance(): Promise<MCPRegistry> {
        if (!MCPRegistry.instance) {
            return await MCPRegistry.createInstance();
        }
        return MCPRegistry.instance;
    }


    public getTools(): ToolSet {
        return this.tools
    }
}


async function executeTask(plan: RawPlan, context: string) {
    const task = plan.subtasks[0] as RawTask;
    const messages = [{role: "system", content: task.goal}, {role: "user", content: context}] as CoreMessage[]
    const result = await generateText({
        model: task.model,
        messages: messages,
        tools: (await MCPRegistry.getInstance()).getTools()
    })
    return result.text;
}

export function createLayeredExecutionGraph(plan: Plan) {
    const graph: ExecutionGraph = {layers: []};
    let currentLayer = 0;
    while (true) {
        if(graph.layers.length <= currentLayer){
            graph.layers.push({tasks:[]})
        }
        for (const task of plan.subtasks) {
            if (task.dependencies.length === 0) {
                graph.layers[currentLayer].tasks.push(task);
            }
        }
        for (const task of plan.subtasks) {
            for (const removedTask of graph.layers[currentLayer].tasks) {
                task.dependencies = task.dependencies.filter(task=>task!==removedTask)
            }
        }
        for (const task of plan.subtasks){
            plan.subtasks = plan.subtasks.filter(otherTask=>!graph.layers[currentLayer].tasks.includes(otherTask))
        }
        if (graph.layers[currentLayer].tasks.length === 0) {
            graph.layers.splice(currentLayer, 1);
            break;
        }
        currentLayer += 1;
    }
    return graph;
}

async function execute(plan: Plan) {
    createLayeredExecutionGraph(plan)
}