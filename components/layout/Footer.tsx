import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 py-8 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
        <p>
          © {new Date().getFullYear()} TaskFlow. Vistas demo (mock) para capturas.
        </p>
        <nav className="flex items-center gap-4">
          <Link href="/" className="hover:underline">
            Inicio
          </Link>
          <Link href="/login" className="hover:underline">
            Ingresar
          </Link>
          <Link href="/register" className="hover:underline">
            Registro
          </Link>
        </nav>
      </div>
    </footer>
  );
}
