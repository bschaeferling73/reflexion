import { useState, useEffect } from "react";

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";

const questions = [
  {
    id: "zufriedenheit",
    type: "scale",
    text: "Wie zufrieden bin ich mit meinem heutigen Tag?",
    min: 1,
    max: 10,
    minLabel: "enttäuschend",
    maxLabel: "wunderbar",
  },
  {
    id: "energie",
    type: "scale",
    text: "Wie viel Energie hatte ich heute?",
    min: 1,
    max: 10,
    minLabel: "völlig leer",
    maxLabel: "voller Akku",
  },
  {
    id: "schlaf",
    type: "scale",
    text: "Wie gut habe ich letzte Nacht geschlafen?",
    min: 1,
    max: 10,
    minLabel: "sehr schlecht",
    maxLabel: "traumhaft",
  },
  {
    id: "dankbarkeit",
    type: "text",
    text: "Wofür bin ich heute dankbar?",
    placeholder: "Heute bin ich dankbar für …",
  },
  {
    id: "danke",
    type: "text",
    text: "Wem oder was möchte ich heute \"Danke\" sagen?",
    placeholder: "Danke sage ich heute …",
  },
  {
    id: "gedanken",
    type: "text",
    text: "Was beschäftigt mich heute?",
    placeholder: "Heute bewegt mich …",
  },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 18 && h < 22) return "Guten Abend";
  if (h >= 22 || h < 5) return "Noch so spät?";
  if (h >= 5 && h < 11) return "Guten Morgen";
  return "Hallo";
}

function formatDate() {
  return new Date().toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Stimmungs-Emoji je nach Zufriedenheitswert
function getMoodEmoji(val) {
  if (!val) return "✦";
  if (val <= 3) return "😔";
  if (val <= 5) return "😐";
  if (val <= 7) return "🙂";
  return "😊";
}

export default function ReflexionsApp() {
  const [step, setStep] = useState("start"); // start | questions | summary | done | error
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Animate in on step change
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [step, current]);

  const q = questions[current];

  function handleScale(val) {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  }

  function handleNext() {
    // Save text draft
    if (q.type === "text") {
      setAnswers((prev) => ({ ...prev, [q.id]: draft }));
      setDraft("");
    }
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setStep("summary");
    }
  }

  function handleBack() {
    if (current === 0) {
      setStep("start");
    } else {
      setCurrent((c) => c - 1);
    }
  }

  // Prefill draft when navigating back to text question
  useEffect(() => {
    if (q?.type === "text" && answers[q.id]) {
      setDraft(answers[q.id]);
    } else {
      setDraft("");
    }
  }, [current]);

  async function handleSubmit() {
    setSending(true);
    setErrorMsg("");
    const payload = {
      datum: new Date().toLocaleDateString("de-DE"),
      uhrzeit: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      ...answers,
    };
    try {
      if (!SCRIPT_URL) throw new Error("Keine Apps Script URL konfiguriert.");
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStep("done");
    } catch (e) {
      setErrorMsg(e.message || "Verbindung fehlgeschlagen.");
      setStep("error");
    } finally {
      setSending(false);
    }
  }

  function restart() {
    setAnswers({});
    setDraft("");
    setCurrent(0);
    setStep("start");
  }

  const canProceed =
    q?.type === "scale" ? !!answers[q?.id] : draft.trim().length > 0 || answers[q?.id]?.length > 0;

  // ── RENDER ──────────────────────────────────────────────────────────────────

  return (
    <div style={styles.root}>
      {/* Hintergrund-Akzente */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />

      <div style={{ ...styles.card, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.35s ease, transform 0.35s ease" }}>

        {/* ── START ── */}
        {step === "start" && (
          <div style={styles.center}>
            <div style={styles.moodBig}>{getMoodEmoji(answers.zufriedenheit)}</div>
            <p style={styles.dateLabel}>{formatDate()}</p>
            <h1 style={styles.headline}>{getGreeting()}</h1>
            <p style={styles.sub}>Nimm dir einen Moment für dich.<br />6 kurze Fragen – dein Abend-Reflexion.</p>
            <button style={styles.btnPrimary} onClick={() => setStep("questions")}>
              Starten →
            </button>
          </div>
        )}

        {/* ── FRAGEN ── */}
        {step === "questions" && (
          <div style={styles.questionWrap}>
            {/* Fortschritt */}
            <div style={styles.progressBar}>
              <div style={{ ...styles.progressFill, width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <p style={styles.progressLabel}>{current + 1} / {questions.length}</p>

            <h2 style={styles.questionText}>{q.text}</h2>

            {/* Skala */}
            {q.type === "scale" && (
              <div>
                <div style={styles.scaleRow}>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      style={{
                        ...styles.scaleBtn,
                        ...(answers[q.id] === n ? styles.scaleBtnActive : {}),
                      }}
                      onClick={() => handleScale(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div style={styles.scaleLabels}>
                  <span>{q.minLabel}</span>
                  <span>{q.maxLabel}</span>
                </div>
                {answers[q.id] && (
                  <p style={styles.selectedHint}>Du hast <strong>{answers[q.id]}</strong> gewählt</p>
                )}
              </div>
            )}

            {/* Freitext */}
            {q.type === "text" && (
              <textarea
                style={styles.textarea}
                placeholder={q.placeholder}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                autoFocus
              />
            )}

            <div style={styles.navRow}>
              <button style={styles.btnSecondary} onClick={handleBack}>← Zurück</button>
              <button
                style={{ ...styles.btnPrimary, opacity: canProceed ? 1 : 0.4 }}
                disabled={!canProceed}
                onClick={handleNext}
              >
                {current === questions.length - 1 ? "Zusammenfassung →" : "Weiter →"}
              </button>
            </div>
          </div>
        )}

        {/* ── ZUSAMMENFASSUNG ── */}
        {step === "summary" && (
          <div>
            <h2 style={{ ...styles.headline, fontSize: "1.4rem", marginBottom: "1.5rem" }}>Dein heutiger Abend</h2>
            <p style={{ ...styles.dateLabel, marginBottom: "1.5rem" }}>{formatDate()}</p>

            {/* Zahlen-Block */}
            <div style={styles.scoreRow}>
              {questions.filter((q) => q.type === "scale").map((q) => (
                <div key={q.id} style={styles.scoreBox}>
                  <span style={styles.scoreNum}>{answers[q.id] ?? "–"}</span>
                  <span style={styles.scoreLabel}>{q.id === "zufriedenheit" ? "Zufriedenheit" : q.id === "energie" ? "Energie" : "Schlaf"}</span>
                </div>
              ))}
            </div>

            {/* Freitext-Block */}
            <div style={styles.textSummary}>
              {questions.filter((q) => q.type === "text").map((q) => (
                <div key={q.id} style={styles.textItem}>
                  <p style={styles.textItemLabel}>{q.text}</p>
                  <p style={styles.textItemValue}>{answers[q.id] || <em style={{ opacity: 0.4 }}>–</em>}</p>
                </div>
              ))}
            </div>

            <div style={styles.navRow}>
              <button style={styles.btnSecondary} onClick={() => { setCurrent(questions.length - 1); setStep("questions"); }}>← Bearbeiten</button>
              <button style={styles.btnPrimary} onClick={handleSubmit} disabled={sending}>
                {sending ? "Speichern …" : "Im Sheet speichern ✓"}
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {step === "done" && (
          <div style={styles.center}>
            <div style={styles.moodBig}>🌙</div>
            <h1 style={styles.headline}>Gut gemacht.</h1>
            <p style={styles.sub}>Dein Eintrag wurde gespeichert.<br />Gute Nacht.</p>
            <button style={styles.btnSecondary} onClick={restart}>Neuer Eintrag</button>
          </div>
        )}

        {/* ── ERROR ── */}
        {step === "error" && (
          <div style={styles.center}>
            <div style={styles.moodBig}>⚠️</div>
            <h1 style={{ ...styles.headline, fontSize: "1.4rem" }}>Speichern fehlgeschlagen</h1>
            <p style={{ ...styles.sub, color: "#ff6b6b" }}>{errorMsg}</p>
            <p style={styles.sub}>Prüfe die Apps Script URL in deiner .env Datei.</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1.5rem" }}>
              <button style={styles.btnSecondary} onClick={() => setStep("summary")}>← Zurück</button>
              <button style={styles.btnPrimary} onClick={handleSubmit}>Nochmal versuchen</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── STYLES ──────────────────────────────────────────────────────────────────

const C = {
  bg: "#0f0f14",
  surface: "#16161f",
  border: "#2a2a38",
  accent: "#c8a96e",       // warmes Gold
  accentSoft: "#c8a96e22",
  text: "#e8e4da",
  textMuted: "#7a7a8f",
  scaleActive: "#c8a96e",
  scaleHover: "#2a2a38",
};

const styles = {
  root: {
    minHeight: "100vh",
    background: C.bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: C.text,
    padding: "1rem",
    position: "relative",
    overflow: "hidden",
  },
  bgCircle1: {
    position: "fixed",
    top: "-20vh",
    right: "-15vw",
    width: "50vw",
    height: "50vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, #c8a96e0a 0%, transparent 70%)",
    pointerEvents: "none",
  },
  bgCircle2: {
    position: "fixed",
    bottom: "-20vh",
    left: "-15vw",
    width: "45vw",
    height: "45vw",
    borderRadius: "50%",
    background: "radial-gradient(circle, #4a3f6b0a 0%, transparent 70%)",
    pointerEvents: "none",
  },
  card: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    width: "100%",
    maxWidth: "520px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: "0.75rem",
  },
  moodBig: {
    fontSize: "3.5rem",
    marginBottom: "0.5rem",
  },
  headline: {
    fontSize: "1.8rem",
    fontWeight: "normal",
    letterSpacing: "0.02em",
    color: C.text,
    margin: 0,
  },
  dateLabel: {
    color: C.textMuted,
    fontSize: "0.85rem",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    margin: 0,
  },
  sub: {
    color: C.textMuted,
    fontSize: "0.95rem",
    lineHeight: 1.6,
    margin: "0.5rem 0 1.5rem",
  },
  btnPrimary: {
    background: C.accent,
    color: "#0f0f14",
    border: "none",
    borderRadius: "8px",
    padding: "0.75rem 2rem",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    cursor: "pointer",
    fontWeight: "bold",
    letterSpacing: "0.04em",
    transition: "transform 0.15s, opacity 0.15s",
  },
  btnSecondary: {
    background: "transparent",
    color: C.textMuted,
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "0.75rem 1.5rem",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "border-color 0.2s",
  },
  progressBar: {
    height: "2px",
    background: C.border,
    borderRadius: "2px",
    marginBottom: "0.5rem",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: C.accent,
    borderRadius: "2px",
    transition: "width 0.4s ease",
  },
  progressLabel: {
    color: C.textMuted,
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    textAlign: "right",
    margin: "0 0 2rem",
  },
  questionWrap: {
    display: "flex",
    flexDirection: "column",
  },
  questionText: {
    fontSize: "1.25rem",
    fontWeight: "normal",
    lineHeight: 1.5,
    marginBottom: "2rem",
    color: C.text,
  },
  scaleRow: {
    display: "flex",
    gap: "0.4rem",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: "0.75rem",
  },
  scaleBtn: {
    width: "42px",
    height: "42px",
    borderRadius: "8px",
    border: `1px solid ${C.border}`,
    background: "transparent",
    color: C.textMuted,
    fontSize: "1rem",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  scaleBtnActive: {
    background: C.accent,
    borderColor: C.accent,
    color: "#0f0f14",
    fontWeight: "bold",
    transform: "scale(1.12)",
  },
  scaleLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.75rem",
    color: C.textMuted,
    marginTop: "0.25rem",
    padding: "0 2px",
  },
  selectedHint: {
    textAlign: "center",
    color: C.accent,
    fontSize: "0.85rem",
    marginTop: "1rem",
  },
  textarea: {
    width: "100%",
    background: "#0f0f14",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    color: C.text,
    fontSize: "1rem",
    fontFamily: "inherit",
    lineHeight: 1.6,
    padding: "0.875rem",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  navRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "2rem",
    gap: "0.75rem",
  },
  scoreRow: {
    display: "flex",
    gap: "1rem",
    justifyContent: "center",
    marginBottom: "1.5rem",
  },
  scoreBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: C.accentSoft,
    border: `1px solid ${C.accent}44`,
    borderRadius: "10px",
    padding: "0.75rem 1.25rem",
    minWidth: "80px",
  },
  scoreNum: {
    fontSize: "2rem",
    color: C.accent,
    lineHeight: 1,
  },
  scoreLabel: {
    fontSize: "0.7rem",
    color: C.textMuted,
    letterSpacing: "0.06em",
    marginTop: "0.25rem",
    textTransform: "uppercase",
  },
  textSummary: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "0.5rem",
  },
  textItem: {
    background: "#0f0f14",
    border: `1px solid ${C.border}`,
    borderRadius: "8px",
    padding: "0.75rem 1rem",
  },
  textItemLabel: {
    fontSize: "0.72rem",
    color: C.textMuted,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    margin: "0 0 0.3rem",
  },
  textItemValue: {
    fontSize: "0.95rem",
    color: C.text,
    lineHeight: 1.5,
    margin: 0,
  },
};
