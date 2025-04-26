import {Container} from "dockerode";
import {Duplex} from "node:stream";

export class SessionManager {
    private sessions: { [sessionId: string]: { container: Container, stream: Duplex } } = {};

    get(sessionId: string) {
        return this.sessions[sessionId];
    }

    set(sessionId: string, container: Container, stream: Duplex) {
        this.sessions[sessionId] = { container, stream };
    }

    has(sessionId: string) {
        return sessionId in this.sessions;
    }
}

export const sessionManager = new SessionManager();
