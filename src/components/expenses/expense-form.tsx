"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { saveExpense } from "@/features/expenses/actions";
import { initialFormState } from "@/features/masters/shared/form-state";
import type {
  ExpenseCategoryRecord,
  ExpenseFormTemplateOption,
  ExpenseFormValues,
  ExpenseListRecord,
} from "@/features/expenses/types";
import type { ExpenseScopeType } from "@/types/database";

function buildInitialValues(expense?: ExpenseListRecord | null): ExpenseFormValues {
  const selectedDealerIds = expense?.allocations.map((allocation) => allocation.dealer_id) ?? [];

  return {
    id: expense?.id,
    recurringTemplateId: expense?.recurring_template_id ?? "",
    categoryId: expense?.category_id ?? "",
    description: expense?.description ?? "",
    amount: expense?.amount ?? "",
    expenseDate: expense?.expense_date ?? "",
    periodMonth: expense?.period_month?.slice(0, 7) ?? "",
    scopeType: (expense?.scope_type ?? "single_dealer") as ExpenseScopeType,
    singleDealerId: selectedDealerIds[0] ?? "",
    selectedDealerIds,
    removeAttachment: false,
    existingAttachmentPath: expense?.attachment_path ?? "",
    isRecurringInstance: expense?.is_recurring_instance ?? false,
  };
}

export function ExpenseForm({
  categories,
  dealers,
  expense,
  templates,
  canEdit,
}: {
  categories: ExpenseCategoryRecord[];
  dealers: Array<{ id: string; name: string; code: number }>;
  expense?: ExpenseListRecord | null;
  templates: ExpenseFormTemplateOption[];
  canEdit: boolean;
}) {
  const [state, formAction] = useActionState(saveExpense, initialFormState);
  const [values, setValues] = useState<ExpenseFormValues>(() => buildInitialValues(expense));

  useEffect(() => {
    setValues(buildInitialValues(expense));
  }, [expense]);

  useEffect(() => {
    if (state.success && !expense) {
      setValues(buildInitialValues(null));
    }
  }, [expense, state.success]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === values.recurringTemplateId) ?? null,
    [templates, values.recurringTemplateId],
  );

  function toggleSelectedDealer(dealerId: string, checked: boolean) {
    setValues((current) => ({
      ...current,
      selectedDealerIds: checked
        ? [...new Set([...current.selectedDealerIds, dealerId])]
        : current.selectedDealerIds.filter((id) => id !== dealerId),
    }));
  }

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      setValues((current) => ({
        ...current,
        recurringTemplateId: "",
      }));
      return;
    }

    setValues((current) => ({
      ...current,
      recurringTemplateId: template.id,
      categoryId: template.categoryId ?? current.categoryId,
      description: template.defaultDescription ?? current.description,
      amount: String(template.defaultAmount),
      scopeType: template.scopeType,
      singleDealerId: template.selectedDealerIds[0] ?? "",
      selectedDealerIds: template.selectedDealerIds,
      isRecurringInstance: true,
    }));
  }

  return (
    <section className="panel">
      <p className="eyebrow">{expense ? "Edit expense" : "New expense"}</p>
      <h2 style={{ marginTop: 0 }}>
        {expense ? "Update expense and allocations" : "Create expense"}
      </h2>

      <form action={formAction} className="masters-form">
        <input name="id" type="hidden" value={values.id ?? ""} />
        <input
          name="existingAttachmentPath"
          type="hidden"
          value={values.existingAttachmentPath}
        />

        <div className="grid two">
          <label className="field">
            <span>Recurring template</span>
            <select
              disabled={!canEdit}
              name="recurringTemplateId"
              onChange={(event) => applyTemplate(event.target.value)}
              value={values.recurringTemplateId}
            >
              <option value="">Manual expense</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select
              disabled={!canEdit}
              name="categoryId"
              onChange={(event) =>
                setValues((current) => ({ ...current, categoryId: event.target.value }))
              }
              value={values.categoryId}
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
            <span>Description</span>
            <input
              disabled={!canEdit}
              name="description"
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              value={values.description}
            />
          </label>
          <label className="field">
            <span>Amount</span>
            <input
              disabled={!canEdit}
              name="amount"
              onChange={(event) =>
                setValues((current) => ({ ...current, amount: event.target.value }))
              }
              step="0.01"
              type="number"
              value={values.amount}
            />
          </label>
          <label className="field">
            <span>Expense date</span>
            <input
              disabled={!canEdit}
              name="expenseDate"
              onChange={(event) =>
                setValues((current) => ({ ...current, expenseDate: event.target.value }))
              }
              type="date"
              value={values.expenseDate}
            />
          </label>
          <label className="field">
            <span>Period month</span>
            <input
              disabled={!canEdit}
              name="periodMonth"
              onChange={(event) =>
                setValues((current) => ({ ...current, periodMonth: event.target.value }))
              }
              type="month"
              value={values.periodMonth}
            />
          </label>
          <label className="field">
            <span>Scope</span>
            <select
              disabled={!canEdit}
              name="scopeType"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  scopeType: event.target.value as ExpenseScopeType,
                }))
              }
              value={values.scopeType}
            >
              <option value="single_dealer">Single dealer</option>
              <option value="selected_dealers">Selected dealers</option>
              <option value="all_dealers">All dealers</option>
            </select>
          </label>
          <label className="field">
            <span>Receipt</span>
            <input disabled={!canEdit} name="attachment" type="file" />
          </label>
        </div>

        {values.scopeType === "single_dealer" && (
          <label className="field">
            <span>Dealer</span>
            <select
              disabled={!canEdit}
              name="singleDealerId"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  singleDealerId: event.target.value,
                }))
              }
              value={values.singleDealerId}
            >
              <option value="">Choose a dealer</option>
              {dealers.map((dealer) => (
                <option key={dealer.id} value={dealer.id}>
                  {dealer.name} ({dealer.code})
                </option>
              ))}
            </select>
          </label>
        )}

        {values.scopeType === "selected_dealers" && (
          <div className="field">
            <span>Selected dealers</span>
            <div className="grid two">
              {dealers.map((dealer) => (
                <label key={dealer.id} className="field" style={{ marginBottom: 0 }}>
                  <span>
                    <input
                      checked={values.selectedDealerIds.includes(dealer.id)}
                      disabled={!canEdit}
                      name="selectedDealerIds"
                      onChange={(event) =>
                        toggleSelectedDealer(dealer.id, event.target.checked)
                      }
                      type="checkbox"
                      value={dealer.id}
                    />{" "}
                    {dealer.name} ({dealer.code})
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {values.scopeType === "all_dealers" && (
          <div className="inline-alert">
            <p className="eyebrow">Scope preview</p>
            <p style={{ margin: 0 }}>
              This expense will be allocated evenly across all active dealers.
            </p>
          </div>
        )}

        {values.existingAttachmentPath && canEdit && (
          <label className="field">
            <span>Attachment options</span>
            <label>
              <input
                checked={values.removeAttachment}
                name="removeAttachment"
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    removeAttachment: event.target.checked,
                  }))
                }
                type="checkbox"
                value="true"
              />{" "}
              Remove current attachment
            </label>
          </label>
        )}

        <label className="field">
          <span>Recurring instance</span>
          <label>
            <input
              checked={values.isRecurringInstance}
              disabled={!canEdit || Boolean(selectedTemplate)}
              name="isRecurringInstance"
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  isRecurringInstance: event.target.checked,
                }))
              }
              type="checkbox"
              value="true"
            />{" "}
            Mark as created from a recurring template
          </label>
        </label>

        {canEdit && (
          <button className="action-button" type="submit">
            {expense ? "Save expense" : "Create expense"}
          </button>
        )}
        {state.error && <p className="error-text">{state.error}</p>}
        {state.message && <p className="success-text">{state.message}</p>}
      </form>
    </section>
  );
}
