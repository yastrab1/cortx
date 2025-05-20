import {LanguageModel, Provider} from "ai";
import {openai} from "@ai-sdk/openai";
import {anthropic} from "@ai-sdk/anthropic";
import {google} from "@ai-sdk/google";
import {perplexity} from "@ai-sdk/perplexity";
import {ProviderV1} from "@ai-sdk/provider";

export function resolveModel(model: string): LanguageModel {
    const providerPrefixes = {
        "openai": openai,
        "google": google,
        "anthropic": anthropic,
        "perplexity": perplexity,
    } as { [key: string]: ProviderV1 };
    const colonIndex = model.indexOf(":");
    const provider = model.substring(0, colonIndex);
    const modelName = model.substring(colonIndex + 1);

    return providerPrefixes[provider].languageModel(modelName);
}