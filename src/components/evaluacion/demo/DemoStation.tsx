"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Alert } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea } from "@/components/ui/Field";

interface ChatMsg {
  role: "user" | "model";
  text: string;
}

const STEPS = [
  { id: 1, title: "Nombre Completo", subtitle: "Identificación inicial" },
  { id: 2, title: "Opinión Docente", subtitle: "Evaluación escrita" },
  { id: 3, title: "Prueba de Audio", subtitle: "Grabación y descarga" },
  { id: 4, title: "Conversación IA", subtitle: "Check de bienestar (2:00)" },
  { id: 5, title: "Reporte Final", subtitle: "Comprobante en formato PNG" },
];

const CHAT_SECONDS = 120;

export function DemoStation({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [maxUnlocked, setMaxUnlocked] = useState(1);

  const [fullName, setFullName] = useState("");
  const [opinion, setOpinion] = useState("");

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [micError, setMicError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartRef = useRef<number>(0);

  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    { role: "model", text: "Hola, soy Sabina. Antes de terminar, cuénteme: ¿cómo se ha sentido durante esta simulación?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [chatSeconds, setChatSeconds] = useState(CHAT_SECONDS);
  const [chatTimerRunning, setChatTimerRunning] = useState(false);

  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const [finished, setFinished] = useState(false);

  function goTo(n: number) {
    if (n <= maxUnlocked) setStep(n);
  }
  function advance() {
    const next = step + 1;
    setStep(next);
    setMaxUnlocked((m) => Math.max(m, next));
  }

  async function startRecording() {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (e) => chunksRef.current.push(e.data));
      recorder.addEventListener("stop", async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioDuration(Math.round((Date.now() - recordStartRef.current) / 1000));
        const reader = new FileReader();
        reader.onloadend = () => setAudioDataUrl(reader.result as string);
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      });
      recordStartRef.current = Date.now();
      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError("No se pudo acceder al micrófono. Verifica los permisos de tu navegador.");
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function startChatTimer() {
    if (chatTimerRunning) return;
    setChatTimerRunning(true);
    const interval = setInterval(() => {
      setChatSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || chatSending) return;
    startChatTimer();
    const userMsg: ChatMsg = { role: "user", text: chatInput.trim() };
    const nextHistory = [...chatHistory, userMsg];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatSending(true);
    try {
      const res = await fetch(`/api/evaluacion/${sessionId}/demo-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: chatHistory, message: userMsg.text }),
      });
      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "model", text: data.reply ?? "Gracias por compartirlo." }]);
    } finally {
      setChatSending(false);
    }
  }

  async function handleFinish() {
    setFinishing(true);
    setFinishError("");
    try {
      const res = await fetch(`/api/evaluacion/${sessionId}/demo-finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          opinion,
          audioDataUrl,
          audioDurationSeconds: audioDuration,
          chatHistory,
          chatSecondsElapsed: CHAT_SECONDS - chatSeconds,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setFinishError(data.error ?? "No se pudo guardar tu resultado.");
        return;
      }
      setFinished(true);
    } finally {
      setFinishing(false);
    }
  }

  function downloadReportPng() {
    const canvas = document.createElement("canvas");
    canvas.width = 900;
    canvas.height = 560;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#041e42";
    ctx.fillRect(0, 0, canvas.width, 100);
    ctx.fillStyle = "#c9a227";
    ctx.fillRect(0, 100, canvas.width, 6);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Georgia, serif";
    ctx.fillText("Comprobante — Estación Demo EDDOE", 40, 60);

    ctx.fillStyle = "#041e42";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Nombre:", 40, 160);
    ctx.font = "20px Arial";
    ctx.fillText(fullName || "—", 180, 160);

    ctx.font = "bold 20px Arial";
    ctx.fillText("Fecha:", 40, 200);
    ctx.font = "20px Arial";
    ctx.fillText(new Date().toLocaleString("es-MX"), 180, 200);

    ctx.font = "bold 20px Arial";
    ctx.fillText("Audio grabado:", 40, 240);
    ctx.font = "20px Arial";
    ctx.fillText(audioDuration ? `${audioDuration} segundos` : "No grabado", 240, 240);

    ctx.font = "bold 20px Arial";
    ctx.fillText("Conversación IA:", 40, 280);
    ctx.font = "20px Arial";
    ctx.fillText(`${chatHistory.filter((m) => m.role === "user").length} mensaje(s) enviados`, 260, 280);

    ctx.font = "bold 18px Arial";
    ctx.fillText("Opinión registrada:", 40, 340);
    ctx.font = "16px Arial";
    wrapText(ctx, opinion || "—", 40, 370, 820, 24);

    ctx.fillStyle = "#c9a227";
    ctx.font = "italic 14px Arial";
    ctx.fillText("Esta es una demostración; no sustituye a la aplicación oficial de la EDDOE.", 40, 520);

    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeName = (fullName || "Persona_Docente_EDDOE").replace(/\s+/g, "_");
    link.download = `Comprobante_EDDOE_${safeName}.png`;
    link.href = url;
    link.click();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <h3 className="mb-1 font-serif text-sm font-bold uppercase tracking-wide text-navy">Mapa de evaluación</h3>
        <p className="mb-4 text-xs text-slate-500">Haga clic para ir a cualquier sección desbloqueada.</p>
        <ol className="space-y-1">
          {STEPS.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => goTo(s.id)}
                disabled={s.id > maxUnlocked}
                className={`flex w-full items-center gap-3 rounded-md border-l-4 px-3 py-2 text-left text-sm transition ${
                  step === s.id
                    ? "border-gold bg-gold-light font-semibold text-navy"
                    : s.id <= maxUnlocked
                      ? "border-transparent text-slate-600 hover:bg-slate-50"
                      : "border-transparent text-slate-300"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step === s.id ? "bg-navy text-gold" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {s.id}
                </span>
                <span>
                  <span className="block">{s.title}</span>
                  <span className="block text-xs font-normal text-slate-400">{s.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-l-4 border-navy pl-4">
              <h2 className="text-xl font-bold text-navy">Sección 1: Identificación de la Persona Docente</h2>
              <p className="text-sm text-slate-500">
                Paso inicial para registrar su participación y personalizar su reporte final.
              </p>
            </div>
            <div>
              <Label htmlFor="fullName" required>
                Nombre completo
              </Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button disabled={!fullName.trim()} onClick={advance}>
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="border-l-4 border-navy pl-4">
              <h2 className="text-xl font-bold text-navy">Sección 2: Opinión sobre la Evaluación de Desempeño Docente</h2>
            </div>
            <Alert tone="warning">¿Qué opina usted sobre la evaluación del desempeño docente?</Alert>
            <div>
              <Label htmlFor="opinion" required>
                Escriba su opinión profesional en el siguiente recuadro
              </Label>
              <Textarea id="opinion" rows={6} value={opinion} onChange={(e) => setOpinion(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Anterior
              </Button>
              <Button disabled={opinion.trim().length < 10} onClick={advance}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="border-l-4 border-navy pl-4">
              <h2 className="text-xl font-bold text-navy">Sección 3: Interacción Oral y Grabación de Audio</h2>
              <p className="text-sm text-slate-500">
                Demuestre su capacidad para registrar respuestas orales.
              </p>
            </div>
            <div className="rounded-xl border-2 border-dashed border-gold/50 bg-gold-light p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Pregunta de grabación</p>
              <p className="mt-1 text-lg font-bold text-navy">
                ¿Cómo se siente emocionalmente ante su próximo examen de desempeño docente?
              </p>
              <p className="mt-1 text-xs text-slate-600">Reflexione un momento y grabe su respuesta con su propia voz.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isRecording ? (
                <Button variant="secondary" onClick={startRecording}>
                  🎙️ Grabar
                </Button>
              ) : (
                <Button variant="danger" onClick={stopRecording}>
                  ⏹️ Detener
                </Button>
              )}
              {audioUrl && <audio src={audioUrl} controls />}
            </div>
            {micError && <Alert tone="danger">{micError}</Alert>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>
                Anterior
              </Button>
              <Button disabled={!audioUrl} onClick={advance}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-l-4 border-navy pl-4">
              <h2 className="text-xl font-bold text-navy">Conversación con Sabina</h2>
              <span className="rounded-full bg-navy px-3 py-1 text-sm font-bold text-gold">
                {String(Math.floor(chatSeconds / 60)).padStart(2, "0")}:{String(chatSeconds % 60).padStart(2, "0")}
              </span>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-4">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      m.role === "user" ? "bg-navy text-white" : "bg-gold-light text-navy"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {chatSending && <p className="text-xs text-slate-400">Sabina está escribiendo...</p>}
            </div>
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Escriba su mensaje..."
              />
              <Button onClick={sendChatMessage} disabled={chatSending || !chatInput.trim()}>
                Enviar
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(3)}>
                Anterior
              </Button>
              <Button onClick={advance}>Continuar</Button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="border-l-4 border-navy pl-4">
              <h2 className="text-xl font-bold text-navy">Reporte Final</h2>
              <p className="text-sm text-slate-500">Resumen de su participación en la estación demo.</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-500">Nombre</td>
                  <td className="py-2 text-right">{fullName}</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-500">Audio grabado</td>
                  <td className="py-2 text-right">{audioDuration} segundos</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-2 font-semibold text-slate-500">Mensajes con Sabina</td>
                  <td className="py-2 text-right">{chatHistory.filter((m) => m.role === "user").length}</td>
                </tr>
              </tbody>
            </table>

            {finishError && <Alert tone="danger">{finishError}</Alert>}

            {!finished ? (
              <Button onClick={handleFinish} disabled={finishing}>
                {finishing ? "Guardando..." : "Guardar y generar comprobante"}
              </Button>
            ) : (
              <>
                <Alert tone="info">
                  Tu resultado quedó guardado. Podrás consultarlo en cualquier momento desde tu historial en
                  "Mi EDDOE".
                </Alert>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={downloadReportPng}>Descargar comprobante (PNG)</Button>
                  <Button variant="secondary" onClick={() => router.push("/mi-eddoe")}>
                    Ir a mi historial
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line + word + " ";
    if (ctx.measureText(testLine).width > maxWidth && line !== "") {
      ctx.fillText(line, x, currentY);
      line = word + " ";
      currentY += lineHeight;
      if (currentY > 500) break;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}
