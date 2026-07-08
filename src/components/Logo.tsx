import { Link } from "@tanstack/react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center hover:opacity-90 transition-opacity">
      <img src="/logo.png" alt="CarrotHost Logo" width={321} height={71} className="h-9 w-auto object-contain" />
    </Link>
  );
}
