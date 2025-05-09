import { CoreMessage, experimental_createMCPClient as createMCPClient, generateText, generateObject, Tool, tool, ToolSet } from 'ai';
import { Experimental_StdioMCPTransport as StdioMCPTransport } from 'ai/mcp-stdio';
import * as dotenv from 'dotenv';
import { createGoogleGenerativeAI, google } from '@ai-sdk/google';
import { z } from 'zod';
import {RawPlan} from "./types";
import express, {json} from "express";
import {generatePlan} from "./plannerModel";
import {execute} from "./engine";
import cors from "cors";
import {verbosePlan} from "./logger";
// Load environment variables
dotenv.config();


async function main() {
    const originalPrompt = "You are a master model in a ai agent network. Your task is to create graph of tasks. Each task has a dependency list, that cannot be executed before those task.If you require tools, mock them. First, make just a draft. Then refine, until its good enough and add details. ALWAYS use model gemini-2.0-flash this model exists and ALWAYS USE IT!!!!!. Each task is in a format:\n" +
        "NAME:\n" +
        "GOAL: (the high level goal of that task)\n" +
        "Agent definition: (The system prompt of the agent, eg \"You are a master in writing newsletters, keep them concise\")\n" +
        "Output schema(optional)\n" +
        "Context(from its dependencies, you do not plan this part)\n" +
        "Dependencies:(the agents dependencies)\n" +
        "Successors:(the agents successors)\n";

    const app = express()
    app.use(json())
    app.use(cors())
    app.post('/sendMessage', async (req, res) => {
        const {message} = req.body
        const plan = await generatePlan({
            name: "master",
            goal: message + originalPrompt,
            agentDefinition: "You are a master in planning",
            context: "",
            dependencies: [],
            upcomingTasks: [],
            model: "gemini-2.5-pro-exp-03-25"
        })
        verbosePlan(plan)
        console.log(await execute(plan))
        res.send({
            response: plan.subtasks.map(task => task.name).join("\n"),
        })
    })

    app.listen(8000, () => console.log('listening on port 8000'))

}

// Execute the main function
main().catch(console.error);