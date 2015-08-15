function RemoteManager(sender) {
	this.events = {}
  this.id = 'chetandhembre';
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
  
  this.id = 0
  if (sender) {
    this.webrtc.joinRoom('chetandhembre');
  }
}

RemoteManager.prototype.onMessage = function () {
  this.webrtc.on('channelMessage', function (n, channel, message) {
    if (message.payload.id > this.id) {
      this.id = message.payload.id
      this.emit('state', message.payload.message) 
    } 
  }.bind(this))
}


RemoteManager.prototype.createRemoteConnection = function (id) {
    this.webrtc.joinRoom('chetandhembre');
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

RemoteManager.prototype.send = function (message) {
  this.id++
  this.webrtc.sendDirectlyToAll('chetandhembre', 'state', {
    message: message,
    id : this.id
  })
}

RemoteManager.prototype.receiver = function (message) {
  this.emit('state', message)
}