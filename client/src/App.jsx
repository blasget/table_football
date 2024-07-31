import { useEffect, useState, useRef } from "react";
import "./App.css";
import { Peer } from "peerjs";
import Matter, { Bodies, Engine, Render, World } from "matter-js";

function App() {
  const myPeerIdRef = useRef("");
  const [peerId, setPeerId] = useState("");
  const [peer, setPeer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [connections, setConnections] = useState([]);
  const [ball, setBall] = useState({ x: 350, y: 250, size: 10 });

  const engine = useRef(Engine.create());
  const scene = useRef();

  useEffect(() => {
    const newPeer = new Peer({
      host: "/",
      path: "/peerjs/myapp",
    });

    newPeer.on("open", (id) => {
      myPeerIdRef.current = id;
      console.log(id);
    });

    newPeer.on("error", (error) => {
      console.error(error);
    });

    newPeer.on("connection", (conn) => {
      conn.on("data", (data) => {
        updateState(data);
      });
      setConnections((prevConnections) => [...prevConnections, conn]);
    });

    setPeer(newPeer);

    return () => {
      newPeer.destroy();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const currentPlayer = players.find(
        (player) => player.playerId === myPeerIdRef.current
      );
      if (!currentPlayer) return;

      let newPosition = { ...currentPlayer.position };
      switch (event.key) {
        case "w":
          newPosition.y -= 10;
          break;
        case "a":
          newPosition.x -= 10;
          break;
        case "s":
          newPosition.y += 10;
          break;
        case "d":
          newPosition.x += 10;
          break;
        default:
          break;
      }
      updateMyPosition(newPosition);
      checkCollision(newPosition);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [players]);

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
      const newPlayer1 = {
        playerId: myPeerIdRef.current,
        color: "red",
        position: { x: 100, y: 250 },
      };
      const newPlayer2 = {
        playerId: peerId,
        color: "blue",
        position: { x: 600, y: 250 },
      };
      const updatedPlayers = [...players, newPlayer1, newPlayer2];
      const state = { players: updatedPlayers, ball };
      updateState(state);
      conn.send(state);
      setConnections((prevConnections) => [...prevConnections, conn]);
    });
  };

  const updateState = (state) => {
    setPlayers(state.players);
    setBall(state.ball);
  };

  const updateMyPosition = (newPosition) => {
    if (players.length > 0) {
      const updatedPlayers = players.map((player) => {
        return player.playerId === myPeerIdRef.current
          ? { ...player, position: newPosition }
          : player;
      });
      const state = { players: updatedPlayers, ball };
      updateState(state);
      connections.forEach((conn) => conn.send(state));
    }
  };

  const checkCollision = (newPosition) => {
    const dx = newPosition.x - ball.x;
    const dy = newPosition.y - ball.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20 + ball.size) {
      const angle = Math.atan2(dy, dx);
      const speed = 100;
      const newBallPosition = {
        x: ball.x + Math.cos(angle) * speed * -1,
        y: ball.y + Math.sin(angle) * speed * -1,
        size: 10,
      };
      setBall(newBallPosition);
      const state = { players, ball: newBallPosition };
      connections.forEach((conn) => conn.send(state));
    }
  };

  useEffect(() => {
    const cw = 700;
    const ch = 500;

    const render = Render.create({
      element: scene.current,
      engine: engine.current,
      options: {
        width: cw,
        height: ch,
        wireframes: false,
        background: "transparent",
      },
    });

    const middleCircle = Matter.Bodies.circle(350, 250, 150, {
      isStatic: true,
      render: {
        strokeStyle: "rgba(255,255,255,0.6)",
        fillStyle: "#66aa66",
        lineWidth: 15,
      },
    });

    const ballBody = Bodies.circle(ball.x, ball.y, ball.size, {
      restitution: 0.8,
      render: {
        fillStyle: "black",
      },
      label: "ball",
    });

    const playerBodies = players.map((player) =>
      Bodies.circle(player.position.x, player.position.y, 20, {
        render: {
          fillStyle: player.color,
        },
        label: player.playerId,
      })
    );

    const goals = [
      Bodies.rectangle(0, 250, 30, 200, {
        isStatic: true,
        render: { fillStyle: "red" },
      }),
      Bodies.rectangle(cw, 250, 30, 200, {
        isStatic: true,
        render: { fillStyle: "blue" },
      }),
    ];

    // Add the middle circle first to ensure it's in the background
    World.add(engine.current.world, [middleCircle]);

    // Add the ball body and other elements to the world
    World.add(engine.current.world, [
      Bodies.rectangle(cw / 2, -10, cw, 20, { isStatic: true }),
      Bodies.rectangle(-10, ch / 2, 20, ch, { isStatic: true }),
      Bodies.rectangle(cw / 2, ch + 10, cw, 20, { isStatic: true }),
      Bodies.rectangle(cw + 10, ch / 2, 20, ch, { isStatic: true }),
      ballBody,
      ...goals,
      ...playerBodies,
    ]);

    // Run the engine
    Matter.Runner.run(engine.current);
    Render.run(render);

    // Unmount
    return () => {
      Render.stop(render);
      World.clear(engine.current.world);
      Engine.clear(engine.current);
      render.canvas.remove();
      render.canvas = null;
      render.context = null;
      render.textures = {};
    };
  }, [players, ball]);

  useEffect(() => {
    const ballBody = engine.current.world.bodies.find(
      (body) => body.label === "ball"
    );
    if (ballBody) {
      Matter.Body.setPosition(ballBody, { x: ball.x, y: ball.y });
    }
  }, [ball]);

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          id="connect-to-peer"
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
        />
        <div className="peerId">{myPeerIdRef.current}</div>
        <button onClick={connectToPeer}>Connect to peer</button>
      </header>
      <div
        ref={scene}
        style={{ width: "700px", height: "500px", backgroundColor: "#66aa66" }}
      />
    </div>
  );
}

export default App;
