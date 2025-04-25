import {LanguageModel} from "ai";

export type RawTask = {
    name: string;
    goal: string;
    dependencies: string[];
    agentDefinition: string;
    context: string;
    upcomingTasks: string[];
    model: LanguageModel;
}

export type Task = {
    name: string;
    goal: string;
    dependencies: Task[];
    agentDefinition: string;
    context: string;
    upcomingTasks: Task[];
    model: LanguageModel;
}

export type RawPlan = {
    subtasks: RawTask[];
}


export type Plan = {
    subtasks: Task[];
}

export type ExecutionLayer = {
    tasks: Task[];
}
export type ExecutionGraph = {
    layers: ExecutionLayer[];
}