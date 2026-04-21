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
  "Select month",
  "Upload file",
  "Validate structure",
  "Parse rows",
  "Normalize & match",
  "Detect duplicates",
  "Pre-consolidation review",
  "Approve ready rows",
] as const;
