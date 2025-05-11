'use server'

import {Plan, Task} from "@/lib/synapsis/types";
import {randomUUID} from "node:crypto";

export default async function planToMermaid(plan:Plan){
    let mermaid = "graph LR\n"
    const mappings:{[key:string]:string} = {}
    plan.subtasks.forEach(subtask => {
        const id = randomUUID()
        mermaid+=`${id}[${subtask.name}]\n`
        mappings[subtask.name] = id
    })
    plan.subtasks.forEach(subtask => {
        subtask.upcomingTasks.forEach(task => {
            mermaid+=`${mappings[subtask.name]}-->${mappings[task.name]}\n`
        })
    })
    return mermaid;
}