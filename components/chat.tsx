'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { toast } from 'sonner';

export function Chat({
                         initialMessages,
                         selectedChatModel,
                         selectedVisibilityType,
                         isReadonly,
                     }: {
    initialMessages: Array<UIMessage>;
    selectedChatModel: string;
    selectedVisibilityType: VisibilityType;
    isReadonly: boolean;
}) {
    const { mutate } = useSWRConfig();

    const {
        messages,
        setMessages,
        handleSubmit,
        input,
        setInput,
        append,
        status,
        stop,
        reload,
    } = useChat({
        // Keine ID mehr, da der Chat nicht persistiert wird:
        body: { selectedChatModel },
        initialMessages,
        experimental_throttle: 100,
        sendExtraMessageFields: true,
        generateId: generateUUID,
        onFinish: () => {
            mutate('/api/history');
        },
        onError: () => {
            toast.error('An error occured, please try again!');
        },
    });

    // Da keine persistente Chat-ID mehr verwendet wird, entfällt auch die Votes-Abfrage.
    const votes = undefined;

    const [attachments, setAttachments] = useState<Array<Attachment>>([]);
    const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

    return (
        <>
            <div className="flex flex-col min-w-0 h-[calc(100vh-4rem)] bg-background">
                <ChatHeader
                    selectedModelId={selectedChatModel}
                    selectedVisibilityType={selectedVisibilityType}
                    isReadonly={isReadonly}
                />

                <Messages
                    status={status}
                    votes={votes}
                    messages={messages}
                    setMessages={setMessages}
                    reload={reload}
                    isReadonly={isReadonly}
                    isArtifactVisible={isArtifactVisible}
                />

                <form className="flex mx-auto px-4 bg-background mb-4 pb-4 md:pb-6 gap-2 w-full md:max-w-3xl">
                    {!isReadonly && (
                        <MultimodalInput
                            input={input}
                            setInput={setInput}
                            handleSubmit={handleSubmit}
                            status={status}
                            stop={stop}
                            attachments={attachments}
                            setAttachments={setAttachments}
                            messages={messages}
                            setMessages={setMessages}
                            append={append}
                        />
                    )}
                </form>
            </div>

            <Artifact
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                status={status}
                stop={stop}
                attachments={attachments}
                setAttachments={setAttachments}
                append={append}
                messages={messages}
                setMessages={setMessages}
                reload={reload}
                votes={votes}
                isReadonly={isReadonly}
            />
        </>
    );
}
