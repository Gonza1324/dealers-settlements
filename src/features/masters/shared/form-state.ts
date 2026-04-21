export interface FormActionState {
  success: boolean;
  message: string | null;
  error: string | null;
}

export const initialFormState: FormActionState = {
  success: false,
  message: null,
  error: null,
};
