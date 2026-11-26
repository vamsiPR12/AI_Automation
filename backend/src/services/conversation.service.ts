
export interface ConversationSession {
  responseId: string;
  lastActivityAt: number;
}

// Store customer conversations temporarily in memory
const conversations = new Map<string, ConversationSession>();

// Session expires after 30 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Get an existing conversation
export function getConversation(sessionId: string) {
  const session = conversations.get(sessionId);

  if (!session) {
    return undefined;
  }

  // Check whether this session has expired
  if (Date.now() - session.lastActivityAt > SESSION_TIMEOUT) {
    conversations.delete(sessionId);
    return undefined;
  }

  return session;
}

// Save or update a conversation
export function saveConversation(
  sessionId: string,
  responseId: string
) {
  conversations.set(sessionId, {
    responseId,
    lastActivityAt: Date.now(),
  });
}

// Delete a conversation
export function deleteConversation(sessionId: string) {
  return conversations.delete(sessionId);
}

// Remove all expired conversations
export function cleanupExpiredSessions() {
  const currentTime = Date.now();

  for (const [sessionId, session] of conversations.entries()) {
    if (
      currentTime - session.lastActivityAt > SESSION_TIMEOUT
    ) {
      conversations.delete(sessionId);
    }
  }
}
