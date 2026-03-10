import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface EmptyStateProps {
  illustration?: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionPath?: string;
}

export default function EmptyState({
  illustration,
  title,
  message,
  actionLabel,
  actionPath,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
      {illustration && (
        <img
          src={illustration}
          alt={title}
          className="h-48 w-auto object-contain opacity-50"
        />
      )}
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
      </div>
      {actionLabel && actionPath && (
        <Link to={actionPath}>
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
