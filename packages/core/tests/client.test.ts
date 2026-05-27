import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { Vectrion } from "../src/client.js";
import {
    ProviderAdapter,
    RequestContext,
    NormalizedResponse,
} from "@vectrion/types";
import { VectrionValidationError } from "@vectrion/shared";

// Test mock provider adapters
class SuccessMockAdapter implements ProviderAdapter {
    public readonly providerId = "success-mock";
    public readonly capabilities = {};
    public async initialize(): Promise<void> {}
    public async execute(ctx: RequestContext): Promise<NormalizedResponse> {
        return {
            id: "test-1",
            text: '{"status": "success", "data": "correct-payload"}',
            model: ctx.request.model,
            provider: this.providerId,
            usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            cost: { inputCostUsd: 0, outputCostUsd: 0, totalCostUsd: 0 },
            latencyMs: 10,
            rawResponse: {},
        };
    }
}

class FailureMockAdapter implements ProviderAdapter {
    public readonly providerId = "failure-mock";
    public readonly capabilities = {};
    public async initialize(): Promise<void> {}
    public async execute(): Promise<NormalizedResponse> {
        throw new Error("Simulation provider execution failure.");
    }
}

describe("Vectrion Core Orchestrator & Middleware Onion Tests", () => {
    it("should successfully execute prompt and return clean model text", async () => {
        const ai = new Vectrion({
            providers: [new SuccessMockAdapter()],
        });

        const result = await ai.generate({
            model: "test-model",
            prompt: "Test prompt contents",
        });

        expect(result.data).toContain("success");
        expect(result.response.provider).toBe("success-mock");
    });

    it("should trigger double-pass onion middleware pre and post hooks correctly", async () => {
        const ai = new Vectrion({
            providers: [new SuccessMockAdapter()],
        });

        const preHook = vi.fn();
        const postHook = vi.fn();

        ai.use(async (ctx, next) => {
            preHook();
            expect(ctx.request.prompt).toBe("Onion test prompt");
            expect(ctx.response).toBeUndefined();
            await next();
            postHook();
            expect(ctx.response).toBeDefined();
            expect(ctx.response?.provider).toBe("success-mock");
        });

        await ai.generate({
            model: "test-model",
            prompt: "Onion test prompt",
        });

        expect(preHook).toHaveBeenCalledOnce();
        expect(postHook).toHaveBeenCalledOnce();
    });

    it("should successfully route to secondary provider if primary provider throws exception", async () => {
        const ai = new Vectrion({
            providers: [new FailureMockAdapter(), new SuccessMockAdapter()],
        });

        const result = await ai.generate({
            model: "test-model",
            prompt: "Failover testing prompt",
        });

        expect(result.data).toContain("correct-payload");
        expect(result.response.provider).toBe("success-mock");
    });

    it("should successfully validate and parse response conforming to requested Zod Schema", async () => {
        const ai = new Vectrion({
            providers: [new SuccessMockAdapter()],
        });

        const schema = z.object({
            status: z.string(),
            data: z.string(),
        });

        const result = await ai.generate({
            model: "test-model",
            prompt: "Structured validation test prompt",
            schema,
        });

        expect(result.data.status).toBe("success");
        expect(result.data.data).toBe("correct-payload");
    });

    it("should throw VectrionValidationError if response text is invalid JSON format", async () => {
        class MalformedMockAdapter implements ProviderAdapter {
            public readonly providerId = "malformed-mock";
            public readonly capabilities = {};
            public async initialize(): Promise<void> {}
            public async execute(
                ctx: RequestContext,
            ): Promise<NormalizedResponse> {
                return {
                    id: "test-2",
                    text: "This is not valid JSON string",
                    model: ctx.request.model,
                    provider: this.providerId,
                    usage: {
                        promptTokens: 5,
                        completionTokens: 5,
                        totalTokens: 10,
                    },
                    cost: {
                        inputCostUsd: 0,
                        outputCostUsd: 0,
                        totalCostUsd: 0,
                    },
                    latencyMs: 5,
                    rawResponse: {},
                };
            }
        }

        const ai = new Vectrion({
            providers: [new MalformedMockAdapter()],
        });

        const schema = z.object({
            status: z.string(),
        });

        await expect(
            ai.generate({
                model: "test-model",
                prompt: "Invalid JSON test prompt",
                schema,
            }),
        ).rejects.toThrow(VectrionValidationError);
    });
});
