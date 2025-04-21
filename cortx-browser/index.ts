import { perplexity } from '@ai-sdk/perplexity';
import { McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {Stagehand} from "@browserbasehq/stagehand";
import {v4 as uuidv4} from 'uuid';
import {AISdkClient} from "./llm_clients/aisdk_client.js";
import {google} from "@ai-sdk/google";


import { z } from 'zod';
import {SSEServerTransport} from "@modelcontextprotocol/sdk/server/sse.js";

const stagehands: { [key: string]: Stagehand } = {};

function validateID(id: string) {
  return stagehands[id] ? stagehands[id] : null;
}

const server = new McpServer({
  name: "Demo",
  version: "1.0.0"
});

server.tool("init_connection",
    {},
    async () => ({
      content: [{ type: "text", text: String(await (async () => {
          const id = uuidv4();
          const stagehand = new Stagehand({
            env: "LOCAL",
            localBrowserLaunchOptions: { headless: true },
            llmClient: new AISdkClient({
              model: openai("gpt-4.1-mini"),
            }),
          });

              console.log("Initiating connection " + id);
          await stagehand.init();
          stagehands[id] = stagehand;
          return id;
        })()) }]
    })
);

server.tool("goto_page",
    {
      id: z.string(),
      url: z.string()
    },
    async ({ id, url }) => {
      const stagehand = validateID(id);
      if (!stagehand) throw new Error('Invalid connection ID');

      console.log("Going to page "+url+" for "+id);
      await stagehand.page.goto(url);
      const title = await stagehand.page.title();
      return {
        content: [{ type: "text", text: title }]
      };
    }
);

server.tool("act",
    {
      id: z.string(),
      actAction: z.string()
    },
    async ({ id, actAction }) => {
      const stagehand = validateID(id);
      if (!stagehand) throw new Error('Invalid connection ID');
      console.log("Acting on page "+stagehand.page.url()+" for "+id);
      const result = await stagehand.page.act(actAction);
      return {
        content: [{ type: "text", text: JSON.stringify({ result, url: stagehand.page.url() }) }]
      };
    }
);

server.tool("extract",
    {
      id: z.string(),
      extractAction: z.string()
    },
    async ({ id, extractAction }) => {
      const stagehand = validateID(id);
      if (!stagehand) throw new Error('Invalid connection ID');
        console.log("Extracting on page "+stagehand.page.url()+" for "+id);
      const result = await stagehand.page.extract(extractAction);
      return {
        content: [{ type: "text", text: JSON.stringify({ result, url: stagehand.page.url() }) }]
      };
    }
);

server.tool("observe",
    {
      id: z.string(),
      observeAction: z.string()
    },
    async ({ id, observeAction }) => {
      const stagehand = validateID(id);
      if (!stagehand) throw new Error('Invalid connection ID');

      console.log("Observing on page "+stagehand.page.url()+" for "+id);
      const results = await stagehand.page.observe(observeAction);
      return {
        content: [{ type: "text", text: JSON.stringify({ results, url: stagehand.page.url() }) }]
      };
    }
);

server.tool("agent_execute",
    {
      id: z.string(),
      instruction: z.string()
    },
    async ({ id, instruction }) => {
      const stagehand = validateID(id);
      if (!stagehand) throw new Error('Invalid connection ID');
        console.log("Executing agent with instruction " + instruction+ " for "+id);
      const agent = stagehand.agent({});
      const result = "Error"
      try {
          const result = await agent.execute(instruction);
          console.log(result.message+" for "+id);

      }catch (e){
          console.log(e)
          throw e;
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ result, url: stagehand.page.url() }) }]
      };
    }
);

server.tool("search",
    {
        id: z.string(),
        query: z.string().describe("A search query. Use natural language, the model on the other side is from Perplexity")
    },
    async ({ id, query }) => {
         console.log("Searching for "+query+" for "+id);
        const result = await generateText({
            model:perplexity("sonar"),
            prompt:query
        })
        console.log(result.text)
        return {
            content: [{ type: "text", text: result.text }]
        }
    }
    )
import express from "express";
import {openai} from "@ai-sdk/openai";
import {generateText} from "ai";


const app = express();

let transport:SSEServerTransport;
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Printer Store MCP SSE Server is running on http://localhost:${port}/sse`);
  console.log("/sse")
  console.log("/messages")
});