const globalCache = globalThis;

if (!globalCache.instagramDraftLiveEvents) {
  globalCache.instagramDraftLiveEvents = {
    listeners: new Map(),
  };
}

function getListenerSet(userId) {
  const key = String(userId);
  const listeners = globalCache.instagramDraftLiveEvents.listeners;

  if (!listeners.has(key)) {
    listeners.set(key, new Set());
  }

  return listeners.get(key);
}

export function addInstagramDraftListener(userId, listener) {
  const listeners = getListenerSet(userId);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function emitInstagramDraft(userId, draft) {
  const listeners = globalCache.instagramDraftLiveEvents.listeners.get(String(userId));

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener(draft);
  }
}
