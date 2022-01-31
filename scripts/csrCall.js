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
startCallSession();
function endCall() {
  window.location.replace("./index.html");
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

let showingFeature = "FrontCamera";
let rotatedModel = false;
let showingModelPath = {
  staticModel:"",
  rotatedModel:""
}

var devicesBrands = [
  {
    brand: "Apple",
    devices: [
      {
        name: "iPhone 13 Pro",
        displayName: "Apple iPhone 13 Pro",
        variant: [
          {
            color: "#9aafca",
            image: "./assets/iPhone13Pro/iPhone13Pro_Blue.png",
            staticModel: "iPhone13Pro%2FiPhone13Pro_blue.glb",
            rotatedModel: "iPhone13Pro%2FiPhone13Pro_blue_rotated.glb",
            active: true,
          },
          {
            color: "#f5e1c8",
            image: "./assets/iPhone13Pro/iPhone13Pro_Gold.png",
            staticModel: "iPhone13Pro%2FiPhone13Pro_gold.glb",
            rotatedModel: "iPhone13Pro%2FiPhone13Pro_gold_rotated.glb",
          },
          {
            color: "#4c4a46",
            image: "./assets/iPhone13Pro/iPhone13Pro_Graphite.png",
            staticModel: "iPhone13Pro%2FiPhone13Pro_graphite.glb",
            rotatedModel: "iPhone13Pro%2FiPhone13Pro_graphite_rotated.glb",
          },
        ],
      },
    ],
  },
  {
    brand: "Samsung",
    devices: [
      {
        name: "Galaxy Z Flip3",
        displayName: "Samsung Galaxy Z Flip3",
        variant: [
          {
            color: "black",
            image: "./assets/ZFlip3/Zflip3_Black.png",
            staticModel: "zFlip3%2FZflip3_Black_Animated.glb",
            rotatedModel: "zFlip3%2FZflip3_Black_Rotated.glb",
            active: true,
          },
          {
            color: "#f7f4d3",
            image: "./assets/ZFlip3/Zflip3_Cream.png",
            staticModel: "zFlip3%2FZflip3_Cream_Animated.glb",
            rotatedModel: "zFlip3%2FZflip3_Cream_Rotated.glb",
          },
          {
            color: "#57666a",
            image: "./assets/ZFlip3/Zflip3_Green.png",
            staticModel: "zFlip3%2FZflip3_Green_Animated.glb",
            rotatedModel: "zFlip3%2FZflip3_Green_Rotated.glb",
          },
          {
            color: "#c2b1d7",
            image: "./assets/ZFlip3/Zflip3_Lavender.png",
            staticModel: "zFlip3%2FZflip3_Lavender_Animated.glb",
            rotatedModel: "zFlip3%2FZflip3_Lavender_Rotated.glb",
          },
        ],
      },
    ],
  },
  {
    brand: "Google",
    devices: [
      {
        name: "Pixel 6 Pro",
        displayName: "Google Pixel 6 Pro",
        variant: [
          {
            color: "#343538",
            image: "./assets/pixel6Pro/pixel6Pro_StormyBlack.png",
            staticModel: "pixel6Pro%2Fpixel6Pro_StormyBlack.glb",
            rotatedModel: "pixel6Pro%2Fpixel6Pro_StormyBlack_rotated.glb",
            active: true,
          },
          {
            color: "#e9e4e0",
            image: "./assets/pixel6Pro/pixel6Pro_CloudyWhite.png",
            staticModel: "pixel6Pro%2Fpixel6Pro_CloudyWhite.glb",
            rotatedModel: "pixel6Pro%2Fpixel6Pro_CloudyWhite_rotated.glb",
          },
          {
            color: "#fbf2d1",
            image: "./assets/pixel6Pro/pixel6Pro_SortaSunny.png",
            staticModel: "pixel6Pro%2Fpixel6Pro_SortaSunny.glb",
            rotatedModel: "pixel6Pro%2Fpixel6Pro_SortaSunny_rotated.glb",
          },
        ],
      },
    ],
  },
];

var iPhone13Pro = [
  {
    color: "#9aafca",
    staticModel: "iPhone13Pro%2FiPhone13Pro_blue.glb",
    rotatedModel: "iPhone13Pro%2FiPhone13Pro_blue_rotated.glb",
    active: true,
  },
  {
    color: "#f5e1c8",
    staticModel: "iPhone13Pro%2FiPhone13Pro_gold.glb",
    rotatedModel: "iPhone13Pro%2FiPhone13Pro_gold_rotated.glb",
  },
  {
    color: "#4c4a46",
    staticModel: "iPhone13Pro%2FiPhone13Pro_graphite.glb",
    rotatedModel: "iPhone13Pro%2FiPhone13Pro_graphite_rotated.glb",
  },
];

var pixel6Pro = [
  {
    color: "#343538",
    staticModel: "pixel6Pro%2Fpixel6Pro_StormyBlack.glb",
    rotatedModel: "pixel6Pro%2Fpixel6Pro_StormyBlack_rotated.glb",
    active: true,
  },
  {
    color: "#e9e4e0",
    staticModel: "pixel6Pro%2Fpixel6Pro_CloudyWhite.glb",
    rotatedModel: "pixel6Pro%2Fpixel6Pro_CloudyWhite_rotated.glb",
  },
  {
    color: "#fbf2d1",
    staticModel: "pixel6Pro%2Fpixel6Pro_SortaSunny.glb",
    rotatedModel: "pixel6Pro%2Fpixel6Pro_SortaSunny_rotated.glb",
  },
];

var zFlip3 = [
  {
    color: "black",
    staticModel: "zFlip3%2FZflip3_Black_Animated.glb",
    rotatedModel: "zFlip3%2FZflip3_Black_Rotated.glb",
    active: true,
  },
  {
    color: "#f7f4d3",
    staticModel: "zFlip3%2FZflip3_Cream_Animated.glb",
    rotatedModel: "zFlip3%2FZflip3_Cream_Rotated.glb",
  },
  {
    color: "#57666a",
    staticModel: "zFlip3%2FZflip3_Green_Animated.glb",
    rotatedModel: "zFlip3%2FZflip3_Green_Rotated.glb",
  },
  {
    color: "#c2b1d7",
    staticModel: "zFlip3%2FZflip3_Lavender_Animated.glb",
    rotatedModel: "zFlip3%2FZflip3_Lavender_Rotated.glb",
  },
];

function openCloseNav() {
  if (document.getElementById("mySidenav").classList.contains("hideElement")) { //show navbar
    document.getElementById("mySidenav").classList.remove("hideElement");
    document.getElementsByClassName("container")[0].style.display = "none";
    document.getElementsByClassName("sideNavMenu")[0].style.display = "none";
    // show caller tab by default
    document.getElementById("defaultOpenTab").click();
  } else { //hide nav bar 
    document.getElementById("mySidenav").classList.add("hideElement");
    document.getElementsByClassName("container")[0].style.display = "";
    document.getElementsByClassName("sideNavMenu")[0].style.display = "";
  }
}

//caller devices accessories tab
function openTab(evt, tabName) {
  var i, tabContent, tablinks;
  tabContent = document.getElementsByClassName("textTabContent");
  for (i = 0; i < tabContent.length; i++) {
    tabContent[i].style.display = "none";
  }

  tablinks = document.getElementsByClassName("textTab");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" activeBold", "");
  }

  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " activeBold";
}


//hide devices and show brands
function showBrands() {
  document.getElementById("deviceList").style.display = "none";
  document.getElementById("brandList").style.display = "block";
  document.getElementById("deviceShowCase").style.display = "none";
  localStorage.removeItem("showingDevice");
}

//listing brands
var brandList = "<div>";
for (let i of devicesBrands) {
  brandList += `<ul onclick="showDevices('${i.brand}')" id="${i.brand}">${i.brand} <i class="fa fa-chevron-right iconL"></i></ul>`;
}
brandList += "</div>";
document.getElementById("brandList").innerHTML = brandList;

//hide brand and show devices
function showDevices(item) {
  var arr = devicesBrands;

  arr = arr.filter(function (elem) {
    return elem.brand == item;
  });

  //listing devices;
  var devices = arr[0].devices;
  var deviceList = '<div style="display:flex;width:100%;">';
  deviceList +=
    '<i class="fa fa-chevron-left iconL white" onclick="showBrands()" style="margin-top:30px;margin-right:10px;cursor:pointer"></i><span style="display:flex;flex-direction:column;width:100%">';
  for (let i of devices) {
    deviceList += `<ul onclick="showDeviceImage('${
      i.name
    }')" style="margin-bottom:0px;width:100%;"><h6 class="deviceNames" id="${
      i.name
    }"  style="border-bottom:${
      i.name == localStorage.getItem("showingDevice")
        ? "4px solid red"
        : "4px solid white"
    }">${i.name}</h6></ul>`;
  }
  deviceList += "</span></div>";

  document.getElementById("deviceList").innerHTML = deviceList;

  localStorage.setItem("showingBrand", arr[0].brand);
  localStorage.setItem("showingDeviceList", JSON.stringify(arr[0].devices));

  document.getElementById("deviceList").style.display = "block";
  document.getElementById("brandList").style.display = "none";
}

//show device show case area
function showDeviceImage(item) {
  var arr = JSON.parse(localStorage.getItem("showingDeviceList"));
  arr = arr.filter(function (elem) {
    return elem.name == item;
  });
  localStorage.setItem("showingDevice", arr[0].name);
  localStorage.setItem("showingDeviceDisplayName", arr[0].displayName);
  localStorage.setItem("showingDeviceImage", arr[0].variant[0].image);
  localStorage.setItem("showingDeviceVariant", arr[0].variant[0].color);
  localStorage.setItem("showingDeviceModel", arr[0].variant[0].StaticModel);
  localStorage.setItem("showingDeviceQRLink", arr[0].variant[0].qrLink);
  document.getElementById("deviceShowCase").style.display = "block";

  //add border to active device
  var elements = document.getElementsByClassName("deviceNames");
  for (let i of elements) {
    if (i.innerHTML === arr[0].name) {
      document.getElementById(i.innerHTML).style.borderBottom = "4px solid red";
    } else {
      document.getElementById(i.innerHTML).style.borderBottom = "0px solid red";
    }
  }

  var j, tab;
  //removing active style for features section
  tab = document.getElementsByClassName("featuresText");
  for (j = 0; j < tab.length; j++) {
    tab[j].style.fontSize = "28px";
    tab[j].style.fontWejght = "normal";
    tab[j].style.borderBottom = "2px solid #bfbfbf";
  }

  //adding html content for showing device image and by default show first variant
  var showCase = "<div>";
  showCase +=
    "<img src='" +
    localStorage.getItem("showingDeviceImage") +
    " ' class='viewDeviceImage' id='showingDeviceImage' />";
  showCase += "<h6 class='center'>" + arr[0].displayName + "</h6>";
  showCase += " <div class='phoneColorSelector'>";
  //list color variant
  var variant = arr[0].variant;
  var variantList =
    '<div style="display:flex;width:100%;justify-content:space-evenly">';

  for (let i of variant) {
    if (i.color == "white") {
      variantList +=
        "<div style='height:15px;width:15px;border-radius:15px;cursor:pointer;background-color:white;border:1px solid white' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant inactive'></div>";
    } else if (i.active) {
      // mark first variant as selected active
      variantList +=
        "<div style='height:15px;width:15px;border-radius:15px;cursor:pointer;background-color:" +
        i.color +
        " ;box-shadow: 0px 0px 0px 2px white, 0px 0px 0px 3px " +
        i.color +
        ";' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant active'></div>";
    } else {
      variantList +=
        "<div style='height:15px;width:15px;border-radius:15px;cursor:pointer;background-color:" +
        i.color +
        "' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant inactive'></div>";
    }
  }
  variantList += "</div>";
  //end of variant listing
  showCase += variantList;
  showCase += "</div>";
  showCase +=
    "<button class='outlinedButton' onclick='shareDevice()' id='shareQR' disabled='true'>Share</button>";
  showCase += "</div>";
  document.getElementById("deviceShowCase").innerHTML = showCase;
  document.getElementById("refreshModel").click();
  //show 3d model of first variant by default
  showModel({
    modelPath: arr[0].variant[0].staticModel
  });
  showingModelPath.staticModel = arr[0].varainat[0].staticModel;
  showingModelPath.rotatedModel = arr[0].varainat[0].rotatedModel;
}

//device variant ui on video chat container
function showDeviceVariantUI(item) {
  //to dispose previous scene if any
  document.getElementById("refreshModel").click();
  //initial call to show first variant
  showModel({
    modelPath: item[0].staticModel,
  });

  showingModelPath.staticModel = item[0].staticModel;
  showingModelPath.rotatedModel = item[0].rotatedModel;
  //chnage variant by  ui
  var showingDevice = item;
  var variantList = '<div style="height:100%;justify-content:space-evenly;">';

  for (let i of showingDevice) {
    if (i.color == "white") {
      variantList +=
        "<div style='height:30px;width:30px;border-radius:30px;margin-top:20px;cursor:pointer;background-color:white;border:1px solid white' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant inactive'></div>";
    } else if (i.active) {
      // mark first variant as selected active
      variantList +=
        "<div style='height:30px;width:30px;border-radius:30px;margin-top:20px;cursor:pointer;background-color:" +
        i.color +
        " ;box-shadow: 0px 0px 0px 2px white, 0px 0px 0px 3px " +
        i.color +
        ";' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant active'></div>";
    } else {
      variantList +=
        "<div style='height:30px;width:30px;border-radius:30px;margin-top:20px;cursor:pointer;background-color:" +
        i.color +
        "' onclick='changeVariant(`" +
        JSON.stringify(i) +
        "`)' id=" +
        i.color +
        " class='colorVariant inactive'></div>";
    }
  }
  variantList += "</div>";

  document.getElementById("colorVaraintList").innerHTML = variantList;
}

//by default show iphone 13
showDeviceVariantUI(iPhone13Pro);

//change variant by numbers 1 - 10;
document.addEventListener("keypress", function (event) {
  var switchVaraint = document.getElementsByClassName("colorVariant");

  switch (event.key) {
    case "1":
      switchVaraint[0].click();
      break;
    case "2":
      switchVaraint[1].click();
      break;
    case "3":
      switchVaraint[2].click();
      break;
    case "4":
      switchVaraint[3].click();
      break;
    case "5":
      switchVaraint[4].click();
      break;
    case "6":
      switchVaraint[5].click();
      break;
    case "7":
      switchVaraint[6].click();
      break;
    case "8":
      switchVaraint[7].click();
      break;
    case "9":
      switchVaraint[8].click();
      break;
    case "10":
      switchVaraint[9].click();
      break;
    case "a":
      showDeviceUI(iPhone13Pro);
      break;
    case "g":
      showDeviceUI(pixel6Pro);
      break;
    case "s":
      showDeviceUI(zFlip3);
      break;
  }
});

function changeVariant(item) {
  var details = JSON.parse(item);
  var i, tablinks;
  tablinks = document.getElementsByClassName("colorVariant");
  for (i of tablinks) {
    if (i.id === details.color) {
      //add active style
      if (i.id === "white") {
        i.style.boxShadow = "0px 0px 0px 2px white, 0px 0px 0px 3px grey";
        i.style.backgroundColor = "#E8E8E8";
        i.style.border = "0px";
      } else {
        i.style.boxShadow = " 0px 0px 0px 2px white, 0px 0px 0px 3px " + i.id;
      }
    } else {
      //add inactive style
      if (i.id === "white") {
        i.style.boxShadow = "0px 0px 0px 0px white";
        i.style.backgroundColor = "white";
        i.style.border = "1px solid grey";
      } else {
        i.style.boxShadow = "0px 0px 0px 0px white";
      }
    }
  }
  showModel({
    modelPath: details.staticModel,
  });
  showingModelPath.staticModel = details.staticModel;
  showingModelPath.rotatedModel = details.rotatedModel;
}

function showModel(item) {
  //show loader
  document.getElementById("loadingScreen").style.display = "flex";
  //change animate icon color
  rotatedModel = false;
  //enable arrow icon
  document.getElementById("goForward").style.pointerEvents = "";
  document.getElementById("goForward").style.opacity="1";
  document.getElementById("goBackward").style.pointerEvents = "";
  document.getElementById("goBackward").style.opacity="1";
  document.getElementById("switchModel").style.backgroundColor = "#666";
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
            case "ArrowLeft":
              walk.position.x -= 0.1;
              break;
            case "ArrowRight":
              walk.position.x += 0.1;
              break;
            case "ArrowUp":
              walk.position.y += 0.1;
              break;
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

    //hide default babylonjs loader
    BABYLON.SceneLoaderFlags.ShowLoadingScreen = false;

    // show 3d model as top layer
    BABYLON.SceneLoader.Append(
      "https://firebasestorage.googleapis.com/v0/b/vuzix-fa84b.appspot.com/o/",
      item.modelPath + "?alt=media&token=",
      scene,
      function (scene) {
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
        //hide loader
        setTimeout(function () {
          document.getElementById("loadingScreen").style.display = "none";
        }, 1000);
      },
      function (error) {
        //hide loader
        setTimeout(function () {
          document.getElementById("loadingScreen").style.display = "none";
        }, 1000);
        console.error(error);
      }
    );
    //add white background
    scene.clearColor = new BABYLON.Color4(1, 1, 1);

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


  //go forward
  document.getElementById("goForward").addEventListener("click", function () {
    var walk = scene.getMeshByName("__root__");
console.log("go frr")
    // order
    // front camera ==> Back camera ==> sim insert ==> charging port

    switch (showingFeature) {
      case "FrontCamera": // go for back camera
        showingFeature = "BackCamera";
        walk.rotation.x = 0.006;
        walk.rotation.y = -3.09;
        break;
      case "BackCamera": //go for sim insert
        showingFeature = "SimInsert";
        walk.rotation.x = 0.083;
        walk.rotation.y = 4.5;
        break;
      case "SimInsert": //go for charging port
        showingFeature = "ChargingPort";
        walk.rotation.x = -1.45;
        walk.rotation.y = 2.66;
        break;
      case "ChargingPort": // go for front camera
        showingFeature = "FrontCamera";
        walk.rotation.x = 0;
        walk.rotation.y = 0;
        break;
    }
  });

  //go backward
  document.getElementById("goBackward").addEventListener("click", function () {
    var walk = scene.getMeshByName("__root__");
    console.log("go backr")
    switch (showingFeature) {
      case "FrontCamera": // go for charging port
        showingFeature = "ChargingPort";
        walk.rotation.x = -1.45;
        walk.rotation.y = 2.66;
        break;
      case "BackCamera": //go for front camera
        showingFeature = "FrontCamera";
        walk.rotation.x = 0;
        walk.rotation.y = 0;
        break;
      case "SimInsert": //go for back camera
        showingFeature = "BackCamera";
        walk.rotation.x = 0.006;
        walk.rotation.y = -3.09;
        break;
      case "ChargingPort": //go for sim insert
        showingFeature = "SimInsert";
        walk.rotation.x = 0.083;
        walk.rotation.y = 4.5;
        break;
    }
  });

  // Watch for model change and dispose the model
  document
    .getElementById("refreshModel")
    .addEventListener("click", function () {
      //dispose sceneloader
      var walk = scene.getMeshByName("__root__");
      if (walk !== null) {
        walk.dispose();
      }

      //dispose plane
      var plane = scene.getMeshByName("plane");
      if (plane !== null) {
        plane.dispose();
      }
    });
}

function switchModel(){
  document.getElementById("refreshModel").click();
   if(rotatedModel){ //show static model
      showModel({
        modelPath: showingModelPath.staticModel
      })
      rotatedModel = false;
      document.getElementById("switchModel").style.backgroundColor = "#666";
      document.getElementById("goForward").style.pointerEvents = "";
      document.getElementById("goForward").style.opacity="1";
      document.getElementById("goBackward").style.pointerEvents = "";
      document.getElementById("goBackward").style.opacity="1";
   }else{ // show rotated model
    showModel({
      modelPath: showingModelPath.rotatedModel
    })
    rotatedModel = true;
    document.getElementById("switchModel").style.backgroundColor = "green";
    document.getElementById("goForward").style.pointerEvents = "none";
    document.getElementById("goForward").style.opacity="0.5";
    document.getElementById("goBackward").style.pointerEvents = "none";
    document.getElementById("goBackward").style.opacity="0.5";
   }
}