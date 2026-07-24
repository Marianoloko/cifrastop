import { useEffect, useRef, useState } from "react";
import { Headphones, Power } from "lucide-react";

// Live monitor: microphone -> effects -> output. Use headphones to avoid feedback.
export function AudioMonitor() {
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gain, setGain] = useState(0.8);
  const [reverb, setReverb] = useState(0.25);
  const [delay, setDelay] = useState(0);
  const [level, setLevel] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nodesRef = useRef<{
    dry: GainNode;
    wet: GainNode;
    delayFb: GainNode;
    out: GainNode;
    analyser: AnalyserNode;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    ctxRef.current?.close();
    ctxRef.current = null;
    streamRef.current = null;
    nodesRef.current = null;
    setActive(false);
    setLevel(0);
  };

  const makeReverbImpulse = (ctx: AudioContext, seconds = 2, decay = 2) => {
    const rate = ctx.sampleRate;
    const len = rate * seconds;
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      const src = ctx.createMediaStreamSource(stream);

      const dry = ctx.createGain();
      const wet = ctx.createGain();
      const conv = ctx.createConvolver();
      conv.buffer = makeReverbImpulse(ctx);
      const delayNode = ctx.createDelay(2);
      delayNode.delayTime.value = 0.25;
      const delayFb = ctx.createGain();
      delayFb.gain.value = delay;
      const out = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;

      dry.gain.value = 1 - reverb;
      wet.gain.value = reverb;
      out.gain.value = gain;

      // routing
      src.connect(dry);
      src.connect(conv);
      conv.connect(wet);
      // delay loop
      src.connect(delayNode);
      delayNode.connect(delayFb);
      delayFb.connect(delayNode);
      delayNode.connect(out);

      dry.connect(out);
      wet.connect(out);
      out.connect(analyser);
      out.connect(ctx.destination);

      ctxRef.current = ctx;
      streamRef.current = stream;
      nodesRef.current = { dry, wet, delayFb, out, analyser };
      setActive(true);

      const buf = new Uint8Array(analyser.fftSize);
      const loop = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i] - 128) / 128;
          if (v > peak) peak = v;
        }
        setLevel(peak);
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e: any) {
      setError(e?.message ?? "Não foi possível acessar o microfone");
    }
  };

  useEffect(() => () => stop(), []);
  useEffect(() => { if (nodesRef.current) nodesRef.current.out.gain.value = gain; }, [gain]);
  useEffect(() => {
    if (nodesRef.current) {
      nodesRef.current.dry.gain.value = 1 - reverb;
      nodesRef.current.wet.gain.value = reverb;
    }
  }, [reverb]);
  useEffect(() => { if (nodesRef.current) nodesRef.current.delayFb.gain.value = delay * 0.6; }, [delay]);

  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Headphones size={18} className="text-tom" />
        <h2 className="text-lg font-semibold">Retorno de Áudio</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Use fones de ouvido para evitar microfonia. Envia sua voz/instrumento com efeitos direto para o fone.
      </p>

      <div className="h-3 rounded-full bg-secondary overflow-hidden mb-5">
        <div className="h-full bg-gradient-to-r from-emerald via-amber to-destructive transition-[width] duration-75" style={{ width: `${Math.min(100, level * 140)}%` }} />
      </div>

      <div className="space-y-4">
        <SliderRow label="Volume do retorno" value={gain} onChange={setGain} display={`${Math.round(gain * 100)}%`} />
        <SliderRow label="Reverb (sala)" value={reverb} onChange={setReverb} display={`${Math.round(reverb * 100)}%`} />
        <SliderRow label="Delay (eco)" value={delay} onChange={setDelay} display={`${Math.round(delay * 100)}%`} />
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}

      <button
        onClick={active ? stop : start}
        className={`mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium ${
          active ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        <Power size={18} />
        {active ? "Desligar retorno" : "Ligar retorno"}
      </button>
    </div>
  );
}

function SliderRow({ label, value, onChange, display }: { label: string; value: number; onChange: (v: number) => void; display: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="chord-mono text-xs">{display}</span>
      </div>
      <input type="range" min={0} max={1} step={0.01} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[color:var(--tom)]" />
    </div>
  );
}
