import { generateText, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { createAzure } from '@ai-sdk/azure';

// Erstelle eine Azure-Instanz mit deinen Zugangsdaten
const azureInstance = createAzure({
    resourceName: 'miker-m83k3q0u-swedencentral',
    apiKey: '6mj1VsQqmAoXcfbyO3siypqOaiYWe2aLIhWRFZ8WRXv6GkBPlwlFJQQJ99BCACfhMk5XJ3w3AAAAACOGiZYy',
});

// Definiere einen einfachen Provider, der ausschließlich Azure OpenAI nutzt
const myProvider = {
    languageModel: (modelKey: string) => {
        switch (modelKey) {
            case 'chat-model':
                return azureInstance('gpt-4');
            case 'chat-model-reasoning':
                return wrapLanguageModel({
                    model: azureInstance('gpt-4'),
                    middleware: extractReasoningMiddleware({ tagName: 'think' }),
                });
            case 'title-model':
                return azureInstance('gpt-4');
            case 'artifact-model':
                return azureInstance('gpt-4');
            default:
                throw new Error(`Unbekannter Model-Key: ${modelKey}`);
        }
    }
};

async function main() {
    // Beispielprompt: Passe diesen Text nach Belieben an
    const prompt = "Schreibe einen kurzen Text über das Wetter heute.";

    try {
        const response = await generateText({
            model: myProvider.languageModel('chat-model'),
            prompt,
        });
        console.log("Antwort von der API:");
        console.log(response.text);
    } catch (err) {
        console.error("Fehler bei der API-Anfrage:", err);
    }
}

main();
