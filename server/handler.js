
var peers = require('./peers')

function register (req, reply) {
	var peerId = req.params['peerId']
	console.log(peerId)
	peers.register(peerId)
	return reply('done!!')

}

function getPeers (req, reply) {
	return reply(peers.getPeers())
}

module.exports = {
	register: register,
	getPeers: getPeers
}