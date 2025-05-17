import { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";

export function resolveModel(model: string): LanguageModel {
    const providerPrefixes = {
        "openai": ["gpt"],
        "google": ["gemini"],
        "anthropic": ["claude"],
    };
    let i = 0;
    let provider = "";
    const modelsList = Object.values(providerPrefixes) as string[][];
    for (const modelList of modelsList) {
        for (const prefix of modelList) {
            if (model.startsWith(prefix)) {
                provider = Object.keys(providerPrefixes)[i]
            }
        }
        i += 1;
    }
    let providerObject = undefined;
    if (provider == "anthropic") {
        providerObject = anthropic
    } else if (provider == "openai") {
        providerObject = openai
    } else if (provider == "google") {
        providerObject = google
    } else if (provider == "perplexity") {
        providerObject = perplexity
    } else {
        throw new Error("Invalid Model!")
    }
    return providerObject(model);
}