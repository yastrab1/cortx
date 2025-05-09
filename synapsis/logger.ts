import {Plan} from "./types";

export function verbosePlan(plan:Plan){
    console.log("Plan Details:");
    for (const task of plan.subtasks) {
        console.log(`Task Name: ${task.name}`);
        console.log(`Goal: ${task.goal}`);
        console.log(`Dependencies: ${task.dependencies.map(dep => dep.name).join(", ") || "None"}`);
        console.log(`Agent Definition: ${task.agentDefinition}`);
        console.log(`Context: ${task.context}`);
        console.log(`Upcoming Tasks: ${task.upcomingTasks.map(ut => ut.name).join(", ") || "None"}`);
        console.log(`Model: ${task.model}`);
        console.log("--------------------------------------------------");
    }
}

