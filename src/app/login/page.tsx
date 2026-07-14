import { signIn } from "@/auth";

export default function LoginPage() {
  const hasGitHub = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );
  const hasGoogle = Boolean(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
  );

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">FA Business OS</p>
        <h1>Masuk ke command center</h1>
        <p>
          Gunakan akun yang sudah dikonfigurasi oleh administrator aplikasi.
        </p>

        <div className="login-actions">
          {hasGitHub ? (
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
            >
              <button type="submit">Masuk dengan GitHub</button>
            </form>
          ) : null}

          {hasGoogle ? (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button type="submit">Masuk dengan Google</button>
            </form>
          ) : null}

          {!hasGitHub && !hasGoogle ? (
            <p className="login-warning">
              Provider login belum dikonfigurasi. Isi credential OAuth pada
              environment server.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
