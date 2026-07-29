"use client";

import { useActionState, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FormFeedback } from "@/components/ui/form-feedback";
import {
  expenseScopeTone,
  formatExpenseScope,
} from "@/components/expenses/scope-status";
import { StatusPill } from "@/components/ui/status-pill";
import {
  archiveExpenseRecurringTemplate,
  saveExpenseRecurringTemplate,
} from "@/features/expenses/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type {
  ExpenseCategoryRecord,
  ExpenseRecurringTemplateRecord,
} from "@/features/expenses/types";
import type { ExpenseScopeType } from "@/types/database";

export function RecurringTemplatesPanel({
  categories,
  dealers,
  templates,
}: {
  categories: ExpenseCategoryRecord[];
  dealers: Array<{ id: string; name: string; code: number }>;
  templates: ExpenseRecurringTemplateRecord[];
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ExpenseRecurringTemplateRecord | null>(null);
  const [state, formAction] = useActionState(
    saveExpenseRecurringTemplate,
    initialFormState,
  );
  const [selectedDealerIds, setSelectedDealerIds] = useState<string[]>([]);
  const [scopeType, setScopeType] = useState(
    selectedTemplate?.scope_type ?? "single_dealer",
  );

  useEffect(() => {
    setSelectedDealerIds(
      Array.isArray(selectedTemplate?.selected_dealer_ids)
        ? (selectedTemplate?.selected_dealer_ids as string[])
        : [],
    );
    setScopeType(selectedTemplate?.scope_type ?? "single_dealer");
  }, [selectedTemplate]);

  useEffect(() => {
    if (state.success) {
      setSelectedTemplate(null);
      setSelectedDealerIds([]);
      setScopeType("single_dealer");
    }
  }, [state.success]);

  function toggleDealer(dealerId: string, checked: boolean) {
    if (scopeType === "single_dealer") {
      setSelectedDealerIds(checked && dealerId ? [dealerId] : []);
      return;
    }

    setSelectedDealerIds((current) =>
      checked ? [...new Set([...current, dealerId])] : current.filter((id) => id !== dealerId),
    );
  }

  function updateScope(nextScopeType: ExpenseScopeType) {
    setScopeType(nextScopeType);
    setSelectedDealerIds((current) => {
      if (nextScopeType === "all_dealers") {
        return [];
      }

      if (nextScopeType === "single_dealer") {
        return current.slice(0, 1);
      }

      return current;
    });
  }

  return (
    <section className="masters-grid">
      <article className="panel">
        <p className="eyebrow">Recurring templates</p>
        <h2 style={{ marginTop: 0 }}>Templates</h2>
        <DataTable
          wrapperClassName="registry-table-scroll"
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "scope", label: "Scope" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {templates.map((template) => (
            <tr key={template.id}>
              <td>{template.name}</td>
              <td>{template.category_name ?? "-"}</td>
              <td>
                <StatusPill tone={expenseScopeTone(template.scope_type)}>
                  {formatExpenseScope(template.scope_type)}
                </StatusPill>
                {Array.isArray(template.selected_dealer_ids) &&
                  template.selected_dealer_ids.length > 0 && (
                    <div className="muted small-text">
                      {template.selected_dealer_ids.length} dealers
                    </div>
                  )}
              </td>
              <td>
                <div className="table-actions">
                  <button
                    className="ghost-button"
                    onClick={() => setSelectedTemplate(template)}
                    type="button"
                  >
                    Edit
                  </button>
                  <form action={archiveExpenseRecurringTemplate.bind(null, template.id)}>
                    <ConfirmSubmitButton
                      className="ghost-button danger"
                      confirmMessage={`Remove recurring template "${template.name}"? Existing expenses stay intact, but the template will be archived.`}
                      pendingLabel="Removing..."
                    >
                      Remove
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
      </article>
      <article className="panel">
        <p className="eyebrow">{selectedTemplate ? "Edit template" : "New template"}</p>
        <form
          action={formAction}
          className="masters-form"
          key={selectedTemplate?.id ?? "new-template"}
        >
          <input name="id" type="hidden" value={selectedTemplate?.id ?? ""} />
          <label className="field">
            <span>Name</span>
            <input defaultValue={selectedTemplate?.name ?? ""} name="name" />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              defaultValue={selectedTemplate?.category_id ?? ""}
              name="categoryId"
            >
              <option value="">No category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Default description</span>
            <input
              defaultValue={selectedTemplate?.default_description ?? ""}
              name="defaultDescription"
            />
          </label>
          <label className="field">
            <span>Default amount</span>
            <input
              defaultValue={selectedTemplate?.default_amount ?? ""}
              name="defaultAmount"
              step="0.01"
              type="number"
            />
          </label>
          <label className="field">
            <span>Scope</span>
            <select
              defaultValue={selectedTemplate?.scope_type ?? "single_dealer"}
              name="scopeType"
              onChange={(event) => updateScope(event.target.value as ExpenseScopeType)}
            >
              <option value="single_dealer">Single dealer</option>
              <option value="selected_dealers">Selected dealers</option>
              <option value="all_dealers">All dealers</option>
            </select>
          </label>
          {scopeType !== "all_dealers" && (
            <label className="field recurring-dealers-field">
              <span>
                {scopeType === "single_dealer" ? "Dealer optional" : "Selected dealers"}
              </span>
              <div className="selected-dealers-list compact">
                {scopeType === "single_dealer" && (
                  <label>
                    <button
                      className="inline-choice-button"
                      data-selected={selectedDealerIds.length === 0}
                      onClick={() => setSelectedDealerIds([])}
                      type="button"
                    >
                      No dealer selected
                    </button>
                  </label>
                )}
                {dealers.map((dealer) => (
                  <label key={dealer.id}>
                    <input
                      checked={selectedDealerIds.includes(dealer.id)}
                      name="selectedDealerIds"
                      onChange={(event) => toggleDealer(dealer.id, event.target.checked)}
                      type={scopeType === "single_dealer" ? "radio" : "checkbox"}
                      value={dealer.id}
                    />{" "}
                    {dealer.name} ({dealer.code})
                  </label>
                ))}
              </div>
            </label>
          )}
          {scopeType === "all_dealers" && (
            <div className="inline-alert">
              <p className="eyebrow">Scope preview</p>
              <p style={{ margin: 0 }}>
                Expenses created from this template will apply to all active dealers.
              </p>
            </div>
          )}
          <label className="field">
            <span>Status</span>
            <select defaultValue={selectedTemplate?.is_active ? "true" : "false"} name="isActive">
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </label>
          <button className="action-button" type="submit">
            {selectedTemplate ? "Save template" : "Create template"}
          </button>
          <FormFeedback message={state.error} tone="error" />
          <FormFeedback message={state.message} tone="success" />
        </form>
      </article>
    </section>
  );
}
