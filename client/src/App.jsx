import { useState } from 'react';
import './App.css';
const messages = [
  {
    messages: "Selam endet neh kal"

  }
]

function App() {
  return (
    <>
      <ChatBot />
    </>
  )
}


function ChatBot() {
  const [message, setMessages] = useState('');
  const [input, setInput] = useState('');

  function ReceiveUserInput(e) {
    e.preventDefault();
    setMessages(input);
    setInput('')

  }
  return (

    <div className='chat-bot'>
      <div className="messages">
        {message !== '' && (

          <>
            <div className="message user-message">
              {message}
            </div>

            <div className="message ai-message">

              {messages.map((answer, index) => {
                return <div key={index} >{answer.messages}</div>
              })}

            </div>

          </>

        )}
      </div>

      <div className='chat-AI'>
        <form action="" onSubmit={ReceiveUserInput} >
          <input
            value={input}
            className='input'
            type="text" name="" id=""
            placeholder='What is in your mind?'
            onChange={(e) => setInput(e.target.value)} />
          <button>Send</button>
        </form>




      </div>

    </div>

  )
}

export default App
