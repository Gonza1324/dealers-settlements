export const IMPORT_REQUIRED_COLUMNS = [
  "Year",
  "Make",
  "Model",
  "VIN",
  "Sale",
  "Finance",
  "Net Gross",
  "Pick Up",
] as const;

export const IMPORT_WIZARD_STEPS = [
  "Upload file",
  "Validate structure",
  "Review rows",
  "Normalize aliases",
  "Detect duplicates",
  "Pre-consolidation review",
] as const;

