import {ExecutionGraph, ExecutionLayer, Plan, RawPlan, RawTask, Task} from "./types";
import {generatePlan} from "./plannerModel"
import {
    CoreMessage,
    experimental_createMCPClient,
    generateText,
    LanguageModel,
    Tool,
    ToolResultUnion,
    ToolSet
} from "ai";
import {openai} from "@ai-sdk/openai";
import {anthropic} from "@ai-sdk/anthropic";
import {google} from "@ai-sdk/google";
import {perplexity} from "@ai-sdk/perplexity";
import dotenv from "dotenv";

dotenv.config();

const systemPrompt = " TRY YOUR ABSOLUTE HARDEST," +
    " IF YOU DONT KNOW JUST THINK OF SOMETHING CLOSE ENOUGH. NEVER ASK OR HANG." +
    "Write into files using echo [your file] > file.Write always the whole file, not by lines!!!. The OS is alpine with python"

const mcpURLRegistry: string[] = [" http://localhost:3001/sse"]

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

export function resolveModel(model: string): LanguageModel {
    const providerPrefixes = {
        "openai": ["gpt","o"],
        "google": ["gemini"],
        "anthropic": ["claude"],
    };
    let i = 0;
    let provider = "";
    const modelsList = Object.values(providerPrefixes) as string[][];
    for (const modelList of modelsList) {
        for (const prefix of modelList) {
            if (model.startsWith(prefix)) {
                provider = Object.keys(providerPrefixes)[i]
            }
        }
        i += 1;
    }
    let providerObject = undefined;
    if (provider == "anthropic") {
        providerObject = anthropic
    } else if (provider == "openai") {
        providerObject = openai
    } else if (provider == "google") {
        providerObject = google
    } else if (provider == "perplexity") {
        providerObject = perplexity
    } else {
        throw new Error("Invalid Model!")
    }
    return providerObject(model);
}


async function executeTask(task: Task, context: CoreMessage[]) {

    const messages = [{role: "user", content: task.goal + systemPrompt}, ...context] as CoreMessage[]

    console.log(messages)
    const registry = await MCPRegistry.getInstance();
    console.log("running task with model", task.model)
    const response = await generateText({
        model: resolveModel(task.model),
        messages: messages,
        tools: registry.getTools()
    })

    const toolResult: any[] = response.toolResults;
    const toolCall = response.toolCalls;


    if (toolResult && toolCall) {
        const continuationMessages = [
            ...messages,

        ];
        for (const tool of toolResult) {
            continuationMessages.push({
                role: "user",
                content: JSON.stringify(tool)
            })
        }
        // await executeTask(task, continuationMessages)
    }

    return response.text;
}

export function findFreeNodes(plan: Plan) {
    const layer: ExecutionLayer = {tasks: []}


    for (const task of plan.subtasks) {
        if (task.dependencies.length === 0) {
            layer.tasks.push(task);
        }
    }
    for (const task of plan.subtasks) {
        for (const removedTask of layer.tasks) {
            task.dependencies = task.dependencies.filter(task => task !== removedTask)
        }
    }
    for (const task of plan.subtasks) {
        plan.subtasks = plan.subtasks.filter(otherTask => !layer.tasks.includes(otherTask))
    }

    return layer;
}

export async function execute(plan: Plan) {
    const planCopy = structuredClone(plan);
    let nodes = findFreeNodes(planCopy)
    const outputs: { [taskName: string]: CoreMessage } = {};
    while (nodes.tasks.length > 0) {
        for (const task of nodes.tasks) {
            const context = []
            for (const dependency of task.dependencies) {
                context.push(outputs[dependency.name])
            }
            const result = await executeTask(task, context)
            outputs[task.name] = {role: "user", content: result}
        }
        nodes = findFreeNodes(planCopy)
    }
    return outputs;
}