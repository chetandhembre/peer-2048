
function Two048(peerId) {
	var self = this
	self.peerId = peerId
	this.local = new GameManager(4, self.peerId, KeyboardInputManager, HTMLActuator, LocalStorageManager, RemoteManager);
	this.remote;

	var peerDiv = document.querySelector('.peers')
	peerDiv.addEventListener("click", function (e) {
		self.remoteGame(e.target.id)
	});
}

Two048.prototype.remoteGame = function (id) {
	if (this.local) {
		this.local.destory()
		this.local = null	
	}

	if (this.remote) {
		this.remote.destory()
		this.remote = null	
	}
	
	
	this.remote = new RemoteGameManager(4, id, RemoteManager, HTMLActuator, RemoteStorageManager)
}

Two048.prototype.localGame = function () {
	if (this.local) {
		this.local.destory()
		this.local = null	
	}

	if (this.remote) {
		this.remote.destory()
		this.remote = null	
	}
	
	this.local = new GameManager(4, self.peerId, KeyboardInputManager, HTMLActuator, LocalStorageManager, RemoteManager);
}

// Wait till the browser is ready to render the game (avoids glitches)



function game() {
	
}


function remote() {
	
	window.f.createRemoteConnection()
}