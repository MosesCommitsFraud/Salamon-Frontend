import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

/**
 * Stelle sicher, dass du folgende Umgebungsvariablen hinterlegt hast:
 * - AZURE_SEARCH_ENDPOINT (z.B.: "https://<service-name>.search.windows.net")
 * - AZURE_SEARCH_INDEX (z.B.: "mein-index")
 * - AZURE_SEARCH_KEY (API-Key)
 */
const endpoint = process.env.AZURE_SEARCH_ENDPOINT!;
const indexName = process.env.AZURE_SEARCH_INDEX_NAME!;
const apiKey = process.env.AZURE_SEARCH_KEY!;

// SearchClient wird als Singleton angelegt
const searchClient = new SearchClient(endpoint, indexName, new AzureKeyCredential(apiKey));
const searchParameters: any = {
  top: 10,
  queryType: "simple",
};

/**
 * Nimmt eine Query entgegen, macht einen Search-Aufruf bei Azure AI Search
 * und gibt eine Liste von Dokumentobjekten zurück, z.B.:
 * [
 *   {
 *     text: "...",
 *     id: "docId",
 *     ...
 *   },
 *   ...
 * ]
 */
export async function findRelevantContent(query: string) {
  try {
    const results2 = [];
    const searchResults = await searchClient.search(query, searchParameters);

    for await (const result of searchResults.results) {
      console.log(result);
      const regex = /^(\d+)\.json$/;
      const match = result.document.title.match(regex);

      if (match) {
        // match[1] enthält nur die Nummer als String
        const numberString = match[1];
        // Konvertiere den String in eine Zahl
        const numberValue = parseInt(numberString, 10);
        // Passe hier die Felder an deine Indexstruktur an!
        // Beispiel: "content" könnte dein Feld im Index sein, in dem der eigentliche Text gespeichert ist.
        results2.push({
          id: numberValue,  // oder z.B. result.document.description
          score: result.score,
          text: result.document.chunk ?? "",
          // Du kannst natürlich noch weitere Felder ausgeben, je nach Bedarf
        });
      }
    }

    return results2;
  } catch (err) {
    console.error("Search error:", err);
    return [];
  }
}
