import {experimental_createMCPClient, ToolSet} from "ai";
import {StreamableHTTPClientTransport} from "@modelcontextprotocol/sdk/client/streamableHttp";

const mcpURLRegistry: string[] = ["http://localhost:3000/mcp"]

export class MCPRegistry {
    private static instance: MCPRegistry;
    private static creationPromise: Promise<MCPRegistry>;
    public tools: ToolSet = {};

    private constructor() {
    }

    public static async createInstance(): Promise<MCPRegistry> {
        const instance = new MCPRegistry();

        for (const url of mcpURLRegistry) {
            console.log("connecting to mcp server", url)
            const transport =  new StreamableHTTPClientTransport(url)
            console.log("connected to transport", transport)
            const client = await experimental_createMCPClient({
                transport: transport,
                name:"cortx-client"
            });
            console.log("connected to server", client)

            const newTools = await client.tools();
            instance.tools = {
                ...instance.tools,
                ...newTools,
            };
        }

        return instance;
    }

    public static async getInstance(): Promise<MCPRegistry> {
        if (!MCPRegistry.instance && !MCPRegistry.creationPromise) {
            MCPRegistry.creationPromise = MCPRegistry.createInstance()
        }
        if (!MCPRegistry.instance) {
            return MCPRegistry.creationPromise;
        }
        return MCPRegistry.instance
    }


    public getTools(): ToolSet {
        return this.tools
    }
}
