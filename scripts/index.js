function acceptCall(){
  window.location.replace('./csrCall.html')
}


function declineCall(){
    document.getElementById("incomingCall").style.display = "none";
}

setTimeout(function(){
    document.getElementById("incomingCall").style.display = "flex";
},3000)