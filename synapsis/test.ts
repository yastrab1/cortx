import {RawPlan, Task} from "./types";
import {google} from "@ai-sdk/google";
import {generatePlan, postprocessResponse} from "./plannerModel";
import {execute, findFreeNodes} from "./engine";

const simplePokemonApiRawPlan: RawPlan = {
    subtasks: [
        {
            name: "Initialize Project",
            goal: "Set up a basic Python project with necessary folders and files.",
            dependencies: [],
            agentDefinition: "A Python developer who sets up projects cleanly and efficiently.",
            context: "Create a new project folder, initialize a virtual environment, and create initial files (main.py, requirements.txt).",
            upcomingTasks: ["Install Required Packages", "Create Pokémon List"],
            model: "gemini-2.0-flash"
        },
        {
            name: "Install Required Packages",
            goal: "Install FastAPI and Uvicorn to enable creating a REST API.",
            dependencies: ["Initialize Project"],
            agentDefinition: "A Python developer with experience in web APIs.",
            context: "Use pip to install FastAPI and Uvicorn, and record them in requirements.txt.",
            upcomingTasks: ["Create API Endpoint"],
            model: "gemini-2.0-flash"
        },
        {
            name: "Create Pokémon List",
            goal: "Create a simple list of Pokémon names to serve from the API.",
            dependencies: ["Initialize Project"],
            agentDefinition: "A Python developer who can create simple Python structures.",
            context: "Inside main.py or a separate file, define a list containing 10 random Pokémon names as strings.",
            upcomingTasks: ["Create API Endpoint"],
            model: "gemini-2.0-flash"
        },
        {
            name: "Create API Endpoint",
            goal: "Create a FastAPI endpoint that returns a random Pokémon from the list.",
            dependencies: ["Install Required Packages", "Create Pokémon List"],
            agentDefinition: "A FastAPI expert who can quickly build and test endpoints.",
            context: "Create a GET endpoint at `/pokemon` that returns a random name from the Pokémon list.",
            upcomingTasks: ["Test the API"],
            model: "gemini-2.0-flash"
        },
        {
            name: "Test the API",
            goal: "Test the endpoint locally to ensure it returns a random Pokémon.",
            dependencies: ["Create API Endpoint"],
            agentDefinition: "A developer familiar with local testing using Uvicorn and HTTP clients like curl or Postman.",
            context: "Run the API locally with Uvicorn and perform a few test calls to `/pokemon` to check randomness and correctness.",
            upcomingTasks: ["Prepare Deployment Instructions"],
            model: "gemini-2.0-flash"
        },
        {
            name: "Prepare Deployment Instructions",
            goal: "Write clear instructions on how to run the API locally.",
            dependencies: ["Test the API"],
            agentDefinition: "A technical writer who can create clean and easy-to-follow README guides.",
            context: "Create a simple README or write instructions to install dependencies, run the app with Uvicorn, and test the endpoint.",
            upcomingTasks: [],
            model: "gemini-2.0-flash"
        }
    ]
};

async function test() {
    const postprocessedPlan = await generatePlan({
        name:"Python pokemon api",
        goal:"Create a basic python REST api that returns a random pokemon. !!!!As a model parameter in the task, always use gemini-2.0-flash !!!!. When running terminal tools, always use single quotes with echo",
        dependencies:[],
        upcomingTasks:[],
        agentDefinition:"A planner model",
        context:"",
        model:google("gemini-2.5-pro-exp-03-25"),
    });
    console.log("plan",postprocessedPlan);
    const graph = await execute(postprocessedPlan);
    console.log("graph",graph);

}
test()