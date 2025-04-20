import express, { Request, Response } from 'express';
import {Stagehand} from "@browserbasehq/stagehand";
import {v4 as uuidv4} from 'uuid';
import {AISdkClient} from "./llm_clients/aisdk_client.js";
import {google} from "@ai-sdk/google";

const app = express();
const PORT = 3000;
app.use(express.json());
const stagehands : {[key:string]:Stagehand} = {}

function validateIDAndReturnObj(id:string,res:Response){
  if(stagehands[id]){
    return stagehands[id]
  }else{
    res.status(404).send("Invalid ID")
  }
}

app.get('/initConnection', async (req: Request, res: Response) => {
  const id = uuidv4()

  console.log("New connection id:"+id)

  const stagehand = new Stagehand({
    env: "LOCAL",
    localBrowserLaunchOptions:{
      headless:true,
    },
    llmClient: new AISdkClient({
      model:google("gemini-2.0-flash-exp"),
    }),

  });
  await stagehand.init()
  stagehands[id] = stagehand
  res.status(200).send(id)
})

app.post('/goto/:id', async (req: Request, res: Response) => {
  const stagehand = validateIDAndReturnObj(req.params.id,res)

  console.log("Going to webpage:"+req.body.url+" with id:"+req.params.id)

  if(!stagehand) return

  await stagehand.page.goto(req.body.url)
  res.send(await stagehand.page.title())
});

app.post('/act/:id', async (req: Request, res: Response) => {
  const stagehand = validateIDAndReturnObj(req.params.id,res)

  console.log("Acting on webpage:"+req.body.actAction+" with id:"+req.params.id)

  if(!stagehand) return

  const result= await stagehand.page.act(req.body.actAction)
  res.status(200).send({result,"url":stagehand.page.url()})
});

app.post('/extract/:id', async (req: Request, res: Response) => {
  const stagehand = validateIDAndReturnObj(req.params.id,res)

  console.log("Extracting from webpage:"+req.body.extractAction+" with id:"+req.params.id)

  if(!stagehand) return

  const result = await stagehand.page.extract(req.body.extractAction)
  res.status(200).send({result,"url":stagehand.page.url()})
});

app.post('/observe/:id', async (req: Request, res: Response) => {
  const stagehand = validateIDAndReturnObj(req.params.id,res)

  console.log("Observing webpage:"+req.body.observeAction+" with id:"+req.params.id)

  if(!stagehand) return

  const results = await stagehand.page.observe(req.body.observeAction)
  res.status(200).send({results,"url":stagehand.page.url()})
});


app.post('/agentExecute/:id', async (req: Request, res: Response) => {
  const stagehand = validateIDAndReturnObj(req.params.id,res)

  console.log("Executing agent:"+req.body.instruction+" with id:"+req.params.id)

  if(!stagehand) return

  const agent = stagehand.agent({})
  const result = await agent.execute(req.body.instruction)
  console.log(result)
  res.status(200).send({result,"url":stagehand.page.url()})
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
