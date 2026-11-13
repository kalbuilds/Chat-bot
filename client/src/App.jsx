
import { useState } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Selam! Endet neh? I'm your AI assistant. Ask me anything!",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function receiveUserInput(e) {
    e.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    // Keep a snapshot of the previous conversation.
    const history = messages
      .filter((item) => ["user", "model"].includes(item.role))
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));

    // Display the user's message immediately.
    setMessages((previous) => [
      ...previous,
      { role: "user", text },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: text,
            history,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "model",
          text: data.reply,
        },
      ]);
    } catch (error) {
      setMessages((previous) => [
        ...previous,
        {
          role: "model",
          text: `Sorry, something went wrong: ${error.message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="chat-bot">
      <div className="messages">
        {messages.map((item, index) => (
          <div
            key={index}
            className={`message ${item.role === "user"
              ? "user-message"
              : "bot-message"
              }`}
          >
            {item.text}
          </div>
        ))}

        {loading && (
          <div className="message bot-message">
            Kal's AI is thinking...
          </div>
        )}
      </div>

      <div className="chat-AI">
        <form onSubmit={receiveUserInput}>
          <input
            className="input"
            type="text"
            placeholder="What is in your mind?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
          >
            {loading ? "Thinking..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
