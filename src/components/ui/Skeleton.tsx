export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-line/70 ${className}`} />;
}

// Lista de cartões enquanto os dados carregam (evita a tela vazia com "Carregando...").
export function SkeletonList({ n = 4 }: { n?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="mt-4 grid gap-3 sm:grid-cols-2">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="rounded-md border border-line bg-white p-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
