import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function Logo({ inverted }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid size-8 place-items-center rounded-lg bg-leaf text-primary-deep">
        <Leaf className="size-4" />
      </span>
      <span className={`font-display text-lg font-semibold ${inverted ? "text-sidebar-foreground" : "text-primary-deep"}`}>
        VETSENSE <span className="text-leaf">AI</span>
      </span>
    </Link>
  );
}
