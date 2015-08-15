var Hapi = require('hapi')
var server = new Hapi.Server();

var handler = require('./handler')

server.connection({ 
    port: process.env.PORT || 5000 
});

server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
        directory: {
            path: 'client'
        }
    }
});


server.route({
    method: 'PUT',
    path: '/api/peers/{peerId}',
    handler: handler.register
});


server.route({
    method: 'GET',
    path: '/api/peers',
    handler: handler.getPeers
});
// Start the server
server.start();