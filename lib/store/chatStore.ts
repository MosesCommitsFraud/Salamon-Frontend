"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Optional: Falls Du bereits Typen aus Deinem DB‑Schema importierst, kannst Du diese nutzen.
// import type { Chat as DBChat, DBMessage } from "./db-schema";

// Andernfalls definieren wir hier entsprechende Typen:

export type Chat = {
    id: string;
    createdAt: string; // ISO-Datum
    title: string;
    userId: string;
    visibility: "public" | "private";
};

export type Message = {
    id: string;
    chatId: string;
    role: string;
    parts: any; // passe diesen Typ bei Bedarf an
    attachments: any; // passe diesen Typ bei Bedarf an
    createdAt: string;
};

// Erweiterter Typ für eine Chat-Session, die zusätzlich die zugehörigen Nachrichten enthält
export type ChatSession = Chat & {
    messages: Message[];
};

type ChatState = {
    chatSessions: ChatSession[];
    // Erstelle einen neuen Chat und gib die Chat-ID zurück
    createChat: (
        title: string,
        userId: string,
        visibility?: "public" | "private"
    ) => string;
    // Füge eine Nachricht zu einem Chat hinzu
    addMessage: (
        chatId: string,
        role: string,
        parts: any,
        attachments: any
    ) => void;
    // Entferne eine Nachricht aus einem Chat
    removeMessage: (chatId: string, messageId: string) => void;
    // Aktualisiere z. B. den Titel eines Chats
    updateChatTitle: (chatId: string, newTitle: string) => void;
};

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            chatSessions: [],
            createChat: (title, userId, visibility = "private") => {
                // Generiere eine eindeutige ID für den Chat (hier mit crypto.randomUUID falls verfügbar)
                const chatId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : "chat_" + Date.now();
                const newChat: ChatSession = {
                    id: chatId,
                    createdAt: new Date().toISOString(),
                    title,
                    userId,
                    visibility,
                    messages: [],
                };
                set((state) => ({
                    chatSessions: [...state.chatSessions, newChat],
                }));
                return chatId;
            },
            addMessage: (chatId, role, parts, attachments) => {
                const message: Message = {
                    id:
                        typeof crypto !== "undefined" && crypto.randomUUID
                            ? crypto.randomUUID()
                            : "msg_" + Date.now(),
                    chatId,
                    role,
                    parts,
                    attachments,
                    createdAt: new Date().toISOString(),
                };
                set((state) => ({
                    chatSessions: state.chatSessions.map((chat) =>
                        chat.id === chatId
                            ? { ...chat, messages: [...chat.messages, message] }
                            : chat
                    ),
                }));
            },
            removeMessage: (chatId, messageId) => {
                set((state) => ({
                    chatSessions: state.chatSessions.map((chat) =>
                        chat.id === chatId
                            ? {
                                ...chat,
                                messages: chat.messages.filter(
                                    (msg) => msg.id !== messageId
                                ),
                            }
                            : chat
                    ),
                }));
            },
            updateChatTitle: (chatId, newTitle) => {
                set((state) => ({
                    chatSessions: state.chatSessions.map((chat) =>
                        chat.id === chatId ? { ...chat, title: newTitle } : chat
                    ),
                }));
            },
        }),
        {
            name: "chat-session-store", // Eindeutiger Schlüssel im lokalen Speicher
            // Mit partialize könntest Du z. B. nur bestimmte Felder persistieren, wenn das sinnvoll ist.
            // partialize: (state) => ({ chatSessions: state.chatSessions.map(/* ... */) }),
        }
    )
);
