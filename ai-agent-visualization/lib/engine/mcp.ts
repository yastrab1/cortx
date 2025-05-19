import { experimental_createMCPClient, ToolSet } from "ai";

const mcpURLRegistry: string[] = ["http://13.53.91.173:3001/sse"]

export class MCPRegistry {
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
