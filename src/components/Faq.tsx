// Perguntas e respostas em <details>: funciona sem JavaScript e é acessível por teclado.
export function Faq({ itens, titulo = "Perguntas frequentes" }: { itens: { p: string; r: string }[]; titulo?: string }) {
  return (
    <section aria-labelledby="faq" className="px-4 py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 id="faq" className="font-display text-4xl font-bold sm:text-5xl">{titulo}</h2>
        <div className="mt-6 divide-y divide-line rounded-md border border-line bg-white">
          {itens.map((f) => (
            <details key={f.p} className="group px-5">
              <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 py-3 font-semibold marker:content-none">
                {f.p}
                <span aria-hidden className="text-2xl leading-none text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-4 text-mute">{f.r}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
