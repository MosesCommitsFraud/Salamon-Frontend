import { useChatStore } from '@/lib/store/chatStore';
import type { ChatSession, Message } from '@/lib/store/chatStore';

/* User-Funktionen sind im Client-Store nicht implementiert */
export async function getUser(email: string): Promise<null> {
  return null;
}

export async function createUser(email: string, password: string): Promise<void> {
  throw new Error('createUser ist im Client-Store nicht implementiert');
}

/* Chat-Funktionen */

// Anmerkung: Da unser Store beim Erstellen eines Chats eine eigene ID generiert,
// wird der übergebene id-Parameter ignoriert.
export async function saveChat({
                                 id,
                                 userId,
                                 title,
                               }: {
  id: string;
  userId: string;
  title: string;
}): Promise<string> {
  // Erstelle einen neuen Chat und gib die generierte Chat-ID zurück.
  const newChatId = useChatStore.getState().createChat(title, userId, "private");
  return newChatId;
}

export async function deleteChatById({ id }: { id: string }): Promise<void> {
  useChatStore.setState((state) => ({
    chatSessions: state.chatSessions.filter((chat) => chat.id !== id),
  }));
}

export async function getChatsByUserId({ id }: { id: string }): Promise<ChatSession[]> {
  const chats = useChatStore.getState().chatSessions;
  return chats.filter((chat) => chat.userId === id);
}

export async function getChatById({ id }: { id: string }): Promise<ChatSession | "none"> {
    const chats = useChatStore.getState().chatSessions;
    const found = chats.find((chat) => chat.id === id);
    return found ?? "none";
}


/* Message-Funktionen */

export async function saveMessages({
                                     messages,
                                   }: {
  messages: Array<Message>;
}): Promise<void> {
  // Für jede Nachricht wird der Store-Mechanismus genutzt, um sie hinzuzufügen.
  messages.forEach((msg) => {
    useChatStore.getState().addMessage(msg.chatId, msg.role, msg.parts, msg.attachments);
  });
}

export async function getMessagesByChatId({ id }: { id: string }): Promise<Message[]> {
  const chat = useChatStore.getState().chatSessions.find((chat) => chat.id === id);
  return chat ? chat.messages : [];
}

export async function getMessageById({ id }: { id: string }): Promise<Message | undefined> {
  const chats = useChatStore.getState().chatSessions;
  for (const chat of chats) {
    const found = chat.messages.find((message) => message.id === id);
    if (found) return found;
  }
  return undefined;
}

export async function deleteMessagesByChatIdAfterTimestamp({
                                                             chatId,
                                                             timestamp,
                                                           }: {
  chatId: string;
  timestamp: Date;
}): Promise<void> {
  const state = useChatStore.getState();
  const chat = state.chatSessions.find((chat) => chat.id === chatId);
  if (chat) {
    // Lösche alle Nachrichten, deren Erstellungszeitpunkt größer oder gleich dem gegebenen Timestamp ist.
    chat.messages.forEach((message) => {
      if (new Date(message.createdAt) >= timestamp) {
        state.removeMessage(chatId, message.id);
      }
    });
  }
}

/* Chat-Titel aktualisieren */
export async function updateChatTitle({
                                        chatId,
                                        newTitle,
                                      }: {
  chatId: string;
  newTitle: string;
}): Promise<void> {
  useChatStore.getState().updateChatTitle(chatId, newTitle);
}

/* Die folgenden Funktionen (Votes, Dokumente, Suggestions) sind im Client-Store nicht umgesetzt. */
export async function voteMessage({
                                    chatId,
                                    messageId,
                                    type,
                                  }: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}): Promise<void> {
  throw new Error('voteMessage ist im Client-Store nicht implementiert');
}

export async function getVotesByChatId({ id }: { id: string }): Promise<never> {
  throw new Error('getVotesByChatId ist im Client-Store nicht implementiert');
}

export async function saveDocument({
                                     id,
                                     title,
                                     kind,
                                     content,
                                     userId,
                                   }: {
  id: string;
  title: string;
  kind: string; // oder deinen spezifischen Typ (z. B. ArtifactKind)
  content: string;
  userId: string;
}): Promise<void> {
  throw new Error('saveDocument ist im Client-Store nicht implementiert');
}

export async function getDocumentsById({ id }: { id: string }): Promise<never> {
  throw new Error('getDocumentsById ist im Client-Store nicht implementiert');
}

export async function getDocumentById({ id }: { id: string }): Promise<never> {
  throw new Error('getDocumentById ist im Client-Store nicht implementiert');
}

export async function deleteDocumentsByIdAfterTimestamp({
                                                          id,
                                                          timestamp,
                                                        }: {
  id: string;
  timestamp: Date;
}): Promise<void> {
  throw new Error('deleteDocumentsByIdAfterTimestamp ist im Client-Store nicht implementiert');
}

export async function saveSuggestions({
                                        suggestions,
                                      }: {
  suggestions: Array<any>;
}): Promise<void> {
  throw new Error('saveSuggestions ist im Client-Store nicht implementiert');
}

export async function getSuggestionsByDocumentId({
                                                   documentId,
                                                 }: {
  documentId: string;
}): Promise<never> {
  throw new Error('getSuggestionsByDocumentId ist im Client-Store nicht implementiert');
}
