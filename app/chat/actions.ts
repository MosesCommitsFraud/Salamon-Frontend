'use server';

import { generateText, Message } from 'ai';
import { cookies } from 'next/headers';
import { VisibilityType } from '@/components/visibility-selector';
import { myProvider } from '@/lib/ai/providers';

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-model', model);
}

export async function generateTitleFromUserMessage({
                                                     message,
                                                   }: {
  message: Message;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  });

  return title;
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  // Datenbankaufrufe wurden entfernt – hier wird keine Aktion durchgeführt.
  return;
}

export async function updateChatVisibility({
                                             chatId,
                                             visibility,
                                           }: {
  chatId: string;
  visibility: VisibilityType;
}) {
  // Datenbankaufrufe wurden entfernt – hier wird keine Aktion durchgeführt.
  return;
}
