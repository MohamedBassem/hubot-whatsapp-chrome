var port = chrome.runtime.connect({name: "channel"});

var waitForTheServerTimeout;

window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type == "NEW_MESSAGE")) {
    port.postMessage(event.data);
    waitForTheServerTimeout = setTimeout(function() {
      waitForTheServerTimeout = null;
      window.postMessage({type: "RESTART_FETCHER"}, "*");
    }, 2000);
  }

}, false);

port.onMessage.addListener(function(data) {
  if(waitForTheServerTimeout == null)
    return;
  clearTimeout(waitForTheServerTimeout);
  var msg = data.message;
  $$('div.input').html(msg);

  var event = document.createEvent('Event');
  event.initEvent('input', true, true);
  $$('div.input')[0].dispatchEvent(event);

  setTimeout(function() {
    $$('.icon-send').click();
    window.postMessage({type: "RESTART_FETCHER"}, "*");
  }, 50);
});

function main(reactGlobal) {

  var readMsgs = {};

  window.addEventListener("message", function(event) {
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type == "RESTART_FETCHER")) {
      respondToANewMessage(reactGlobal);
    }
  }, false);

  function respondToANewMessage(reactGlobal) {

    var chatListNode = document.querySelector("#pane-side > div");
    var nodeId = reactGlobal.reactDevtoolsAgent.getIDForNode(chatListNode);
    var chatO = reactGlobal.reactDevtoolsAgent.reactElements.get(nodeId)._instance;
    var chats = chatO.props.chats;

    console.log("Polling for new messages...");

    var indexToRespondTo = -1;
    for(var i =0; i<chats.length;i++){
      var msgCnt = chats[i].msgs.models.length;
      var lastMessage = chats[i].msgs.models[msgCnt-1];
      if(chats[i].unreadCount != 0 && !readMsgs[lastMessage.id._id]){
        indexToRespondTo = i;
        console.log("Found a converstation that needs a response : " + indexToRespondTo);
      }
    }

    if(indexToRespondTo != -1){
      var msgCnt = chats[indexToRespondTo].msgs.models.length;
      var lastMessage = chats[indexToRespondTo].msgs.models[msgCnt-1];
      var lastMessageBody = lastMessage.body;
      readMsgs[lastMessage.id._id] = true;
      console.log(lastMessageBody);
      chatO.selection.set(indexToRespondTo);
      setTimeout(function() {
        chatO.debouncedOpenSelected();
        setTimeout(function() {
          window.postMessage({type: "NEW_MESSAGE", message: lastMessageBody}, "*");
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

var hubotScript = document.createElement('script');
hubotScript.id = 'huobtScript';
hubotScript.appendChild(document.createTextNode("(" + main +")(__REACT_DEVTOOLS_GLOBAL_HOOK__);"));
(document.body || document.head || document.documentElement).appendChild(hubotScript);
