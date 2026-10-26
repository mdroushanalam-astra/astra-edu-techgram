/** Server-owned process boundary. No browser answer bank or model/network calls. */
import { runConnectedSession, knowledgeSearch } from "./connected_session.js";
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
process.stdout.write(JSON.stringify(request.operation === "knowledge" ? knowledgeSearch(request.pack, request.query) : runConnectedSession(request)));
