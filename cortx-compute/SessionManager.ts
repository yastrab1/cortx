// --- Inside SessionManager.ts ---
import { Container } from "dockerode";
import { Duplex } from "node:stream";
import Docker from 'dockerode';
import dotenv from "dotenv"; // Needs docker instance
dotenv.config();
interface SessionData {
    container: Container;
    stream: Duplex;
}

// Map to store promises for ongoing session creations
const creationPromises = new Map<string, Promise<SessionData>>();

let docker:Docker;
export class SessionManager {
    constructor(private docker: Docker = new Docker()) {
        this.docker = docker
    }
    private sessions: { [sessionId: string]: SessionData } = {};

    async getOrCreate(sessionId: string): Promise<SessionData> {

        if (this.sessions[sessionId]) {
            return this.sessions[sessionId];
        }

        if (creationPromises.has(sessionId)) {
            return creationPromises.get(sessionId)!; // Wait for the ongoing creation
        }
        const creationPromise = this.createSessionInternal(sessionId);

        creationPromises.set(sessionId, creationPromise);

        try {
            const sessionData = await creationPromise;
            return sessionData;
        } finally {
            creationPromises.delete(sessionId);
        }
    }

    private async createSessionInternal(sessionId: string): Promise<SessionData> {
        try {
            console.log(`       [SessionManager - createInternal] Launching container for '${sessionId}'`);
            const container = await this.docker.createContainer({
                Image: process.env.CONTAINER_IMAGE,
                Cmd: ['bash', "-l", "-i"],
                Tty: true, OpenStdin: true, StdinOnce: false, AttachStdin: true,
                AttachStdout: false, AttachStderr: true,
                HostConfig: { AutoRemove: true } // Good practice
            });
            await container.start();
            const stream = await container.attach({
                stream: true, stdin: true, stdout: true, stderr: true, hijack: true,
            }) as Duplex;

            const sessionData = { container, stream };

            this.sessions[sessionId] = sessionData;

            return sessionData;
        } catch (error) {
            console.error(`      [SessionManager - createInternal] FAILED to create session '${sessionId}':`, error);
            delete this.sessions[sessionId];
            throw error; // Re-throw so the waiting promise rejects
        }
    }

    get(sessionId: string): SessionData | undefined {
        return this.sessions[sessionId];
    }

    has(sessionId: string): boolean {
        return sessionId in this.sessions;
    }

    async delete(sessionId: string): Promise<void> {
        creationPromises.delete(sessionId); // Stop anyone waiting on creation
        const sessionData = this.sessions[sessionId];
        delete this.sessions[sessionId];

        // if (sessionData) {
        //     try {
        //         sessionData.stream.destroy();
        //         await sessionData.container.stop().catch(e => {/* Ignore errors if already stopped */});
        //     } catch (error) {
        //         console.error(`       [SessionManager] Error during cleanup for '${sessionId}':`, error);
        //     }
        // }
    }
}

console.log(process.env.DOCKER_HOST || "/var/run/docker.sock")
export const sessionManager = new SessionManager(new Docker({socketPath:process.env.DOCKER_HOST || "/var/run/docker.sock"}));