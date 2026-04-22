"use client";

import { useActionState, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { archiveExpenseCategory, saveExpenseCategory } from "@/features/expenses/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type { ExpenseCategoryRecord } from "@/features/expenses/types";

export function ExpenseCategoriesPanel({
  categories,
}: {
  categories: ExpenseCategoryRecord[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryRecord | null>(null);
  const [state, formAction] = useActionState(saveExpenseCategory, initialFormState);

  useEffect(() => {
    if (state.success) {
      setSelectedCategory(null);
    }
  }, [state.success]);

  return (
    <section className="masters-grid">
      <article className="panel">
        <p className="eyebrow">Expense categories</p>
        <h2 style={{ marginTop: 0 }}>Categories</h2>
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions" },
          ]}
        >
          {categories.map((category) => (
            <tr key={category.id}>
              <td>{category.name}</td>
              <td>{category.is_active ? "active" : "inactive"}</td>
              <td>
                <div className="table-actions">
                  <button
                    className="ghost-button"
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    Edit
                  </button>
                  <form action={archiveExpenseCategory.bind(null, category.id)}>
                    <ConfirmSubmitButton
                      className="ghost-button danger"
                      confirmMessage={`Remove category "${category.name}"? Existing history stays, but this category will no longer be active.`}
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
        <p className="eyebrow">{selectedCategory ? "Edit category" : "New category"}</p>
        <form
          action={formAction}
          className="masters-form"
          key={selectedCategory?.id ?? "new-category"}
        >
          <input name="id" type="hidden" value={selectedCategory?.id ?? ""} />
          <label className="field">
            <span>Name</span>
            <input defaultValue={selectedCategory?.name ?? ""} name="name" />
          </label>
          <label className="field">
            <span>Status</span>
            <select
              defaultValue={selectedCategory?.is_active ? "true" : "false"}
              name="isActive"
            >
              <option value="true">active</option>
              <option value="false">inactive</option>
            </select>
          </label>
          <button className="action-button" type="submit">
            {selectedCategory ? "Save category" : "Create category"}
          </button>
          {state.error && <p className="error-text">{state.error}</p>}
          {state.message && <p className="success-text">{state.message}</p>}
        </form>
      </article>
    </section>
  );
}
