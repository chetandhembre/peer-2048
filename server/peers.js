var Set = require('Set')

var peers = {}

function register (peerId) {
	if (peerId) {
		//store timestamp of registeration against peerId
		peers[peerId] = new Date().getTime()
	}

	console.log(peers)
}


function getPeers () {
	peersList = []
	var timestamp = new Date().getTime()
	for (id in peers) {
		//remove peer when it is not registered in last 10 seconds
		if (timestamp - peers[id] > 10 * 1000) {
			delete peers[id]
		} else {
			peersList.push(id)
		}
	}
	return peersList
}

module.exports = {
	register: register,
	getPeers: getPeers
}