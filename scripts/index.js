var timeNow = moment().format("hh:mm A");
document.getElementById("currentTime").innerHTML = timeNow;
var callDeclined = false;
//show call popup ,after 5 seconds
setTimeout(function () {
  document.getElementById("incomingCallModal").style.display = "initial";
  startCallAcceptingTimer();
}, 2000);

//timer for closing call popup
function startCallAcceptingTimer() {
  var element = document.getElementById("pbar");
  element.classList.toggle("showAnim");
  //hide call popup after some seconds
  setTimeout(function () {
    document.getElementById("incomingCallModal").style.display = "none";
    if(!callDeclined){
      document.getElementById("missedCallContainer").style.visibility = "visible";
    document.getElementById("callStatus").innerHTML = "Call was missed a min ago.";
    document.getElementById("callStatusImage").src = "./assets/callMissed.png";
    }
  },20000);
}

//accept call
function acceptCall() {
  window.location.replace("./csrCall.html");
}

//decline call
function declineCall() {
  document.getElementById("incomingCallModal").style.display = "none";
  document.getElementById("missedCallContainer").style.visibility = "visible";
  document.getElementById("callStatus").innerHTML = "Call was rejected a min ago.";
  document.getElementById("callStatusImage").src = "./assets/callRejected.png";
  document.getElementById("callStatusImage").style.marginBottom ="-30px"
  callDeclined = true;
}


//change variant by numbers 1 - 10;
document.addEventListener("keypress", function (event) {
  var switchVaraint = document.getElementsByClassName("colorVariant");
  switch (event.key) {
          case "a" :
              acceptCall();
          break;
          case "d":
           declineCall();
          break;
          case "r":
           window.location.reload();
          break;
  }
});