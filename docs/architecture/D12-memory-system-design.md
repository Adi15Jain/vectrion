# D12 — Memory System Design

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Title**        | Memory System Design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Priority**     | P1 — Stateful Agent Experience                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md) |
| **Dependents**   | D13, D15 (and all conversational agent features)                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Memory Subsystem Architecture](#2-memory-subsystem-architecture)
3. [Short-Term Sliding Window Memory](#3-short-term-sliding-window-memory)
4. [Context Pruning & Summarization Pipeline](#4-context-pruning--summarization-pipeline)
5. [Long-Term Semantic Memory & RAG Integration](#5-long-term-semantic-memory--rag-integration)
6. [The MemoryStore Storage Interface](#6-the-memorystore-storage-interface)
7. [Dynamic Context Injection Middleware](#7-dynamic-context-injection-middleware)
8. [Glossary](#8-glossary)

---

## 1. Purpose

This document establishes the architecture and design specifications for the **Memory Subsystem** (`@vectrion/memory`). Large Language Models operate within fixed context windows and are inherently stateless. To support multi-turn conversational agents, applications must maintain historical context, retrieve relevant facts, and manage token limits dynamically.

This specification details short-term sliding-window buffers, dynamic token-based context summarization pipelines, long-term similarity store integrations, and context-injection middleware.

---

## 2. Memory Subsystem Overview

The `@vectrion/memory` package provides conversational persistence for AI applications. It operates as a middleware wrapper, pulling historical context from memory stores and injecting it into prompt payloads before dispatching to the core engine:

```
[Request Input] ──► [Memory Middleware] ──► [MemoryStore] (Retrieve History)
                           │
                           ├──► Summarize / Prune (Token Check)
                           │
                           └──► [Combined Prompt Payload] ──► [Core Execution]
```

---

## 3. Short-Term Sliding Window Memory

Short-term memory preserves immediate conversational threads, storing a configured history of user and assistant interactions.

### 3.1 Sliding Window Mechanics

Rather than storing infinite histories, Vectrion uses a sliding-window strategy to discard old messages and fit requests within context windows:

```typescript
export interface SlidingWindowConfig {
    maxMessages?: number; // Maximum message count to retain in memory (Default: 10)
    maxTokens?: number; // Hard token limit to prevent context overflows
}
```

```
 [Msg 0] -> [Msg 1] -> [Msg 2] -> [Msg 3] -> [Msg 4] -> [Msg 5]
 \_________________________________________________/
            Active Sliding Window (size: 5)
```

---

## 4. Context Pruning & Summarization Pipeline

When conversational histories approach token limits, Vectrion runs an automated **Context Summarization Pipeline** to reduce token counts without losing historical context.

```
       [Context Size > Safety Threshold]
                       │
                       ▼
      Extract older history message block
                       │
                       ▼
       Dispatch background summarizer run
                       │
                       ▼
    Replace raw block with concise summary string
                       │
                       ▼
     Clean contextual memory space restored
```

### 4.1 Summarization Thresholds

- **Safety Margin**: Triggered when the estimated token count of the conversation exceeds **70% of the model's maximum context limit** (→ D05).
- **Execution**: The memory manager condenses the first half of the active window into a single concise summary string, retaining recent messages as raw text.

---

## 5. Long-Term Semantic Memory & RAG Integration

For persistent, long-term memory, Vectrion integrates with vector databases (Retrieval-Augmented Generation) to store and recall historical facts semantically.

### 5.1 Semantic Recall Flow

1. **Embedding generation**: When a prompt is received, the memory manager generates an embedding vector.
2. **Similarity search**: Queries vector databases to identify historically relevant matches based on cosine similarity scores.
3. **Relevance Injection**: Formats matching documents and appends them to the system prompt as contextual reference material.

---

## 6. The MemoryStore Storage Interface

All memory backends must implement the standard storage contract defined in `@vectrion/memory`:

```typescript
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface MemoryStore {
    // Retrieve the raw message history for a conversation ID
    getHistory(sessionId: string): Promise<Message[]>;

    // Append a new message to a conversation history
    appendMessage(sessionId: string, message: Message): Promise<void>;

    // Clear history for a conversation ID
    clearHistory(sessionId: string): Promise<void>;
}
```

### 6.1 Bundled Backends

- **In-Memory Store**: Fast, localized storage for development and stateless testing environments.
- **Redis Store**: Distributed storage with configurable TTL, designed for scalable cloud deployments.

---

## 7. Dynamic Context Injection Middleware

Vectrion integrates memory seamlessly into the execution pipeline via an asynchronous **Context Injection Middleware**:

```typescript
import { Middleware } from '@vectrion/types';
import { MemoryStore } from './store.js';

export function contextInjector(store: MemoryStore, sessionId: string): Middleware {
    return async (ctx, next) => {
        // 1. Retrieve historical messages from storage
        const history = await store.getHistory(sessionId);

        // 2. Format history into a unified chat transcript block
        const transcript = history
            .map((msg) => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
            .join('\n');

        // 3. Mutate request prompt, prepending the chat history block
        ctx.request.prompt = `Conversational Transcript:\n${transcript}\n\nUser: ${ctx.request.prompt}`;

        // 4. Propagate down the execution pipeline
        await next();

        // 5. Save output response back to memory store on return
        if (ctx.response) {
            await store.appendMessage(sessionId, {
                role: 'user',
                content: ctx.request.prompt,
                timestamp: Date.now(),
            });
            await store.appendMessage(sessionId, {
                role: 'assistant',
                content: ctx.response.text,
                timestamp: Date.now(),
            });
        }
    };
}
```

---

## 8. Glossary

- **Stateless**: A design pattern where components do not retain internal state across sequential execution requests.
- **Sliding Window**: A memory strategy that retains only a fixed count of recent items, discarding older entries to save space.
- **Context Compression**: Summarizing long message histories into concise text blocks to fit within token limits.
- **RAG**: Retrieval-Augmented Generation, injecting relevant external database documents directly into prompt payloads.
- **Semantic Search**: Finding relevant documents by matching meaning and context rather than just exact keywords.
