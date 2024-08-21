import React, { useEffect, useState, useRef } from "react";
import Game from "./Game";
import { Peer } from "peerjs";

const App = () => {
  const myPeerIdRef = useRef("");
  const [peerId, setPeerId] = useState("");
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [player, setPlayer] = useState('')
  const [bodies, setBodies] = useState({
    player1: {
      x: 200,
      y: 300,
    },
    player2: {
      x: 600,
      y: 300,
    },
    ball: {
      x: 400,
      y: 300,
    },
  });

  useEffect(() => {
    const newPeer = new Peer({
      host: "/",
      path: "/peerjs/myapp",
    });

    newPeer.on("open", (id) => {
      myPeerIdRef.current = id;
    });

    newPeer.on("error", (error) => {
      console.error(error);
    });

    newPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        updateState(data);
      });
      setConnections((prevConnections) => [...prevConnections, conn]);
      setPlayer('player1');
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  const connectToPeer = () => {
    if (!myPeerIdRef.current) {
      console.error("myPeerId is not set yet");
      return;
    }
    const conn = peer.connect(peerId);
    conn.on("data", (data) => {
      updateState(data);
    });
    conn.on("open", () => {
      setConnections((prevConnections) => [...prevConnections, conn]);
      setPlayer('player2');
    });
  };

  const updateState = (data) => {
    setBodies((prevBodies) => ({
      ...prevBodies,
      [data.label]: { x: data.x, y: data.y },
    }));
  };

  return (
    <div className="App">
      <input
        type="text"
        id="connect-to-peer"
        value={peerId}
        onChange={(e) => setPeerId(e.target.value)}
      />
      <div className="peerId">{myPeerIdRef.current}</div>
      <button onClick={connectToPeer}>Connect to peer</button>
      <Game bodies={bodies} connections={connections} player={player}/>
    </div>
  );
};

export default App;
