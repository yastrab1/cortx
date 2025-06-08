interface callCommandBody {
    command: string;
    apiKey: string;
    sessionID: string;
}

interface checkCommandType {
    completed: boolean;
    result: string;
}

export async function POST(request: Request) {
    try {
        const awsFuncURL = process.env.AWS_URL;

        if (request.method != "POST") {
            return Response.error()
        }
        const {command, apiKey, sessionID} = await request.json() as callCommandBody;

        const createInstanceQuery = `${awsFuncURL}/createInstance?secretKey=${apiKey}&sessionID=${sessionID}`;
        const instanceResponse = await fetch(createInstanceQuery)
        const instanceResponseJson = await instanceResponse.json()
        if (!instanceResponse.ok) {
            return Response.json("Failed to create instance" + instanceResponseJson)
        }
        console.log("Creating instance: " + instanceResponseJson.toString())
        await new Promise(resolve => setTimeout(resolve,1000))
        const initiateCommandQuery = `${awsFuncURL}/initiateCommand?secretKey=${apiKey}&sessionID=${sessionID}`;
        const initiateResponse = await fetch(initiateCommandQuery, {
            method: "POST",
            body: JSON.stringify({
                command: command
            })
        })

        const initiateResponseJson = await initiateResponse.json()

        console.log("Initiaitng command: " + initiateResponseJson.toString())
        if (!initiateResponse.ok) {
            return Response.json("Failed to initiate query" + initiateResponseJson)
        }

        const {instanceID, commandID} = await initiateResponse.json() as { instanceID: string, commandID: string };

        const checkCommandQuery = `${awsFuncURL}/checkCommand?secretKey=${apiKey}&sessionID=${sessionID}&instanceID=${instanceID}&commandID=${commandID}`;
        while (true) {
            console.log("Polling: " + instanceResponseJson)
            const response = await fetch(checkCommandQuery)

            const body = await response.json() as checkCommandType;
            if (!response.ok) {
                return Response.json("Failed to check command" + body)
            }
            if (body.completed) {
                return Response.json({result: body.result});
            }
            await new Promise(resolve => setTimeout(resolve, 1000));

        }
    } catch (e) {
        console.log(e)
        return Response.json((e as Error).toString())
    }

}