
import {convertToCoreMessages, smoothStream, streamText, UIMessage} from "ai";

import { systemPrompt } from '@/lib/ai/prompts';
import { myProvider } from '@/lib/ai/providers';
import {getInformation} from "@/lib/ai/tools/getInformation";
import {getRules} from "@/lib/ai/tools/getRules";
export async function POST(req: Request) {
    try {
        const {
            id,
            messages,
            selectedChatModel,
        }: {
            id: string;
            messages: Array<UIMessage>;
            selectedChatModel: string;
        } = await req.json();

        const coreMessages = convertToCoreMessages(messages).filter(
            (message) => message.content.length > 0,)

        console.log(myProvider.languageModel(selectedChatModel))
        const result = await streamText({
            model: myProvider.languageModel(selectedChatModel),
            system:systemPrompt({ selectedChatModel }),
            messages: coreMessages,
            tools:{getInformation,
            getRules},
            maxSteps: 8,
            experimental_transform: smoothStream({ chunking: 'word' }),
        });
        return result.toDataStreamResponse({});
    } catch (error: unknown) {
        console.error(error);
        return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again later." }), { status: 500 });
    }
}
