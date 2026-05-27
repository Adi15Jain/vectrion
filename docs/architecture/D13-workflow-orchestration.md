# D13 — Workflow Orchestration Design

| Field            | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Document ID**  | D13                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **Title**        | Workflow Orchestration Design                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Status**       | Draft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Priority**     | P1 — Compound AI Capabilities                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| **Tier**         | Tier 2                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Author**       | Lead Systems Architect                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Dependencies** | [D01 — Product Vision](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D01-product-vision.md), [D02 — System Architecture Overview](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D02-system-architecture-overview.md), [D03 — Monorepo Structure](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D03-monorepo-structure.md), [D04 — Runtime Lifecycle](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D04-runtime-lifecycle.md), [D08 — SDK API Surface](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D08-sdk-api-surface.md), [D12 — Memory System Design](file:///Users/adijain/Documents/Projects/vectrion/docs/architecture/D12-memory-system-design.md) |
| **Dependents**   | D15, D18 (and all agent/chain frameworks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| **Created**      | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| **Last Updated** | 2026-05-28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Workflow Subsystem Architecture](#2-workflow-subsystem-architecture)
3. [Linear Chains & Sequential Topologies](#3-linear-chains--sequential-topologies)
4. [Directed Acyclic Graphs (DAGs) Execution Engine](#4-directed-acyclic-graphs-dags-execution-engine)
5. [Autonomous Agent Loops & Halting Invariants](#5-autonomous-agent-loops--halting-invariants)
6. [The WorkflowNode Interface Contract](#6-the-workflownode-interface-contract)
7. [Global State Context Transmission](#7-global-state-context-transmission)
8. [Glossary](#8-glossary)

---

## 1. Purpose

This document establishes the architecture and design specifications for the **Workflow Orchestration Subsystem** (`@vectrion/workflows`). Production AI systems are rarely composed of a single, isolated LLM request. Achieving complex operational objectives requires coordinating multiple sequential prompts, running parallel evaluations, executing Directed Acyclic Graphs (DAGs), or running autonomous loops.

This specification details our linear chain managers, parallel DAG scheduling engines, autonomous loops execution paths, and shared-state transmission engines.

---

## 2. Workflow Subsystem Overview

The `@vectrion/workflows` package orchestrates multi-step, compound AI execution pathways. Rather than executing prompts in application space, workflows structure steps as isolated, composable nodes, coordinating state passing and execution flows:

```
                  +--------------------------------+
                  |         Workflow Engine        |
                  +---------------+----------------+
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
   Linear Chains            DAG Topologies          Agent Loops
   [Step 0] -> [Step 1]     [Step A] ──┬──► [Step B]   (State) ──► [Prompt]
                                       └──► [Step C]      ▲           │
                                                          └─ (Update) ┘
```

---

## 3. Linear Chains & Sequential Topologies

Linear chains represent the simplest multi-step workflow structure, executing a series of dependent tasks in sequence:

```
[Input Parameters] ──► [Step 1: Drafting] ──► [Output] ──► [Step 2: Editing] ──► [Result]
```

### 3.1 Parameter Propagation

- Each step receives the output of the preceding step as part of its input parameters.
- If a step in a chain encounters an exception, execution halts immediately, and the chain propagates the failure up the stack.

---

## 4. Directed Acyclic Graphs (DAGs) Execution Engine

For complex pipelines requiring parallel execution or complex dependencies, Vectrion includes a **DAG Execution Engine**.

```
                   ┌──► [Node B: Translate Spanish] ──┐
                   │                                  ▼
[Node A: Translate] ┼──► [Node C: Translate French] ───┼─► [Node E: Compile Output]
                   │                                  ▲
                   └──► [Node D: Translate German] ───┘
```

### 4.1 Parallel Execution Scheduling

- **Dependency Tracking**: The engine tracks dependencies across nodes, building an execution schedule.
- **Concurrency**: Nodes with met dependencies execute in parallel, utilizing Node.js's async event loop.
- **Halting Rules**: If a node fails, dependent child nodes are canceled, while unrelated parallel branches continue execution.

---

## 5. Autonomous Agent Loops & Halting Invariants

Autonomous agent loops run iteratively, generating thoughts, actions, and observations until a specific goal or halting condition is met.

```
       [Start Loop] ──► Run Reasoning Step (Thought/Action)
            ▲                         │
            │                         ▼
            │               Execute Action (Observation)
            │                         │
            ▼                         ▼
      Halting Invariant Met? ─────► [Yes] ────► [Resolve Loop]
            │
           [No]
            │
            └─────────────────────────┘
```

### 5.1 Safety Halting Invariants

To prevent infinite reasoning loops and runaway API costs, agent loops must satisfy three hard safety constraints:

1. **Max Iterations**: A configurable ceiling on the number of execution loops (Default: 10).
2. **Cost Cap**: The execution loop halts immediately if accumulated API costs exceed the configured session budget (→ D11).
3. **Trace Halting**: Loops terminate if a repeat pattern is detected in the agent's actions (indicating an execution loop).

---

## 6. The WorkflowNode Interface Contract

Every execution step in a workflow is modeled as a `WorkflowNode`:

```typescript
export interface NodeContext {
    nodeId: string;
    globalState: Record<string, any>;
    metadata: Record<string, any>;
}

export interface WorkflowNode {
    readonly id: string;
    readonly dependencies: string[]; // List of parent node IDs that must complete first

    execute(ctx: NodeContext): Promise<any>;
}
```

---

## 7. Global State Context Transmission

To pass data across nodes securely, workflows maintain a shared **Global State Context**.

### 7.1 State Mutator Rules

- **Thread Isolation**: The global state is unique to a single workflow execution, isolated from parallel runs.
- **Immutability Principle**: Nodes write results to new state keys, preventing concurrent mutation bugs.
- **Memory Safety**: Global state parameters are kept in memory and garbage-collected once the workflow completes.

---

## 8. Glossary

- **Compound AI System**: An AI architecture that coordinates multiple distinct components (e.g. prompts, databases, APIs) to achieve goals.
- **DAG**: Directed Acyclic Graph, a finite directed graph with no directed cycles, used to model execution dependencies.
- **Agent Loop**: An autonomous execution cycle where an AI system iteratively processes thoughts, actions, and observations to complete tasks.
- **Halting Invariant**: A safety condition that triggers immediate termination of an execution loop to prevent infinite runs or excessive costs.
- **Node**: A single, modular task or execution step within a larger workflow graph.
