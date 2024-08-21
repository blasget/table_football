import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

const Game = ({ connections, bodies, player }) => {
  const sceneRef = useRef(null);
  const player1Ref = useRef(null);
  const player2Ref = useRef(null);
  const ballRef = useRef(null);
  const [score, setScore] = useState({ player1: 0, player2: 0 });

  useEffect(() => {
    const { Engine, Render, Runner, Composite, Bodies, Events } = Matter;

    const engine = Engine.create();
    engine.gravity.y = 0;
    const world = engine.world;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: 800,
        height: 600,
        showAngleIndicator: true,
      },
    });

    Render.run(render);

    const runner = Runner.create();
    Runner.run(runner, engine);

    Composite.add(world, [
      Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
      Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
      Bodies.rectangle(0, 300, 50, 600, { isStatic: true }),
    ]);

    const player1 = Bodies.rectangle(bodies.player1.x ?? 200, bodies.player1.y ?? 300, 40, 40, {
      label: "player1",
      frictionAir: 0.1,
      friction: 0.8,
    });
    const player2 = Bodies.rectangle(bodies.player2.x ?? 600, bodies.player2.y ?? 300, 40, 40, {
      label: "player2",
      frictionAir: 0.1,
      friction: 0.8,
    });

    const ball = Bodies.circle(bodies.ball.x ?? 400, bodies.ball.y ?? 300, 20, {
      restitution: 0.8,
      frictionAir: 0.1,
      friction: 0.8,
      label: "ball",
    });

    const goal1 = Bodies.rectangle(50, 300, 20, 100, {
      isStatic: true,
      label: "goal1",
    });
    const goal2 = Bodies.rectangle(750, 300, 20, 100, {
      isStatic: true,
      label: "goal2",
    });

    Composite.add(world, [player1, player2, ball, goal1, goal2]);

    player1Ref.current = player1;
    player2Ref.current = player2;
    ballRef.current = ball;

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: 800, y: 600 },
    });

    const resetField = () => {
      Matter.Body.setPosition(ball, { x: 400, y: 300 });
      Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      Matter.Body.setPosition(player1, { x: 200, y: 300 });
      Matter.Body.setVelocity(player1, { x: 0, y: 0 });
      Matter.Body.setPosition(player2, { x: 600, y: 300 });
      Matter.Body.setVelocity(player2, { x: 0, y: 0 });
    };

    const onPositionChange = (body) => {
      const positionData = {
        label: body.label,
        x: body.position.x.toFixed(5),
        y: body.position.y.toFixed(5),
      };
      connections.forEach((conn) => {
        conn.send(positionData);
      });
    };

    Events.on(engine, "afterUpdate", () => {
      [player1, player2, ball].forEach((body) => {
        if (
          body.positionPrev.x.toFixed(1) !== body.position.x.toFixed(1) ||
          body.positionPrev.y.toFixed(1) !== body.position.y.toFixed(1)
        ) {
          onPositionChange(body);
        }
      });

      if (Matter.Bounds.overlaps(ball.bounds, goal1.bounds)) {
        setScore((prevScore) => ({
          ...prevScore,
          player2: prevScore.player2 + 1,
        }));
        resetField();
      }

      if (Matter.Bounds.overlaps(ball.bounds, goal2.bounds)) {
        setScore((prevScore) => ({
          ...prevScore,
          player1: prevScore.player1 + 1,
        }));
        resetField();
      }
    });

    const handleKeyDown = (event) => {
      const { key } = event;
      const forceMagnitude = 0.05;
      if(player === 'player1'){
        switch (key) {
            case "ArrowUp":
              Matter.Body.applyForce(player1, player1.position, {
                x: 0,
                y: -forceMagnitude,
              });
              break;
            case "ArrowDown":
              Matter.Body.applyForce(player1, player1.position, {
                x: 0,
                y: forceMagnitude,
              });
              break;
            case "ArrowLeft":
              Matter.Body.applyForce(player1, player1.position, {
                x: -forceMagnitude,
                y: 0,
              });
              break;
            case "ArrowRight":
              Matter.Body.applyForce(player1, player1.position, {
                x: forceMagnitude,
                y: 0,
              });
              break;
            default:
              break;
          }
      }
      if(player === 'player2'){
        switch (key) {
            case "ArrowUp":
              Matter.Body.applyForce(player2, player2.position, {
                x: 0,
                y: -forceMagnitude,
              });
              break;
            case "ArrowDown":
              Matter.Body.applyForce(player2, player2.position, {
                x: 0,
                y: forceMagnitude,
              });
              break;
            case "ArrowLeft":
              Matter.Body.applyForce(player2, player2.position, {
                x: -forceMagnitude,
                y: 0,
              });
              break;
            case "ArrowRight":
              Matter.Body.applyForce(player2, player2.position, {
                x: forceMagnitude,
                y: 0,
              });
              break;
            default:
              break;
          }
      }

     
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Composite.clear(world);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [connections]);

  useEffect(() => {
    if (player1Ref.current && player2Ref.current && ballRef.current) {
      Matter.Body.setPosition(player1Ref.current, { x: bodies.player1.x, y: bodies.player1.y });
      Matter.Body.setPosition(player2Ref.current, { x: bodies.player2.x, y: bodies.player2.y });
      Matter.Body.setPosition(ballRef.current, { x: bodies.ball.x, y: bodies.ball.y });
    }
  }, [bodies]);

  return (
    <div>
      <div ref={sceneRef} />
      <div>
        <p>Player 1 Score: {score.player1}</p>
        <p>Player 2 Score: {score.player2}</p>
      </div>
    </div>
  );
};

export default Game;
