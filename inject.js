var port = chrome.runtime.connect({name: "channel"});

window.addEventListener("message", function(event) {
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "NEW_MESSAGE")) {
    port.postMessage(event.data);
  }

}, false);

port.onMessage.addListener(function(data) {
  window.postMessage({type: "NEW_RESPONSE", message: data.message, convId: data.convId }, "*");
});

function main(reactGlobal) {

  var readMsgs = {};

  function getChats(){
    var chatListNode = document.querySelector("#pane-side > div");
    var nodeId = reactGlobal.reactDevtoolsAgent.getIDForNode(chatListNode);
    var chatO = reactGlobal.reactDevtoolsAgent.reactElements.get(nodeId)._instance;
    return chatO.props.chats;
  }

  window.addEventListener("message", function(event) {
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type == "NEW_RESPONSE")) {
      var chats = getChats();
      var done = false;
      while(!done){
        for(var i =0; i<chats.length;i++){
          var currentChat = chats[i];
          if(currentChat.id == event.data.convId ){
            currentChat.sendMessage(event.data.message);
            console.log("Got a response from the server : '" + event.data.message + "' in " + event.data.convId );
            done = true;
            break;
          }
        }
      }
    }
  }, false);

  function respondToANewMessage(reactGlobal) {

    var chats = getChats();

    console.log("Polling for new messages...");

    var indexToRespondTo = -1;
    for(var i =0; i<chats.length;i++){
      var currentChat = chats[i];
      var msgCnt = currentChat.msgs.models.length;
      var lastMessage = currentChat.msgs.models[msgCnt-1];
      if(currentChat.unreadCount != 0 && !readMsgs[lastMessage.id._id]){
        console.log("Found a converstation that needs a response : '" + lastMessage.body + "' in " + currentChat.id );
        readMsgs[lastMessage.id._id] = true;
        window.postMessage({type: "NEW_MESSAGE", message: lastMessage.body, convId: currentChat.id }, "*");
      }
    }

    setTimeout(function() {
      respondToANewMessage(reactGlobal);
    }, 1000)
  }

  respondToANewMessage(reactGlobal);

};

var hubotScript = document.createElement('script');
hubotScript.id = 'huobtScript';
hubotScript.appendChild(document.createTextNode("(" + main +")(__REACT_DEVTOOLS_GLOBAL_HOOK__);"));
(document.body || document.head || document.documentElement).appendChild(hubotScript);

