/* ============================================
   VECTRION DOCS — APPLICATION ENGINE
   ============================================ */

import "./style.css";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import yaml from "highlight.js/lib/languages/yaml";
import diff from "highlight.js/lib/languages/diff";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";

// Import raw markdown from the monorepo docs/ directory
import d01Content from "@docs/architecture/D01-product-vision.md?raw";
import d02Content from "@docs/architecture/D02-system-architecture-overview.md?raw";
import d03Content from "@docs/architecture/D03-monorepo-structure.md?raw";
import d04Content from "@docs/architecture/D04-runtime-lifecycle.md?raw";
import d05Content from "@docs/architecture/D05-provider-adapter.md?raw";
import d06Content from "@docs/architecture/D06-middleware-architecture.md?raw";
import d07Content from "@docs/architecture/D07-router-engine.md?raw";
import d08Content from "@docs/architecture/D08-sdk-api-surface.md?raw";
import d09Content from "@docs/architecture/D09-observability-pipeline.md?raw";
import d10Content from "@docs/architecture/D10-guardrails-validation.md?raw";
import d11Content from "@docs/architecture/D11-token-cost-tracking.md?raw";
import d12Content from "@docs/architecture/D12-memory-system-design.md?raw";
import d13Content from "@docs/architecture/D13-workflow-orchestration.md?raw";
import d14Content from "@docs/architecture/D14-plugin-system.md?raw";
import d15Content from "@docs/architecture/D15-developer-experience.md?raw";
import d16Content from "@docs/architecture/D16-testing-strategy.md?raw";
import d17Content from "@docs/architecture/D17-build-release-cicd.md?raw";
import d18Content from "@docs/architecture/D18-performance-strategy.md?raw";
import d19Content from "@docs/architecture/D19-security-philosophy.md?raw";
import d20Content from "@docs/architecture/D20-semver-api-stability.md?raw";
import d21Content from "@docs/architecture/D21-contribution-guidelines.md?raw";
import d22Content from "@docs/architecture/D22-governance-model.md?raw";
import d23Content from "@docs/architecture/D23-future-scalability.md?raw";
import d24Content from "@docs/architecture/D24-roadmap.md?raw";
import d25Content from "@docs/architecture/D25-rfc-index.md?raw";

/* ── Register highlight.js languages ────── */
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);

/* ── Document Registry ──────────────────── */
const DOCS = [
    // Tier 0: Foundation
    {
        id: "d01",
        code: "D01",
        title: "Product Vision & Infrastructure Philosophy",
        tier: "Tier 0 — Foundation",
        category: "architecture",
        status: "draft",
        priority: "P0",
        content: d01Content,
    },
    {
        id: "d02",
        code: "D02",
        title: "System Architecture Overview",
        tier: "Tier 0 — Foundation",
        category: "architecture",
        status: "draft",
        priority: "P0",
        content: d02Content,
    },
    {
        id: "d03",
        code: "D03",
        title: "Monorepo Structure & Package Boundaries",
        tier: "Tier 0 — Foundation",
        category: "architecture",
        status: "draft",
        priority: "P0",
        content: d03Content,
    },

    // Tier 1: Core Architecture
    {
        id: "d04",
        code: "D04",
        title: "Runtime Lifecycle Specification",
        tier: "Tier 1 — Core Architecture",
        category: "architecture",
        status: "draft",
        priority: "P1",
        content: d04Content,
    },
    {
        id: "d05",
        code: "D05",
        title: "Provider Adapter System Design",
        tier: "Tier 1 — Core Architecture",
        category: "rfcs",
        status: "draft",
        priority: "P1",
        content: d05Content,
    },
    {
        id: "d06",
        code: "D06",
        title: "Middleware Architecture RFC",
        tier: "Tier 1 — Core Architecture",
        category: "rfcs",
        status: "draft",
        priority: "P1",
        content: d06Content,
    },
    {
        id: "d07",
        code: "D07",
        title: "Router Engine Specification",
        tier: "Tier 1 — Core Architecture",
        category: "rfcs",
        status: "draft",
        priority: "P1",
        content: d07Content,
    },
    {
        id: "d08",
        code: "D08",
        title: "SDK API Surface Specification",
        tier: "Tier 1 — Core Architecture",
        category: "api",
        status: "draft",
        priority: "P1",
        content: d08Content,
    },

    // Tier 2: Subsystem Design
    {
        id: "d09",
        code: "D09",
        title: "Observability Pipeline Design",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d09Content,
    },
    {
        id: "d10",
        code: "D10",
        title: "Guardrails & Validation System Design",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d10Content,
    },
    {
        id: "d11",
        code: "D11",
        title: "Token & Cost Tracking System",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d11Content,
    },
    {
        id: "d12",
        code: "D12",
        title: "Memory System Design",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d12Content,
    },
    {
        id: "d13",
        code: "D13",
        title: "Workflow Orchestration Design",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d13Content,
    },
    {
        id: "d14",
        code: "D14",
        title: "Plugin & Extensibility System Design",
        tier: "Tier 2 — Subsystem Design",
        category: "rfcs",
        status: "draft",
        priority: "P2",
        content: d14Content,
    },

    // Tier 3: Engineering Standards
    {
        id: "d15",
        code: "D15",
        title: "Developer Experience Standards",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d15Content,
    },
    {
        id: "d16",
        code: "D16",
        title: "Testing Strategy & Quality Architecture",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d16Content,
    },
    {
        id: "d17",
        code: "D17",
        title: "Build, Release & CI/CD Architecture",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d17Content,
    },
    {
        id: "d18",
        code: "D18",
        title: "Performance Strategy & Budgets",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d18Content,
    },
    {
        id: "d19",
        code: "D19",
        title: "Security Philosophy & Threat Model",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d19Content,
    },
    {
        id: "d20",
        code: "D20",
        title: "Semantic Versioning & API Stability",
        tier: "Tier 3 — Engineering Standards",
        category: "standards",
        status: "draft",
        priority: "P3",
        content: d20Content,
    },

    // Tier 4: Governance & Roadmap
    {
        id: "d21",
        code: "D21",
        title: "Contribution Guidelines",
        tier: "Tier 4 — Governance & Roadmap",
        category: "governance",
        status: "draft",
        priority: "P3",
        content: d21Content,
    },
    {
        id: "d22",
        code: "D22",
        title: "Open Source Governance Model",
        tier: "Tier 4 — Governance & Roadmap",
        category: "governance",
        status: "draft",
        priority: "P3",
        content: d22Content,
    },
    {
        id: "d23",
        code: "D23",
        title: "Future Scalability & Platform Evolution",
        tier: "Tier 4 — Governance & Roadmap",
        category: "architecture",
        status: "draft",
        priority: "P3",
        content: d23Content,
    },
    {
        id: "d24",
        code: "D24",
        title: "Roadmap — Phased Delivery Plan",
        tier: "Tier 4 — Governance & Roadmap",
        category: "roadmap",
        status: "draft",
        priority: "P3",
        content: d24Content,
    },
    {
        id: "d25",
        code: "D25",
        title: "Package-Level RFC Index",
        tier: "Tier 4 — Governance & Roadmap",
        category: "rfcs",
        status: "draft",
        priority: "P3",
        content: d25Content,
    },
];

const CATEGORIES = [
    {
        id: "architecture",
        icon: "🏗️",
        title: "Architecture",
        desc: "System design, component diagrams, and foundational decisions",
    },
    {
        id: "rfcs",
        icon: "📋",
        title: "RFCs & Specifications",
        desc: "Detailed subsystem designs and package-level specifications",
    },
    {
        id: "api",
        icon: "⚡",
        title: "API Reference",
        desc: "SDK surface specification, types, and interface contracts",
    },
    {
        id: "standards",
        icon: "📐",
        title: "Engineering Standards",
        desc: "Testing, build, performance, security, and DX standards",
    },
    {
        id: "governance",
        icon: "🏛️",
        title: "Governance",
        desc: "Contribution guidelines, open-source model, and community",
    },
    {
        id: "roadmap",
        icon: "🗺️",
        title: "Roadmap",
        desc: "Phased delivery plan and future vision",
    },
];

/* ── Configure Marked ───────────────────── */
const renderer = {
    heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const cleanText = text.replace(/<[^>]*>/g, "");
        const id = cleanText
            .toLowerCase()
            .replace(/[^\w\s-]+/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
        return `<h${depth} id="${id}"><a class="heading-anchor" href="#${id}">#</a>${text}</h${depth}>`;
    },

    code({ text, lang }) {
        // Handle mermaid diagrams
        if (lang === "mermaid") {
            return `<div class="mermaid-block"><p>📊 Mermaid diagram — view in a Mermaid-compatible renderer</p><pre style="text-align:left;font-size:12px;color:var(--text-muted);margin-top:12px;"><code>${escapeHtml(text)}</code></pre></div>`;
        }

        let highlighted = escapeHtml(text);
        const langLabel = lang || "";
        if (lang && hljs.getLanguage(lang)) {
            try {
                highlighted = hljs.highlight(text, {
                    language: lang,
                    ignoreIllegals: true,
                }).value;
            } catch (_) {
                /* fallback to escaped */
            }
        }

        const badge = langLabel
            ? `<span class="code-lang-badge">${langLabel}</span>`
            : "";
        return `<pre>${badge}<code class="hljs${lang ? ` language-${lang}` : ""}">${highlighted}</code></pre>`;
    },

    blockquote({ tokens }) {
        const inner = this.parser.parse(tokens);

        // Detect GitHub-style alerts: > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING], > [!CAUTION]
        // marked v18 produces: <p>[!TYPE]\nContent</p>  or  <p>[!TYPE]<br>Content</p>  or  <p>[!TYPE]</p>
        const alertMatch =
            inner.match(
                /^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>|\n)/i,
            ) ||
            inner.match(
                /^\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]<\/p>/i,
            );

        if (alertMatch) {
            const type = alertMatch[1].toLowerCase();
            const icons = {
                note: "ℹ️",
                tip: "💡",
                important: "⚠️",
                warning: "⚡",
                caution: "🔴",
            };
            const cleanContent = inner.replace(alertMatch[0], "<p>");
            return `<div class="alert ${type}"><div class="alert-title">${icons[type] || ""} ${alertMatch[1]}</div>${cleanContent}</div>`;
        }

        return `<blockquote>${inner}</blockquote>`;
    },
};

marked.use({ renderer, breaks: false, gfm: true });

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/* ── DOM References ─────────────────────── */
const mainContent = document.getElementById("mainContent");
const sidebarNav = document.getElementById("sidebarNav");
const tocNav = document.getElementById("tocNav");
const tocPanel = document.getElementById("tocPanel");
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const readingProgress = document.getElementById("readingProgress");
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

/* ── State ──────────────────────────────── */
let currentDocId = null;

/* ── Build Sidebar ──────────────────────── */
function buildSidebar() {
    const tiers = {};
    for (const doc of DOCS) {
        if (!tiers[doc.tier]) tiers[doc.tier] = [];
        tiers[doc.tier].push(doc);
    }

    let html = "";
    for (const [tier, docs] of Object.entries(tiers)) {
        html += `
      <div class="sidebar-section" data-tier="${tier}">
        <div class="sidebar-section-title" onclick="this.parentElement.classList.toggle('collapsed')">
          <span>${tier}</span>
          <span class="chevron">▼</span>
        </div>
        <ul class="sidebar-section-items">
          ${docs
              .map(
                  (doc) => `
            <li class="sidebar-item">
              <a class="sidebar-link" data-doc="${doc.id}" onclick="window.navigateTo('${doc.id}')">
                <span class="doc-id">${doc.code}</span>
                <span class="doc-label">${doc.title}</span>
                <span class="status-dot ${doc.status}"></span>
              </a>
            </li>
          `,
              )
              .join("")}
        </ul>
      </div>`;
    }

    sidebarNav.innerHTML = html;
}

/* ── Render Homepage ────────────────────── */
function renderHomepage() {
    currentDocId = null;
    tocPanel.style.display = "none";
    tocNav.innerHTML = "";
    updateActiveSidebarLink(null);

    const completedCount = DOCS.filter((d) => d.status === "complete").length;
    const draftCount = DOCS.filter((d) => d.status === "draft").length;

    mainContent.innerHTML = `
    <div class="homepage">
      <div class="hero">
        <div class="hero-badge"><span class="pulse"></span> Documentation-First Development</div>
        <h1>
          <span class="gradient-text">Vectrion</span> Architecture<br/>Documentation
        </h1>
        <p class="hero-subtitle">
          Production-grade engineering documentation for Vectrion — a modular TypeScript runtime infrastructure SDK for AI applications.
          Architecture specs, RFCs, and system design documents.
        </p>
        <div class="hero-actions">
          <a class="btn btn-primary" onclick="window.navigateTo('d01')">
            Start Reading →
          </a>
          <a class="btn btn-secondary" href="https://github.com" target="_blank">
            View Source
          </a>
        </div>
      </div>

      <div class="stats-bar">
        <div class="stat">
          <div class="stat-value">${DOCS.length}</div>
          <div class="stat-label">Documents</div>
        </div>
        <div class="stat">
          <div class="stat-value">5</div>
          <div class="stat-label">Tiers</div>
        </div>
        <div class="stat">
          <div class="stat-value">${draftCount + completedCount}</div>
          <div class="stat-label">In Progress</div>
        </div>
        <div class="stat">
          <div class="stat-value">7</div>
          <div class="stat-label">Packages</div>
        </div>
      </div>

      <div class="categories-title">Browse by Category</div>
      <div class="category-grid">
        ${CATEGORIES.map((cat) => {
            const catDocs = DOCS.filter((d) => d.category === cat.id);
            const firstDoc = catDocs.find((d) => d.content) || catDocs[0];
            return `
            <div class="category-card" onclick="window.navigateTo('${firstDoc?.id || "d01"}')">
              <span class="card-icon">${cat.icon}</span>
              <div class="card-title">${cat.title}</div>
              <div class="card-desc">${cat.desc}</div>
              <span class="card-count">${catDocs.length} doc${catDocs.length !== 1 ? "s" : ""}</span>
            </div>`;
        }).join("")}
      </div>
    </div>`;
}

/* ── Render Document ────────────────────── */
function renderDocument(docId) {
    const doc = DOCS.find((d) => d.id === docId);
    if (!doc) {
        renderHomepage();
        return;
    }

    currentDocId = docId;
    updateActiveSidebarLink(docId);

    if (!doc.content) {
        tocPanel.style.display = "none";
        tocNav.innerHTML = "";
        mainContent.innerHTML = `
      <div class="coming-soon">
        <div class="cs-icon">📄</div>
        <h2>${doc.code} — ${doc.title}</h2>
        <p>This document is currently in the planning phase. It will be authored according to the documentation roadmap dependency order.</p>
        <span class="cs-badge">${doc.status === "draft" ? "✏️ Draft" : "📌 Planned"}</span>
      </div>`;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    // Parse and render markdown
    const html = marked.parse(doc.content);

    const categoryLabel =
        CATEGORIES.find((c) => c.id === doc.category)?.title || doc.category;

    mainContent.innerHTML = `
    <div class="doc-view">
      <div class="doc-header">
        <div class="doc-breadcrumb">
          <a onclick="window.navigateTo(null)">Docs</a>
          <span class="sep">›</span>
          <span>${categoryLabel}</span>
          <span class="sep">›</span>
          <span>${doc.code}</span>
        </div>
        <div class="doc-meta">
          <span class="meta-tag tier">${doc.tier}</span>
          <span class="meta-tag priority-${doc.priority.toLowerCase()}">${doc.priority}</span>
          <span class="meta-tag status-${doc.status}">${doc.status === "draft" ? "✏️ Draft" : doc.status === "complete" ? "✅ Complete" : "📌 Planned"}</span>
        </div>
        <h1 class="doc-title">${doc.code} — ${doc.title}</h1>
      </div>
      <div class="markdown-body">${html}</div>
    </div>`;

    // Build TOC from rendered headings
    buildTOC();
    tocPanel.style.display = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ── Build Table of Contents ────────────── */
function buildTOC() {
    const headings = mainContent.querySelectorAll(
        ".markdown-body h2, .markdown-body h3",
    );
    if (headings.length === 0) {
        tocNav.innerHTML =
            '<span style="font-size:12px;color:var(--text-muted);">No sections</span>';
        return;
    }

    let html = "";
    for (const h of headings) {
        const depth = parseInt(h.tagName[1]);
        const text = h.textContent.replace(/^#\s*/, "");
        const id = h.id;
        html += `<a class="toc-link" data-depth="${depth}" href="#${id}" onclick="scrollToSection(event, '${id}')">${text}</a>`;
    }
    tocNav.innerHTML = html;
}

/* ── Scroll to Section ──────────────────── */
window.scrollToSection = function (e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: "smooth" });
    }
};

/* ── Update Active Sidebar Link ─────────── */
function updateActiveSidebarLink(docId) {
    document.querySelectorAll(".sidebar-link").forEach((el) => {
        el.classList.toggle("active", el.dataset.doc === docId);
    });
}

/* ── Hash-Based Navigation ──────────────── */
window.navigateTo = function (docId) {
    if (docId) {
        window.location.hash = `#/docs/${docId}`;
    } else {
        window.location.hash = "#/";
    }
    // Close mobile sidebar
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
};

function handleRoute() {
    const hash = window.location.hash || "#/";
    const match = hash.match(/^#\/docs\/(\w+)/);
    if (match) {
        renderDocument(match[1]);
    } else {
        renderHomepage();
    }
}

window.addEventListener("hashchange", handleRoute);

/* ── Search ─────────────────────────────── */
function performSearch(query) {
    if (!query || query.length < 2) {
        searchResults.classList.remove("active");
        return;
    }

    const q = query.toLowerCase();
    const results = DOCS.filter((doc) => {
        return (
            doc.title.toLowerCase().includes(q) ||
            doc.code.toLowerCase().includes(q) ||
            doc.tier.toLowerCase().includes(q) ||
            doc.category.toLowerCase().includes(q) ||
            (doc.content && doc.content.toLowerCase().includes(q))
        );
    }).slice(0, 8);

    if (results.length === 0) {
        searchResults.innerHTML =
            '<div class="search-result-item"><span class="result-title">No results found</span></div>';
    } else {
        searchResults.innerHTML = results
            .map((doc) => {
                const cat =
                    CATEGORIES.find((c) => c.id === doc.category)?.title ||
                    doc.category;
                return `
        <div class="search-result-item" onclick="window.navigateTo('${doc.id}'); searchInput.value = ''; searchResults.classList.remove('active');">
          <div class="result-title">${doc.code} — ${doc.title}</div>
          <div class="result-category">${cat} · ${doc.status}</div>
        </div>`;
            })
            .join("");
    }
    searchResults.classList.add("active");
}

searchInput.addEventListener("input", (e) => performSearch(e.target.value));
searchInput.addEventListener("focus", () => {
    if (searchInput.value.length >= 2) searchResults.classList.add("active");
});
document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-container"))
        searchResults.classList.remove("active");
});

// Cmd+K shortcut
document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    if (e.key === "Escape") {
        searchResults.classList.remove("active");
        searchInput.blur();
    }
});

/* ── Reading Progress ───────────────────── */
function updateReadingProgress() {
    const scrollTop = window.scrollY;
    const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    readingProgress.style.width = `${Math.min(progress, 100)}%`;
}

/* ── TOC Scroll Spy ─────────────────────── */
function updateTOCActive() {
    const headings = mainContent.querySelectorAll(
        ".markdown-body h2, .markdown-body h3",
    );
    const tocLinks = tocNav.querySelectorAll(".toc-link");
    if (headings.length === 0 || tocLinks.length === 0) return;

    let activeId = "";
    for (const h of headings) {
        const rect = h.getBoundingClientRect();
        if (rect.top <= 100) {
            activeId = h.id;
        }
    }

    tocLinks.forEach((link) => {
        link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${activeId}`,
        );
    });
}

window.addEventListener(
    "scroll",
    () => {
        updateReadingProgress();
        updateTOCActive();
    },
    { passive: true },
);

/* ── Mobile Menu ────────────────────────── */
mobileMenuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    sidebarOverlay.classList.toggle("active");
});
sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
});

/* ── Initialize ─────────────────────────── */
buildSidebar();
handleRoute();
