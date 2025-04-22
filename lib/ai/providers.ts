import {
  customProvider,
  wrapLanguageModel,
} from 'ai';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import {google} from "@ai-sdk/google";
import {customMiddleware} from "@/ai/custom-middleware";

export const myProvider = isTestEnvironment
    ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
    : customProvider({
      languageModels: {
        'chat-model': google("gemini-2.0-flash-001"),
        'chat-model-reasoning': google("gemini-2.5-pro-preview-03-25"),
        'chat-model-gemma': google("gemini-2.5-pro-preview-03-25"),
        'title-model': google("gemini-2.0-flash-lite-001"),
        'artifact-model': google("gemini-2.0-flash-lite-001"),
      },
    });
