import { withApiBase } from "../../config/api.js";
import React, { useState, useEffect } from "react";
import styles from "./ChatBot.module.css";

export default function ChatBotPanel({ onBotResponse }) {
  const frasesTooltip = [
    "Estoy para apoyarte 💡",
    "¿Tienes alguna duda? 🤔",
    "¿Qué estás buscando? 🏡",
    "Puedo ayudarte 🚀",
  ];

  const [tooltipIndex, setTooltipIndex] = useState(0);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "👋 Hola, soy tu asistente y estoy para apoyarte en tu búsqueda de tu lote o casa ideal. Puedes buscar por precio, rango de precio o una característica en especifico" },
  ]);
  const [input, setInput] = useState("");
  const [minimized, setMinimized] = useState(true);
  const [botTyping, setBotTyping] = useState(false); // 👈 Nuevo estado

  // 🔄 Rotar frases del tooltip cada 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setTooltipIndex((prev) => (prev + 1) % frasesTooltip.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setBotTyping(true); // 👈 Mostrar que el bot escribe

    try {
      const res = await fetch(withApiBase("http://127.0.0.1:8000/api/chatBot/"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: input }),
      });
      const data = await res.json();

      setBotTyping(false); // 👈 Ocultar cuando llega respuesta

      if (data.lotes) {
        onBotResponse({ tipo: "lotes", data: data.lotes });
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Estos son los resultados encontrados en el mapa, si no se visualiza nada es porque no se encontraron resultados ✅" },
        ]);
        setMinimized(true);
        return;
      } else if (data.casas) {
        onBotResponse({ tipo: "casas", data: data.casas });
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Estos son los resultados encontrados en el mapa, si no se visualiza nada es porque no se encontraron resultados ✅" },
        ]);
        setMinimized(true);
        return;
      }

      if (data.respuesta && (data.respuesta.includes("pk") || data.respuesta.includes("fk"))) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Estos son los resultados encontrados en el mapa, si no se visualiza nada es porque no se encontraron resultados ✅" },
        ]);
        setMinimized(true);
      } else {
        const botMsg = { sender: "bot", text: data.respuesta || "✅ Hecho" };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error("Error con el bot:", err);
      setBotTyping(false);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Error al conectar con el bot." },
      ]);
    }
  };

  if (minimized) {
    return (
      <div className={styles.minimizedWrapper}>
        <div
          className={`${styles.minimized} ${styles.iconAnimated}`}
          onClick={() => setMinimized(false)}
        >
          💬
        </div>
        <div className={`${styles.tooltip} ${styles.tooltipAnimated}`}>
          {frasesTooltip[tooltipIndex]}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <span>Asistente</span>
        <button onClick={() => setMinimized(true)}>–</button>
      </div>

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div
            key={i}
            className={`${styles.msg} ${m.sender === "user" ? styles.user : styles.bot}`}
          >
            {m.text}
          </div>
        ))}

        {/* 👇 Mostrar cuando el bot escribe */}
        {botTyping && (
          <div className={`${styles.msg} ${styles.bot}`}>
            <div className={styles.typingDots}>
              <span></span><span></span><span></span>
            </div>
          </div>
        )}
      </div>

      <div className={styles.inputBox}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
        />
        <button onClick={sendMessage}>➤</button>
      </div>
    </div>
  );
}
