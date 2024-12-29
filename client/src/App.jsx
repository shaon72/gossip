import { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const ws = useRef(null);
  const [outgoingMessage, setOutgoingMessage] = useState("");
  const [incomingMessages, setIncomingMessages] = useState([]);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/wsserver");
    ws.current.onopen = () => {
      console.log("connected");
    };
    ws.current.onmessage = (event) => {
      setIncomingMessages((prevMessages) => [...prevMessages, event.data]);
    };
    ws.current.onclose = () => {
      console.log("disconnected");
    };
    return () => ws.current.close();
  }, []);

  const sendMessage = () => {
    if(ws.current && ws.current.readyState === 1 && outgoingMessage !== "") {
      setOutgoingMessage(outgoingMessage);
      ws.current.send(outgoingMessage);
    }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div id="incomingMessages"
        className="w-full max-w-lg h-80 p-3 mb-4 bg-gray-200 rounded-lg resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Received messages will appear here...">
        {incomingMessages.map((msg, index) => (
          <div key={index}>{msg}</div>
        ))}
      </div>

      <textarea
        onChange={(e) => setOutgoingMessage(e.target.value)}
        className="w-full max-w-lg h-15 p-4 mb-4 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      ></textarea>

      <button
        onClick={sendMessage}
        className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        Send message
      </button>
    </div>
  )
}

export default App
