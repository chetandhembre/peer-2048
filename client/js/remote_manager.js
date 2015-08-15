function RemoteManager(id, sender) {
	this.events = {}
  this.id = id;
  this.webrtc = new SimpleWebRTC({
    autoRequestMedia: false,
    type: 'data',
    enableDataChannels: true,
    receiveMedia: {
      mandatory: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: false
      }
    }
  });
  
  this.message_id = 0
  this.webrtc.joinRoom(this.id);
  this.onMessage()
}

RemoteManager.prototype.onMessage = function () {
  this.webrtc.on('channelMessage', function (n, channel, message) {
    if (message.payload.message_id > this.message_id) {
      this.message_id = message.payload.message_id
      this.emit('state', message.payload.message) 
    } 
  }.bind(this))
}


RemoteManager.prototype.createRemoteConnection = function (id) {
    this.webrtc.joinRoom(id);
    this.onMessage()
}


RemoteManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

RemoteManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

RemoteManager.prototype.removeListener = function () {
  this.events = {}
}

RemoteManager.prototype.send = function (message) {
  this.message_id++
  this.webrtc.sendDirectlyToAll(this.id, 'state', {
    message: message,
    message_id : this.message_id
  })
}

RemoteManager.prototype.receiver = function (message) {
  this.emit('state', message)
}