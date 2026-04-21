"use client";

import Link from "next/link";
import { useState } from "react";
import { IMPORT_WIZARD_STEPS } from "@/features/imports/constants";
import type { ImportTemplate } from "@/features/imports/types";

interface ImportWizardProps {
  templates: ImportTemplate[];
}

interface UploadResult {
  importFileId: string;
  criticalErrors: string[];
  warnings: string[];
  rowCount: number;
  rowsWithErrors: number;
  rowsWithWarnings: number;
  duplicateRows: number;
  status: string;
  reusedExisting?: boolean;
}

export function ImportWizard({ templates }: ImportWizardProps) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [sourceMonth, setSourceMonth] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || !templateId || !sourceMonth) {
      setError("Template, source month and file are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.set("templateId", templateId);
    formData.set("sourceMonth", `${sourceMonth}-01`);
    formData.set("file", file);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as UploadResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Import failed.");
      }

      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Import failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <section className="hero-card">
        <p className="eyebrow">Import wizard</p>
        <h1 className="title">Stage monthly deals before consolidation</h1>
        <p className="subtitle" style={{ maxWidth: 780 }}>
          This flow uploads the source file to Storage, validates structure,
          parses rows, normalizes financier aliases, detects duplicates and
          stages everything in `raw_deal_rows` so approved rows can later be
          consolidated into `deals`.
        </p>
        <div className="table-actions" style={{ marginTop: 18 }}>
          <Link
            className="ghost-button"
            download
            href="/floorplan-default-example.csv"
          >
            Download example CSV
          </Link>
        </div>
        <div className="wizard-steps">
          {IMPORT_WIZARD_STEPS.map((step, index) => (
            <div key={step} className="wizard-step">
              <span className="wizard-index">{index + 1}</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <form className="import-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Template</span>
            <select
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Source month</span>
            <input
              type="month"
              value={sourceMonth}
              onChange={(event) => setSourceMonth(event.target.value)}
            />
          </label>

          <label className="field">
            <span>File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="action-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Processing..." : "Upload and stage file"}
            </button>
            {error && <span className="error-text">{error}</span>}
          </div>
        </form>
      </section>

      {result && (
        <section className="panel">
          <p className="eyebrow">Import result</p>
          <h2 style={{ marginTop: 0 }}>Batch created</h2>
          <div className="grid four">
            <div className="stat-card">
              <p className="eyebrow">Status</p>
              <h3 style={{ margin: 0 }}>{result.status}</h3>
            </div>
            <div className="stat-card">
              <p className="eyebrow">Rows</p>
              <h3 style={{ margin: 0 }}>{result.rowCount}</h3>
            </div>
            <div className="stat-card">
              <p className="eyebrow">Errors</p>
              <h3 style={{ margin: 0 }}>{result.rowsWithErrors}</h3>
            </div>
            <div className="stat-card">
              <p className="eyebrow">Duplicates</p>
              <h3 style={{ margin: 0 }}>{result.duplicateRows}</h3>
            </div>
          </div>

          {result.reusedExisting && (
            <p className="muted" style={{ marginTop: 16, marginBottom: 0 }}>
              This exact file was already uploaded for the selected month. Reusing the
              existing review batch instead of creating a duplicate.
            </p>
          )}

          {result.criticalErrors.length > 0 && (
            <ul className="inline-issues">
              {result.criticalErrors.map((criticalError) => (
                <li key={criticalError}>{criticalError}</li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 18 }}>
            <Link className="badge" href={`/imports/${result.importFileId}`}>
              Open review screen
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
