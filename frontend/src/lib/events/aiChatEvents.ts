export const AI_CONVERSATIONS_CHANGED = 'ai:conversations:changed';
export const AI_MESSAGES_CHANGED = 'ai:messages:changed';

export function notifyConversationsChanged(convId?: string | number) {
  try {
    window.dispatchEvent(
      new CustomEvent(AI_CONVERSATIONS_CHANGED, {
        detail: { convId: convId != null ? String(convId) : undefined },
      })
    );
  } catch (e) {
    // no-op on server/non-DOM env
  }
}

export function notifyMessagesChanged(convId: string | number) {
  try {
    window.dispatchEvent(
      new CustomEvent(AI_MESSAGES_CHANGED, {
        detail: { convId: String(convId) },
      })
    );
  } catch (e) {
    // no-op
  }
}
