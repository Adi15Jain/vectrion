# D22 — Open Source Governance Model

| Field            | Value                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Document ID**  | D22                                                                                                                                           |
| **Title**        | Open Source Governance Model                                                                                                                  |
| **Tier**         | Tier 4 — Governance & Roadmap                                                                                                                 |
| **Priority**     | P3                                                                                                                                            |
| **Status**       | Draft                                                                                                                                         |
| **Dependencies** | D01, D21                                                                                                                                      |
| **Audience**     | Community Members, Potential Contributors, Maintainers                                                                                        |
| **Last Updated** | 2026-05-28                                                                                                                                    |

---

## 1. Executive Summary

This document establishes the governance model for the Vectrion open-source project. It defines roles, decision-making processes, and the organizational structure that ensures the project evolves sustainably while maintaining its core architectural principles.

---

## 2. License

Vectrion is released under the **MIT License**. This grants users the freedom to use, modify, and distribute the SDK in both open-source and commercial applications without restriction.

---

## 3. Governance Structure

### 3.1 Roles

| Role                | Count     | Responsibilities                                                    |
| ------------------- | --------- | ------------------------------------------------------------------- |
| **Project Lead**    | 1         | Final authority on architecture, roadmap, and breaking changes       |
| **Core Maintainer** | 2–5       | PR review, release management, issue triage                          |
| **Package Owner**   | 1 per pkg | Domain expertise for a specific `@vectrion/*` package                |
| **Contributor**     | Unlimited | Submit PRs, report issues, participate in discussions                 |
| **Community Member**| Unlimited | Use the SDK, provide feedback, participate in discussions             |

### 3.2 Decision-Making Model

Vectrion uses a **Benevolent Dictator** governance model during the pre-1.0 phase:

1. **Architectural Decisions**: Made by the Project Lead, informed by RFCs and community feedback
2. **Feature Additions**: Decided by Core Maintainers through PR review consensus
3. **Bug Fixes**: Any Core Maintainer can approve and merge
4. **Breaking Changes**: Require Project Lead approval + RFC document

### 3.3 Path to Maintainer

```
Contributor → Trusted Contributor → Core Maintainer

Requirements for Trusted Contributor:
  - 5+ merged PRs
  - Demonstrated understanding of the codebase
  - Consistent code quality
  - Active in issue discussions

Requirements for Core Maintainer:
  - 20+ merged PRs
  - Demonstrated architectural judgment
  - Nominated by existing Core Maintainer
  - Approved by Project Lead
```

---

## 4. RFC Process

Significant changes require a **Request for Comments (RFC)** document:

### 4.1 When an RFC Is Required

- New packages in the monorepo
- Changes to core interfaces (`ProviderAdapter`, `Middleware`, `RouterEngine`)
- New pipeline stages or lifecycle phases
- Breaking changes to the public API
- Significant dependency additions

### 4.2 RFC Lifecycle

```
1. DRAFT     ← Author creates RFC in docs/rfcs/
2. REVIEW    ← Open for community feedback (minimum 7 days)
3. ACCEPTED  ← Approved by Core Maintainers
4. IMPLEMENTED ← Code changes merged
5. CLOSED    ← Rejected or withdrawn
```

### 4.3 RFC Template

```markdown
# RFC-XXXX: <Title>

## Summary
One-paragraph description.

## Motivation
Why is this change needed?

## Detailed Design
Technical specification of the proposed change.

## Alternatives Considered
What other approaches were evaluated?

## Migration Impact
How does this affect existing consumers?

## Open Questions
Unresolved design decisions.
```

---

## 5. Release Authority

| Release Type   | Authority                | Process                                    |
| -------------- | ------------------------ | ------------------------------------------ |
| Patch release  | Any Core Maintainer      | Tag + publish                              |
| Minor release  | Core Maintainer + Lead   | Changelog review + tag + publish           |
| Major release  | Project Lead             | Migration guide + changelog + announcement |
| Pre-release    | Any Core Maintainer      | Tag with `-alpha` or `-beta` suffix        |

---

## 6. Code of Conduct

Vectrion adopts the **Contributor Covenant Code of Conduct** (v2.1). All participants are expected to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

Violations should be reported to the Project Lead. All complaints will be reviewed and investigated.

---

## 7. Communication Channels

| Channel         | Purpose                              | Platform       |
| --------------- | ------------------------------------ | -------------- |
| GitHub Issues   | Bug reports, feature requests        | GitHub         |
| GitHub Discuss  | Architecture discussions, Q&A       | GitHub         |
| Pull Requests   | Code review, implementation details  | GitHub         |
| RFC Documents   | Design proposals                     | `docs/rfcs/`   |

---

## 8. Post-1.0 Governance Evolution

After reaching `1.0.0`, the governance model will evolve toward a **Technical Steering Committee (TSC)** model:

- The TSC will consist of 3–5 members elected from Core Maintainers
- Architectural decisions will require TSC majority vote
- The Project Lead role may be rotated annually
- A formal sponsorship model may be introduced for sustainability

---

## 9. References

| Reference | Link |
| --------- | ---- |
| Contributor Covenant | https://www.contributor-covenant.org/version/2/1/code_of_conduct/ |
| Node.js Governance | https://github.com/nodejs/node/blob/main/GOVERNANCE.md |
| D01 — Product Vision | Internal |
| D21 — Contribution Guidelines | Internal |
