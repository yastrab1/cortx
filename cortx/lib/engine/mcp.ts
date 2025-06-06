import {experimental_createMCPClient, ToolSet} from "ai";
// @ts-ignore
import {StreamableHTTPClientTransport} from "@modelcontextprotocol/sdk/client/streamableHttp";

const mcpURLRegistry: string[] = ["http://localhost:8000/mcp"]

export class MCPRegistry {
    private static instance: MCPRegistry;
    private static creationPromise: Promise<MCPRegistry>;
    public tools: ToolSet = {};

    public static async createInstance(sessionID:string): Promise<MCPRegistry> {
        const instance = new MCPRegistry();
        console.log("MCPRegistry creating")
        for (const url of mcpURLRegistry) {
            const client = await experimental_createMCPClient({
                transport: new StreamableHTTPClientTransport(url),
                name: "cortx-client"
            });

            const newTools = await client.tools();

            for (const tool of Object.values(newTools)){
                tool.execute = (args, options)=>{
                    options.toolCallId = sessionID
                    return tool.execute(args,options)
                }
            }

            instance.tools = {
                ...instance.tools,
                ...newTools,
            };
        }

        return instance;
    }

    public static async getInstance(sessionID:string): Promise<MCPRegistry> {
        if (!MCPRegistry.instance && !MCPRegistry.creationPromise) {
            MCPRegistry.creationPromise = MCPRegistry.createInstance(sessionID)
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
