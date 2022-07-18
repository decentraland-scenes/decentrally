import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
// import { uWebSocketsTransport} from "@colyseus/uwebsockets-transport";
// Import demo room handlers
import { LobbyRoom } from 'colyseus';
import express from 'express';
import path from 'path';
import serveIndex from 'serve-index';
import { CustomLobbyRoom } from "./rooms/CustomLobbyRoom";
import { RacingRoom } from "./rooms/RacingRoom";


export default Arena({
    getId: () => "Your Colyseus App",

    // initializeTransport: (options) => new uWebSocketsTransport(options),

    initializeGameServer: (gameServer) => {
        // Define "lobby" room
        gameServer.define("lobby", LobbyRoom);

        // Define "state_handler" room
        gameServer.define("racing_room", RacingRoom)
            .filterBy(['env','titleId','raceDataOptions.levelId',"raceDataOptions.maxPlayers","raceDataOptions.customRoomId"])
            .enableRealtimeListing();

        // Define "custom_lobby" room
        gameServer.define("custom_lobby", CustomLobbyRoom)
            .filterBy(['env','titleId'])
        ;

        gameServer.onShutdown(function(){
            console.log(`game server is going down.`);
          });


    },

    initializeExpress: (app) => {
        app.use('/', serveIndex(path.join(__dirname, "static"), {'icons': true}))
        app.use('/', express.static(path.join(__dirname, "static")));

        // app.use(serveIndex(path.join(__dirname, "static"), {'icons': true}))
        // app.use(express.static(path.join(__dirname, "static")));

        // (optional) attach web monitoring panel
        app.use('/colyseus', monitor());
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
