import { tool } from 'ai';
import { z } from 'zod';
import { findRelevantContent } from "@/lib/ai/tools/rules";

export const getRules = tool({
    description: "Hole dir aus der Knowledge Base (Azure AI Search) relevante Informationen zu den Regeln von Yugioh.",
    parameters: z.object({
        question: z.string().describe("die ursprüngliche Frage des Nutzers"),
        similarQuestions: z.array(z.string()).describe("ähnliche Fragen, um bessere Suchergebnisse zu erzielen"),
    }),
    execute: async ({ question, similarQuestions }) => {
        // Suche nach der eigentlichen Frage
        const primaryResults = await findRelevantContent(question);

        // Suche nach den ähnlichen Fragen
        const otherResults = [];
        for (const sq of similarQuestions) {
            const res = await findRelevantContent(sq);
            otherResults.push(...res);
        }

        // Alle Ergebnisse zusammenführen und nach Score sortieren
        const combined = [...primaryResults, ...otherResults];
        combined.sort((a, b) => (b.score || 0) - (a.score || 0));

        // Doppelte Einträge anhand des "text"-Felds herausfiltern, dabei bleiben alle Felder (inkl. "id") erhalten
        const seenTexts = new Set<string>();
        const uniqueResults = combined.filter(item => {
            if (item.text && !seenTexts.has(item.text)) {
                seenTexts.add(item.text);
                return true;
            }
            return false;
        });
        console.log(uniqueResults)
        // Die Liste der eindeutigen Ergebnisse zurückgeben
        return uniqueResults;

    },
});
