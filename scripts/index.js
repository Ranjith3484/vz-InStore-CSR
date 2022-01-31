var timeNow = moment().format("hh:mm A");
document.getElementById("currentTime").innerHTML = timeNow;

//show call popup ,after 5 seconds
setTimeout(function () {
  // document.getElementById("incomingCallModal").style.display = "initial";
  // startCallAcceptingTimer();
}, 2000);

//timer for closing call popup
function startCallAcceptingTimer() {
  var element = document.getElementById("pbar");
  element.classList.toggle("showAnim");
  //hide call popup after some seconds
  setTimeout(function () {
    document.getElementById("incomingCallModal").style.display = "none";
  }, 7500);
}

//accept call
function acceptCall() {
  window.location.replace("./csrCall.html");
}

//decline call
function declineCall() {
  document.getElementById("incomingCallModal").style.display = "none";
}

document.getElementById('innerWidth').innerHTML = window.innerWidth;
document.getElementById('innerHeight').innerHTML = window.innerHeight;

console.log( window.innerWidth ,  window.innerHeight)