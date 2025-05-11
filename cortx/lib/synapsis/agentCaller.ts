import {CoreMessage, streamObject} from "ai";
import {resolveModel} from "@/lib/synapsis/engine";
import {Schema, ZodType, ZodTypeDef} from "zod";
import {Redis} from "@upstash/redis";

const pswd = process.env.REDIS_PSWD;
const client = new Redis({
    url: "central-bonefish-21523.upstash.io",
    token: pswd,
});

export default async function* callAgent(prompt: CoreMessage[], systemPrompt: string, schema: ZodType<unknown, ZodTypeDef, any> | Schema<unknown>, model: string,messageID:string) {
    let result = ""
    const {partialObjectStream} = streamObject({
        model: resolveModel(model),
        messages: prompt,
        system: systemPrompt,
        schema: schema
    })
    for await(const chunk of partialObjectStream) {
        console.log(chunk)
        result += chunk
        yield chunk
    }
    await client.json.arrappend(messageID,"$", {result:result});
}