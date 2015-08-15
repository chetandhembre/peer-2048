var Hapi = require('hapi')
var server = new Hapi.Server();
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


// Start the server
server.start();