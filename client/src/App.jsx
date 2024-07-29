import { useEffect, useState } from "react";
import "./App.css";
import { Peer } from "peerjs";

function App() {
  const [myPeerId, setMyPeerId] = useState("");
  const [peerId, setPeerId] = useState("");
  const [peer, setPeer] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const newPeer = new Peer({
      host: "/",
      path: "/peerjs/myapp",
    });

    newPeer.on("open", (id) => {
      setMyPeerId(id);
    });

    newPeer.on("error", (error) => {
      console.error(error);
    });

    newPeer.on("connection", (conn) => {
      logMessage("incoming peer connection!");
      conn.on("data", (data) => {
        logMessage(`received: ${data}`);
      });
      conn.on("open", () => {
        conn.send("hello!");
      });
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const logMessage = (message) => {
    setChatMessages((prevMessages) => [...prevMessages, message]);
  };

  const connectToPeer = () => {
    logMessage(`Connecting to ${peerId}...`);

    const conn = peer.connect(peerId);
    conn.on("data", (data) => {
      logMessage(`received: ${data}`);
    });
    conn.on("open", () => {
      conn.send("hi!");
    });
  };

  const sendMessage = () => {
    if (peer && inputMessage) {
      const conn = peer.connect(peerId);
      conn.on("open", () => {
        conn.send(inputMessage);
        logMessage(`sent: ${inputMessage}`);
        setInputMessage("");
      });
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <video className="remote-video" autoPlay></video>
        <input
          type="text"
          id="connect-to-peer"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
        />
        <div className="peerId">{myPeerId}</div>
        <button onClick={connectToPeer}>Connect to peer</button>
        <div className="messages">
          {chatMessages.map((msg, index) => (
            <div key={index}>{msg}</div>
          ))}
        </div>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </header>
    </div>
  );
}

export default App;
