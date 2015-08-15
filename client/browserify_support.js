var httpClient = require('./js/httpClient')
var hat = require('hat')
var Set = require('Set')

var peers

var rack = hat.rack()



var peerId = rack()

var two048

window.requestAnimationFrame(function () {
  two048 = new Two048(peerId)
});
setInterval(function () {

	if (two048.local) {
		registerPeer(peerId, function (err, res, body) {
			if (err) {
				throw new Error('can not register peer')
			} 

			getPeers(console.log)
		})
	} else {
		getPeers(console.log)
	}
	
}, 5000)


function registerPeer (peerId, callback) {
	httpClient.put('/api/peers/'+ peerId, callback)
}

function getPeers() {
	httpClient.get('/api/peers', function (err, res, body) {
		if (err) {
			console.log('error while getting peers')
			return 
		}

		window.peers = new Set(JSON.parse(body))
		window.peers.remove(peerId)

		var html = ''

		ids = window.peers.toArray()
		for (var i = 0; i < ids.length; i++) {
			html += '<input type="button" value="'+ (i + 1) + '" id="'+ids[i]+'"></input>'
		}

		peerEl = document.querySelector('.peers')
		peerEl.innerHTML = html
	})
}

var local = document.querySelector('#local')
local.addEventListener('click', function (e) {
	two048.localGame()
})