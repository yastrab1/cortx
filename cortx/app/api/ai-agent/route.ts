import { NextResponse } from 'next/server';
import { runEngine } from '@/lib/engine/engine';

export async function POST(req: Request) {
    const { prompt } = await req.json();

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const agentEvents = runEngine(prompt);

    const writeEvents = async () => {
        for await (const event of agentEvents) {
            const eventString = JSON.stringify(event) + '\n'; // TODO: change splitter cause it can be a problem when the data has \n in it
            await writer.write(encoder.encode(eventString));
        }
        writer.close();
    };

    writeEvents().catch(console.error);

    return new NextResponse(readable, {
        headers: {
            'Content-Type': 'application/json', // Or 'text/event-stream' for SSE
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
        },
    });
}
