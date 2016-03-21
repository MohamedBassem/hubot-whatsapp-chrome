var port = chrome.runtime.connect({name: "channel"});

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "NEW_MESSAGE")) {
    port.postMessage(event.data);
  }
}, false);

port.onMessage.addListener(function(data) {
  var msg = data.message;
  console.log("Received reply from extension: " + msg);
  $$('div.input').html(msg);
  
  var event = document.createEvent('Event');
  event.initEvent('input', true, true);
  $$('div.input')[0].dispatchEvent(event);

  setTimeout(function() {
    $$('.icon-send').click();
    addHubotScript();
  }, 50);
});

function main(reactGlobal) {

  function respondToANewMessage(reactGlobal) {

    var chatListNode = document.querySelector("#pane-side > div");
    var nodeId = reactGlobal.reactDevtoolsAgent.getIDForNode(chatListNode);
    var chatO = reactGlobal.reactDevtoolsAgent.reactElements.get(nodeId)._instance;
    var chats = chatO.props.chats;

    console.log("Polling for new messages...");

    var indexToRespondTo = -1;
    for(var i =0; i<chats.length;i++){
      if(chats[i].unreadCount != 0){
        indexToRespondTo = i;
      }
    }

    if(indexToRespondTo != -1){
      var msgCnt = chats[indexToRespondTo].msgs.models.length;
      var lastMessage = chats[indexToRespondTo].msgs.models[msgCnt-1].body;
      console.log(lastMessage);
      chatO.selection.set(indexToRespondTo);
      setTimeout(function() {
        chatO.debouncedOpenSelected();
        setTimeout(function() {
          window.postMessage({type: "NEW_MESSAGE", message: lastMessage}, "*");
        }, 1000);
      }, 100);
    }else{
      setTimeout(function() {
        respondToANewMessage(reactGlobal);
      }, 1000)
    }
  }

  respondToANewMessage(reactGlobal);

};

function removeNodeById(id) {
  elem = document.getElementById(id);
  if(elem != null){
    elem.parentNode.removeChild(elem);
  }
}

function addHubotScript() {
  removeNodeById("hubotScript");
  var hubotScript = document.createElement('script');
  hubotScript.id = 'huobtScript';
  hubotScript.appendChild(document.createTextNode("(" + main +")(__REACT_DEVTOOLS_GLOBAL_HOOK__);"));
  (document.body || document.head || document.documentElement).appendChild(hubotScript);
}

addHubotScript();
