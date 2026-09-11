export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-3 my-6 border-2 border-dashed border-line px-6 py-12 text-center">
      <p className="font-pixel text-[11px] text-ink">[ {title} ]</p>
      <p className="mx-auto mt-4 max-w-xl font-crt text-lg leading-6 text-muted">
        {message}
      </p>
      <p className="mt-4 font-pixel text-[9px] text-faint">▶ PRESS ANY PAGE TO CONTINUE</p>
    </div>
  );
}

export function SourceNotice({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="border-2 border-warn bg-panel px-4 py-3 font-crt text-lg text-warn">
      ⚠ {message}
    </div>
  );
}
