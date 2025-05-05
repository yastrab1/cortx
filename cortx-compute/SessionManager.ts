// --- Inside SessionManager.ts ---
import { Container } from "dockerode";
import { Duplex } from "node:stream";
import Docker from 'dockerode'; // Needs docker instance

interface SessionData {
    container: Container;
    stream: Duplex;
}

// Map to store promises for ongoing session creations
const creationPromises = new Map<string, Promise<SessionData>>();
const docker = new Docker(); // Or pass it into the manager

export class SessionManager {
    private sessions: { [sessionId: string]: SessionData } = {};

    async getOrCreate(sessionId: string): Promise<SessionData> {
        console.log(`-----> [SessionManager] getOrCreate called for key: '${sessionId}'`);

        if (this.sessions[sessionId]) {
            console.log(`       [SessionManager] Session '${sessionId}' already exists. Returning.`);
            return this.sessions[sessionId];
        }

        if (creationPromises.has(sessionId)) {
            console.log(`       [SessionManager] Session '${sessionId}' creation in progress. Awaiting existing promise.`);
            return creationPromises.get(sessionId)!; // Wait for the ongoing creation
        }

        console.log(`       [SessionManager] Session '${sessionId}' not found and not creating. Starting new creation.`);
        const creationPromise = this.createSessionInternal(sessionId);

        creationPromises.set(sessionId, creationPromise);
        console.log(`       [SessionManager] Creation promise stored for '${sessionId}'.`);

        try {
            const sessionData = await creationPromise;
            console.log(`       [SessionManager] Creation COMPLETE for '${sessionId}'.`);
            return sessionData;
        } finally {
            console.log(`       [SessionManager] Removing creation promise for '${sessionId}'.`);
            creationPromises.delete(sessionId);
        }
    }

    private async createSessionInternal(sessionId: string): Promise<SessionData> {
        try {
            console.log(`       [SessionManager - createInternal] Launching container for '${sessionId}'`);
            const container = await docker.createContainer({
                Image: 'cortx-compute:latest',
                Cmd: ['bash', "-l", "-i"],
                Tty: true, OpenStdin: true, StdinOnce: false, AttachStdin: true,
                AttachStdout: true, AttachStderr: true,
                HostConfig: { AutoRemove: true } // Good practice
            });
            await container.start();
            console.log(`       [SessionManager - createInternal] Attaching stream for '${sessionId}'`);
            const stream = await container.attach({
                stream: true, stdin: true, stdout: true, stderr: true, hijack: true,
            }) as Duplex;

            const sessionData = { container, stream };

            console.log(`       [SessionManager - createInternal] Storing final session data for '${sessionId}'`);
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
        console.log(`-----> [SessionManager] DELETING session: '${sessionId}'`);
        creationPromises.delete(sessionId); // Stop anyone waiting on creation
        const sessionData = this.sessions[sessionId];
        delete this.sessions[sessionId];

        if (sessionData) {
            try {
                sessionData.stream.destroy();
                await sessionData.container.stop().catch(e => {/* Ignore errors if already stopped */});
            } catch (error) {
                console.error(`       [SessionManager] Error during cleanup for '${sessionId}':`, error);
            }
        }
    }
}

export const sessionManager = new SessionManager();