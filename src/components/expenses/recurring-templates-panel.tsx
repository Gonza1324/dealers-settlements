"use client";

import { useActionState, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import {
  archiveExpenseRecurringTemplate,
  saveExpenseRecurringTemplate,
} from "@/features/expenses/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type {
  ExpenseCategoryRecord,
  ExpenseRecurringTemplateRecord,
} from "@/features/expenses/types";

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

  useEffect(() => {
    setSelectedDealerIds(
      Array.isArray(selectedTemplate?.selected_dealer_ids)
        ? (selectedTemplate?.selected_dealer_ids as string[])
        : [],
    );
  }, [selectedTemplate]);

  useEffect(() => {
    if (state.success) {
      setSelectedTemplate(null);
      setSelectedDealerIds([]);
    }
  }, [state.success]);

  function toggleDealer(dealerId: string, checked: boolean) {
    setSelectedDealerIds((current) =>
      checked ? [...new Set([...current, dealerId])] : current.filter((id) => id !== dealerId),
    );
  }

  return (
    <section className="masters-grid">
      <article className="panel">
        <p className="eyebrow">Recurring templates</p>
        <h2 style={{ marginTop: 0 }}>Templates</h2>
        <DataTable
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
              <td>{template.scope_type}</td>
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
                    <button className="ghost-button danger" type="submit">
                      Remove
                    </button>
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
            >
              <option value="single_dealer">single_dealer</option>
              <option value="selected_dealers">selected_dealers</option>
              <option value="all_dealers">all_dealers</option>
            </select>
          </label>
          <label className="field">
            <span>Selected dealers</span>
            <div className="grid two">
              {dealers.map((dealer) => (
                <label key={dealer.id}>
                  <input
                    checked={selectedDealerIds.includes(dealer.id)}
                    name="selectedDealerIds"
                    onChange={(event) => toggleDealer(dealer.id, event.target.checked)}
                    type="checkbox"
                    value={dealer.id}
                  />{" "}
                  {dealer.name} ({dealer.code})
                </label>
              ))}
            </div>
          </label>
          <label className="field">
            <span>Start date</span>
            <input defaultValue={selectedTemplate?.start_date ?? ""} name="startDate" type="date" />
          </label>
          <label className="field">
            <span>End date</span>
            <input defaultValue={selectedTemplate?.end_date ?? ""} name="endDate" type="date" />
          </label>
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
          {state.error && <p className="error-text">{state.error}</p>}
          {state.message && <p className="success-text">{state.message}</p>}
        </form>
      </article>
    </section>
  );
}
