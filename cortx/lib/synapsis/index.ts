'use server'
import {
    CoreMessage,
    experimental_createMCPClient as createMCPClient,
    generateText,
    generateObject,
    Tool,
    tool,
    ToolSet
} from 'ai';
import * as dotenv from 'dotenv';
import {z} from 'zod';
import {RawPlan} from "./types";
import express, {json} from "express";
import {generatePlan} from "./plannerModel";
import {execute} from "./engine";
import cors from "cors";
import {verbosePlan} from "./logger";
import planToMermaid from "@/lib/planToMermaid";
// Load environment variables
dotenv.config();


export default async function prompt(prompt: string) {
    const plan = await generatePlan({
        name: "master",
        goal: prompt,
        agentDefinition: "You are a master in planning. " +
            "Do not overthink, try to use as few nodes as necessary, but do not execute any tasks yourself. " +
            "Make always at least one node extra.NEVER make agents like 'plan initial structure' jump straight to implementation. " +
            "Sub-agents cannot append to a file, only overwrite, so plan accordingly",
        context: "",
        dependencies: [],
        upcomingTasks: [],
        model: "o4-mini"
    })
    verbosePlan(plan)

    console.log(await execute(plan))
    return {response: await planToMermaid(plan)}
}

1