# D19 — Security Philosophy & Threat Model

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D19                                                                                                                                           |
| **Title**        | Security Philosophy & Threat Model                                                                                                            |
| **Tier**         | Tier 3 — Engineering Standards                                                                                                                |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D05, D06, D10                                                                                                                            |
| **Audience**     | Core Contributors, Security Reviewers, Platform Operators                                                                                     |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

Vectrion is an infrastructure SDK that processes, routes, and validates AI model interactions. It sits between application code and external AI provider APIs, handling sensitive data including user prompts, model responses, API credentials, and usage telemetry. This document defines the security philosophy, threat model, and mitigation strategies for the Vectrion runtime.

---

## 2. Security Philosophy

### 2.1 Principles

1. **Zero Trust of Provider Responses**: All data returned from provider APIs is treated as untrusted input. Zod schema validation is not just a convenience — it is a security boundary.
2. **Minimal Attack Surface**: The SDK exposes the smallest possible API surface. No HTTP servers, no persistent connections, no file system writes outside explicit observability paths.
3. **Secrets Never in Code**: API keys and credentials are injected via environment variables or constructor configuration, never hardcoded or logged.
4. **Defense in Depth**: Multiple independent security layers (guardrails, validation, provider isolation) protect against cascading failures.
5. **Fail Closed**: When a security check fails, the request is rejected — never silently passed through.

---

## 3. Threat Model

### 3.1 Trust Boundaries

```
┌──────────────────────────────────────────────┐
│                Application Code               │  ← TRUSTED
├──────────────────────────────────────────────┤
│              Vectrion SDK Runtime              │  ← TRUSTED (this codebase)
│  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
│  │Guardrail│  │Middleware │  │  Router    │  │
│  │ Layer   │  │ Pipeline  │  │  Engine    │  │
│  └─────────┘  └──────────┘  └────────────┘  │
├──────────────────────────────────────────────┤
│           Provider Adapter Boundary           │  ← TRUST BOUNDARY
├──────────────────────────────────────────────┤
│          External AI Provider APIs            │  ← UNTRUSTED
│     (Google AI, Ollama, OpenAI, etc.)         │
└──────────────────────────────────────────────┘
```

### 3.2 Threat Categories

| ID    | Threat                            | Category       | Severity | Mitigation                                           |
| ----- | --------------------------------- | -------------- | -------- | ---------------------------------------------------- |
| T-01  | Prompt injection attacks          | Input          | High     | `@vectrion/guard` regex + heuristic detection        |
| T-02  | API key leakage in logs/traces    | Credential     | Critical | Key masking in observability, no key in error msgs   |
| T-03  | Malformed provider response       | Response       | Medium   | Zod validation, JSON parse safety                    |
| T-04  | Provider response data exfil      | Response       | Medium   | Schema validation limits response shape              |
| T-05  | Denial of service via large resp  | Availability   | Medium   | Response size limits, timeout configuration          |
| T-06  | Middleware code execution         | Extension      | High     | Middleware runs in-process; code review required      |
| T-07  | Supply chain (dependency) attack  | Dependency     | High     | Minimal deps, lockfile integrity, audit CI step      |
| T-08  | Cost runaway (token exhaustion)   | Financial      | Medium   | Token/cost tracking, configurable budgets            |

---

## 4. Mitigation Details

### 4.1 T-01: Prompt Injection Defense

The `@vectrion/guard` package provides a middleware-based prompt injection filter:

```typescript
import { promptInjectionGuard } from '@vectrion/guard';

ai.use(promptInjectionGuard());
```

**Detection Patterns**:
- System instruction override attempts: `"ignore all previous instructions"`
- Role injection: `"you are now a different AI"`
- Delimiter injection: `"###SYSTEM###"`, `"<|endoftext|>"`
- Encoding evasion: Base64-encoded malicious payloads

> [!WARNING]
> Regex-based detection is not a complete defense against prompt injection. It provides a first layer of protection. Production applications should combine this with provider-side safety filters and application-level validation.

### 4.2 T-02: API Key Protection

```typescript
// Keys are NEVER logged, traced, or included in error messages
class GoogleProviderAdapter {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    // Key is stored in private field, never serialized
  }

  // Error messages mask the key
  private buildError(msg: string): VectrionProviderError {
    return new VectrionProviderError(msg, this.providerId);
    // Does NOT include: this.apiKey, request headers, or auth tokens
  }
}
```

**Observability masking**: The `observabilityMiddleware` MUST NOT trace request headers, API keys, or auth tokens.

### 4.3 T-03: Response Validation

All provider responses are validated against the `NormalizedResponse` interface before entering the middleware pipeline:

```typescript
// Response shape is enforced at the adapter boundary
const response: NormalizedResponse = {
  id: string,        // Required
  text: string,      // Required — raw text
  model: string,     // Required
  provider: string,  // Required
  usage: { ... },    // Required — token counts
  cost: { ... },     // Required — cost attribution
  latencyMs: number, // Required
  rawResponse: any,  // Optional — raw provider data
};
```

### 4.4 T-07: Supply Chain Security

- `@vectrion/core` has **zero external runtime dependencies** (only workspace packages)
- All packages use `pnpm` with `--frozen-lockfile` in CI
- `pnpm audit` runs as a CI gate
- New dependencies require explicit review and justification (see D18 import cost policy)

---

## 5. Security Checklist for Contributors

- [ ] No API keys, tokens, or secrets in source code
- [ ] No `console.log` of sensitive request/response data
- [ ] All provider responses validated before use
- [ ] Error messages do not leak internal state
- [ ] New dependencies justified and audited
- [ ] Prompt guard patterns updated if new injection vectors identified
- [ ] Observability traces exclude auth headers and raw request bodies

---

## 6. References

| Reference | Link |
| --------- | ---- |
| OWASP LLM Top 10 | https://owasp.org/www-project-top-10-for-large-language-model-applications/ |
| D05 — Provider Adapter System | Internal |
| D10 — Guardrails & Validation | Internal |
| D11 — Token & Cost Tracking | Internal |
