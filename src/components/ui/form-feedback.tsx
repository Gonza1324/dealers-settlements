type FormFeedbackTone = "success" | "error" | "warning" | "info";

const TONE_LABELS: Record<FormFeedbackTone, string> = {
  error: "Needs attention",
  info: "Note",
  success: "Saved",
  warning: "Review",
};

export function FormFeedback({
  details,
  message,
  tone,
}: {
  details?: string[];
  message: string | null | undefined;
  tone: FormFeedbackTone;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className={`form-feedback ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <p className="eyebrow">{TONE_LABELS[tone]}</p>
      <p>{message}</p>
      {details && details.length > 0 && (
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
