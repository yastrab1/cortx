import {RawPlan} from "./types";
import {google} from "@ai-sdk/google";
import {postprocessResponse, taskToString} from "./plannerModel";
import {createLayeredExecutionGraph} from "./engine";

const mockRawPlan: RawPlan = {
    subtasks: [
        {
            name: "Setup Environment",
            goal: "Prepare the development environment with necessary tools.",
            dependencies: [],
            agentDefinition: "EnvironmentAgent",
            context: "Ensure Node.js, TypeScript, and project dependencies are installed.",
            upcomingTasks: ["Initialize Project"],
            model: google("gemini-2.0-flash"),
        },
        {
            name: "Initialize Project",
            goal: "Create the initial project structure.",
            dependencies: ["Setup Environment"],
            agentDefinition: "ProjectInitializerAgent",
            context: "Create folders, setup base files, configure tsconfig.json.",
            upcomingTasks: ["Implement Core Features"],
            model: google("gemini-2.0-flash"),
        },
        {
            name: "Implement Core Features",
            goal: "Develop the main functionality of the application.",
            dependencies: ["Initialize Project"],
            agentDefinition: "FeatureDevelopmentAgent",
            context: "Follow the provided feature list and build core modules.",
            upcomingTasks: ["Write Tests"],
            model: google("gemini-2.0-flash"),
        },
        {
            name: "Write Tests",
            goal: "Write unit and integration tests for core features.",
            dependencies: ["Implement Core Features"],
            agentDefinition: "TestingAgent",
            context: "Use Jest and Testing Library for testing.",
            upcomingTasks: ["Deploy Application"],
            model: google("gemini-2.0-flash"),
        },
        {
            name: "Deploy Application",
            goal: "Deploy the application to production.",
            dependencies: ["Write Tests"],
            agentDefinition: "DeploymentAgent",
            context: "Use Vercel or AWS for deployment.",
            upcomingTasks: [],
            model: google("gemini-2.0-flash"),
        },
    ]
};

const postprocessedPlan = postprocessResponse(mockRawPlan);
console.log("Postprocessed Plan:", postprocessedPlan);

for (const task of postprocessedPlan.subtasks) {
    console.log(`Task: ${taskToString(task)}`);
    for (const dep of task.dependencies) {
        console.log(`  Dependency: ${taskToString(dep)}`);
    }
    for (const up of task.upcomingTasks) {
        console.log(`  Upcoming Task: ${taskToString(up)}`);
    }
}

const graph = createLayeredExecutionGraph(postprocessedPlan);
console.log(graph);