"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registrarFoto } from "@/app/painel/actions";
import { useToast } from "./ui/Toast";
import { btnGhost } from "./ui";

const LADO_MAX = 1600;

// Reduz a foto no aparelho antes de enviar (câmeras de celular geram 4–10 MB; aqui ficam ~300 KB).
async function comprimir(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("falha"))), "image/jpeg", 0.8));
}

export function FotoUploader({ osId }: { osId: string }) {
  const router = useRouter();
  const toast = useToast();
  const ref = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(files: FileList | null) {
    if (!files?.length) return;
    setEnviando(true);
    const supabase = createClient();
    let ok = 0;
    for (const file of Array.from(files).slice(0, 10)) {
      try {
        const blob = await comprimir(file);
        const caminho = `${osId}/${crypto.randomUUID()}.jpg`;
        const up = await supabase.storage.from("os-fotos").upload(caminho, blob, { contentType: "image/jpeg" });
        if (up.error) throw up.error;
        const r = await registrarFoto(osId, caminho);
        if (r.erro) throw new Error(r.erro);
        ok++;
      } catch {
        toast.erro("Não foi possível enviar uma das fotos.");
      }
    }
    if (ref.current) ref.current.value = "";
    setEnviando(false);
    if (ok) { toast.ok(ok === 1 ? "Foto adicionada." : `${ok} fotos adicionadas.`); router.refresh(); }
  }

  return (
    <>
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple hidden
        onChange={(e) => enviar(e.target.files)} />
      <button type="button" disabled={enviando} onClick={() => ref.current?.click()} className={`${btnGhost} mt-3 w-full`}>
        {enviando ? "Enviando..." : "Tirar ou escolher fotos"}
      </button>
    </>
  );
}
