// Troca o cliente do Supabase nos testes da fila: sessão fixa e armazenamento controlável pelo teste.
type Janela = { __uid: string | null; __uploads: { path: string; size: number }[]; __uploadErro?: string; __semRede?: boolean };
const w = window as unknown as Janela;

export const createClient = () => ({
  auth: { getSession: async () => ({ data: { session: w.__uid ? { user: { id: w.__uid } } : null } }) },
  storage: {
    from: () => ({
      upload: async (path: string, blob: Blob) => {
        if (w.__semRede) return { error: { message: "TypeError: Failed to fetch" } };
        if (w.__uploadErro) return { error: { message: w.__uploadErro } };
        w.__uploads.push({ path, size: blob.size });
        return { error: null };
      },
    }),
  },
});
