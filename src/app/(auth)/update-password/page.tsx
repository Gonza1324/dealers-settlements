import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <main className="page">
      <section className="hero-card login-card">
        <p className="eyebrow">Authentication</p>
        <h1 className="title">Update password</h1>
        <p className="subtitle">
          Use the recovery link sent by email to open this page and choose a new
          password for your account.
        </p>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}
