function startCallSession() {
  //webrtc starts here
  "use strict";
  const MESSAGE_TYPE = {
    SDP: "SDP",
    CANDIDATE: "CANDIDATE",
  };
  const MAXIMUM_MESSAGE_SIZE = 65535;
  const END_OF_FILE_MESSAGE = "EOF";
  let code = 987654321;
  let peerConnection;
  let signaling;
  const senders = [];
  const startChat = async () => {
    try {
      var canvas = document.getElementById("render3DModel");
      let userMediaStream = canvas.captureStream(30);
      navigator.mediaDevices
        .getUserMedia({
          audio: true,
        })
        .then((audioStream) => {
          audioStream.getAudioTracks().forEach((track) => {
            userMediaStream.addTrack(track);
          });
          console.log("canv source: ", userMediaStream.getAudioTracks()); // prints  []
        });

      signaling = new WebSocket("wss://videochat-app-bj.herokuapp.com");

      setTimeout(function () {
        peerConnection = createPeerConnection();
        addMessageHandler();
        var canvas = document.getElementById("render3DModel");
        let userMediaStream = canvas.captureStream(30);
        navigator.mediaDevices
          .getUserMedia({
            audio: true,
          })
          .then((audioStream) => {
            audioStream.getAudioTracks().forEach((track) => {
              userMediaStream.addTrack(track);
            });
            userMediaStream
              .getTracks()
              .forEach((track) =>
                senders.push(peerConnection.addTrack(track, userMediaStream))
              );
            document

              .getElementById("myMic")

              .addEventListener("click", function () {
                audioChange(userMediaStream);
              });
          });
      }, 10000);
    } catch (err) {
      console.error(err);
    }
  };

  startChat();

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onnegotiationneeded = async () => {
      await createAndSendOffer();
    };

    pc.onicecandidate = (iceEvent) => {
      if (iceEvent && iceEvent.candidate) {
        sendMessage({
          message_type: MESSAGE_TYPE.CANDIDATE,
          content: iceEvent.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const video = document.getElementById("customerVideoElement");
      video.srcObject = event.streams[0];
      console.log("live streaming--->");
    };

    pc.ondatachannel = (event) => {
      const { channel } = event;
      channel.binaryType = "arraybuffer";

      const receivedBuffers = [];
      channel.onmessage = async (event) => {
        const { data } = event;
        try {
          if (data !== END_OF_FILE_MESSAGE) {
            receivedBuffers.push(data);
          } else {
            const arrayBuffer = receivedBuffers.reduce((acc, arrayBuffer) => {
              const tmp = new Uint8Array(
                acc.byteLength + arrayBuffer.byteLength
              );
              tmp.set(new Uint8Array(acc), 0);
              tmp.set(new Uint8Array(arrayBuffer), acc.byteLength);
              return tmp;
            }, new Uint8Array());
            const blob = new Blob([arrayBuffer]);
            downloadFile(blob, channel.label);
            channel.close();
          }
        } catch (err) {
          console.log("File transfer failed");
        }
      };
    };

    pc.onconnectionstatechange = function (event) {
      switch (pc.connectionState) {
        case "connected":
          break;
        case "disconnected":
        case "failed":
          endCall();
          break;
        case "closed":
          endCall();
          break;
      }
    };

    return pc;
  };

  const addMessageHandler = () => {
    signaling.onmessage = async (message) => {
      const data = JSON.parse(message.data);
      if (!data) {
        return;
      }
      const { message_type, content } = data;
      try {
        if (message_type === MESSAGE_TYPE.CANDIDATE && content) {
          await peerConnection.addIceCandidate(content);
        } else if (message_type === MESSAGE_TYPE.SDP) {
          if (content.type === "offer") {
            await peerConnection.setRemoteDescription(content);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            sendMessage({
              message_type: MESSAGE_TYPE.SDP,
              content: answer,
            });
          } else if (content.type === "answer") {
            await peerConnection.setRemoteDescription(content);
          } else {
            console.log("Unsupported SDP type.");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
  };

  const sendMessage = (message) => {
    signaling.send(
      JSON.stringify({
        ...message,
        code,
      })
    );
  };

  const createAndSendOffer = async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    sendMessage({
      message_type: MESSAGE_TYPE.SDP,
      content: offer,
    });
  };

  //webrtc ends here
}

function endCall() {
  window.location.reload();
  const mediaStream = clientVideo.srcObject;
  const mediaTracks = mediaStream.getTracks();
  //stop all tracks
  mediaTracks.forEach((track) => track.stop());
}

function audioChange(userMediaStream) {
  const mediaTracks = userMediaStream.getTracks();
  if (document.getElementById("myMic").classList.contains("active")) {
    //mutemic ui
    document.getElementById("myMic").classList.add("inactive");
    document.getElementById("myMic").classList.add("crossLine");
    document.getElementById("myMic").classList.remove("active");
  
    //remove audio track
    mediaTracks.forEach(function (device) {
      if (device.kind === "audio") {
        device.enabled = false; //
        device.muted = true;
      }
    });
  } else {
    //unmutemic ui
    document.getElementById("myMic").classList.add("active");
    document.getElementById("myMic").classList.remove("inactive");
    document.getElementById("myMic").classList.remove("crossLine");
   
    //add audio track
    mediaTracks.forEach(function (device) {
      if (device.kind === "audio") {
        device.enabled = true;
        device.muted = false;
      }
    });
  }
}

//initial call to show webcam
showModel();

function showModel() {

  //show 3d model

  const modelCanvas = document.getElementById("render3DModel"); // Get the canvas element
  modelCanvas.setAttribute("width", window.innerWidth);

  const engine = new BABYLON.Engine(modelCanvas, true); // Generate the BABYLON 3D engine

  // Add your code here matching the playground format

  const createScene = () => {
    const scene = new BABYLON.Scene(engine);
    //change background color
    scene.clearColor = new BABYLON.Color3(0, 1, 0);
    // Parameters: name, alpha, beta, radius, target position, scene
    var camera = new BABYLON.FreeCamera(
      "Camera",
      new BABYLON.Vector3(0, 1, -15),
      scene
    );
    // Add lights to the scene
    var light1 = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(1, 1, 0),
      scene
    );
    light1.intensity = 2;

    //keyboard events for moving the model
    scene.onKeyboardObservable.add((kbInfo) => {
      document.getElementById("render3DModel").focus();
      let walk = scene.getMeshByName("__root__");
      switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYDOWN:
          switch (kbInfo.event.key) {
            case "a":
            case "ArrowLeft":

              walk.position.x -= 0.1;
              break;
            case "d":
            case "ArrowRight":
              walk.position.x += 0.1;
              break;
            case "w":
            case "ArrowUp":
              walk.position.y += 0.1;
              break;
            case "s":
            case "ArrowDown":
              walk.position.y -= 0.1;
              break;
            case "z":
            case "Z":
              walk.scaling.x += 0.1;
              walk.scaling.y += 0.1;
              walk.scaling.z -= 0.1;
              break;
            case "u":
            case "U":
              walk.scaling.x -= 0.1;
              walk.scaling.y -= 0.1;
              walk.scaling.z += 0.1;
              break;
          case "f":
          case "F":
            walk.rotation.x = 0;
            walk.rotation.y = 0;
      
            walkRotation.x = 0;
            walkRotation.y = 0;
            break;
         case "b":
         case "B":
          walk.rotation.x = 0.006;
          walk.rotation.y = -3.09;
    
          walkRotation.x = parseFloat(0.006);
          walkRotation.y = parseFloat(-3.09);
          break;
        case "i":
        case "I":
          walk.rotation.x = 0.083;
          walk.rotation.y = 4.5;
    
          walkRotation.x = parseFloat(0.083);
          walkRotation.y = parseFloat(4.5);
          break;
        case "p":
        case "P":
          walk.rotation.x = -1.45;
          walk.rotation.y = 2.66;
    
          walkRotation.x = parseFloat(-1.45);
          walkRotation.y = parseFloat(2.66);
          break;
          }
      }
    });

    //rotate using mouse
    let currentPosition = { x: 0, y: 0 };
    var currentRotation = { x: 0, y: 0 };

    let clicked = false;

    scene.onPointerObservable.add((pointerInfo) => {
      document.getElementById("render3DModel").focus();
      var walk = scene.getMeshByName("__root__");
      switch (pointerInfo.type) {
        case BABYLON.PointerEventTypes.POINTERDOWN:
          currentPosition.x = pointerInfo.event.clientX;
          currentPosition.y = pointerInfo.event.clientY;
          currentRotation.x = walk.rotation.x;
          currentRotation.y = walk.rotation.y;
          clicked = true;
          break;
        case BABYLON.PointerEventTypes.POINTERUP:
          clicked = false;
          break;
        case BABYLON.PointerEventTypes.POINTERMOVE:
          if (!clicked) {
            return;
          }
          if (walk !== null) {
            walk.rotation.y =
              currentRotation.y -
              (pointerInfo.event.clientX - currentPosition.x) / 100.0;

            walk.rotation.x =
              currentRotation.x +
              (pointerInfo.event.clientY - currentPosition.y) / 100.0;
          }
          break;
        case BABYLON.PointerEventTypes.POINTERWHEEL:
          break;
        case BABYLON.PointerEventTypes.POINTERPICK:
          console.log("POINTER PICK");
          break;
        case BABYLON.PointerEventTypes.POINTERTAP:
          break;
        case BABYLON.PointerEventTypes.POINTERDOUBLETAP:
          break;
      }
    });

    // This attaches the camera to the canvas
    camera.attachControl(modelCanvas, true);
  
      // show 3d model as top layer
    BABYLON.SceneLoader.Append("./", "./assets/iPhone13Pro_blue.glb", scene, function (scene) {
        scene.createDefaultCameraOrLight(false, true, false);

        var walk = scene.getMeshByName("__root__");

        //initialize the model position
        walk.position.x = 0;
        walk.position.y = 0;

        walk.scaling.z = -1;
        walk.scaling.x = 0.9;
        walk.scaling.y = 0.9;

        //pushing rotation object to enable camera features
        walk.rotation = new BABYLON.Vector3(walk.rotation.x, walk.rotation.y);

        //pushing position object to enable camera features
        walk.position = new BABYLON.Vector3(walk.position.x, walk.position.y);

        //pushing scaling object to enable camera features
        walk.scaling = new BABYLON.Vector3(
          walk.scaling.x,
          walk.scaling.y,
          walk.scaling.z
        );
       
    });
    //add white background
    scene.clearColor = new BABYLON.Color4( 1,1,1);
  
    return scene;
  };

  

  const scene = createScene();

  engine.stopRenderLoop();
  // Register a render loop to repeatedly render the scene
  engine.runRenderLoop(function () {
    scene.render();
  });

  // Watch for browser/canvas resize events
  window.addEventListener("resize", function () {
    engine.resize();
  });

  let showingFeature = "FrontCamera"

  //go forward
  document.getElementById("goForward").addEventListener("click",function(){
    var walk = scene.getMeshByName("__root__");

    // order
    // front camera ==> Back camera ==> sim insert ==> charging port
 
    switch (showingFeature) {
      case "FrontCamera": // go for back camera
        showingFeature = "BackCamera"
        walk.rotation.x = 0.006;
        walk.rotation.y = -3.09;
        break;
      case "BackCamera": //go for sim insert
        showingFeature = "SimInsert"
        walk.rotation.x = 0.083;
        walk.rotation.y = 4.5;
        break;
      case "SimInsert": //go for charging port
        showingFeature = "ChargingPort"
        walk.rotation.x = -1.45;
        walk.rotation.y = 2.66;
        break;
      case "ChargingPort": // go for front camera
        showingFeature = "FrontCamera"
        walk.rotation.x = 0;
        walk.rotation.y = 0;
        break;
    }
  })

  //go backward
  document.getElementById("goBackward").addEventListener("click",function(){
    var walk = scene.getMeshByName("__root__");

    switch (showingFeature) {
      case "FrontCamera": // go for charging port
      showingFeature = "ChargingPort"
      walk.rotation.x = -1.45;
      walk.rotation.y = 2.66;
        break;
      case "BackCamera": //go for front camera
      showingFeature = "FrontCamera"
      walk.rotation.x = 0;
      walk.rotation.y = 0;
        break;
      case "SimInsert": //go for back camera
      showingFeature = "BackCamera"
      walk.rotation.x = 0.006;
      walk.rotation.y = -3.09;
        break;
      case "ChargingPort": //go for sim insert
      showingFeature = "SimInsert"
      walk.rotation.x = 0.083;
      walk.rotation.y = 4.5;
        break;
    }
  })
}
