// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  //new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager, RemoteManager);
  // new RemoteGameManager(4, RemoteManager, HTMLActuator, RemoteStorageManager)
});


function game() {
	new GameManager(4, KeyboardInputManager, HTMLActuator, LocalStorageManager, RemoteManager);
}


function remote() {
	new RemoteGameManager(4, RemoteManager, HTMLActuator, RemoteStorageManager)
	window.f.createRemoteConnection()
}