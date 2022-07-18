import { Schema, type } from "@colyseus/schema";
import { Client, LobbyRoom } from "colyseus";

class LobbyState extends Schema {
    @type("string") custom: string ;
}
 
export class CustomLobbyRoom extends LobbyRoom {
    async onCreate(options) {
        await super.onCreate(options);

        this.setState(new LobbyState());
    }

    onJoin(client: Client, options) {
        super.onJoin(client, options);
        console.log("joined lobby",client.sessionId)
        this.state.custom = client.sessionId;
    }

    onLeave(client:Client) {
        console.log("left lobby",client.sessionId)
        super.onLeave(client);
    }
}