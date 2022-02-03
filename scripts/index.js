var timeNow = moment().format("hh:mm A");
document.getElementById("currentTime").innerHTML = timeNow;

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
  },10000);
}

//accept call
function acceptCall() {
  window.location.replace("./csrCall.html");
}

//decline call
function declineCall() {
  document.getElementById("incomingCallModal").style.display = "none";
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