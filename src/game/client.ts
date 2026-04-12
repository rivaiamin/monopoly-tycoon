import { Client } from "colyseus.js";

const client = new Client(window.location.origin.replace(/^http/, "ws"));

export default client;
