import WebSocket from "ws";
import redisClient from "../config/redis.js";
import { io } from "../index.js";
import dotenv from "dotenv";

dotenv.config();

const CACHE_KEY = "metal-prices";
const CACHE_TTL = 60 * 60;

const TOKEN = process.env.ALLTICK_TOKEN;
const WS_URL = `wss://quote.alltick.co/quote-b-ws-api?token=${TOKEN}`;

let ws = null;
let heartbeatInterval = null;

function sendHeartbeat() {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const hb = {
        cmd_id: 22000,
        seq_id: Date.now(),
        trace: "hb_" + Date.now(),
        data: {},
    };

    ws.send(JSON.stringify(hb));
}

function sendSubscription() {
    const subRequest = {
        cmd_id: 22004,
        seq_id: 1,
        trace: "gold_subscription",
        data: {
            symbol_list: [{ code: "GOLD" }],
        },
    };

    ws.send(JSON.stringify(subRequest));
    console.log("Subscription request sent...");
}

export function startMetalSocket() {
    console.log("Connecting to AllTick...");

    ws = new WebSocket(WS_URL);

    ws.on("open", () => {
        console.log("Connected to AllTick");

        sendHeartbeat();
        sendSubscription();

        // heartbeat every 10 sec
        if (!heartbeatInterval) {
            heartbeatInterval = setInterval(sendHeartbeat, 10000);
        }
    });

    ws.on("message", async (raw) => {
        try {   
            const response = JSON.parse(raw);

            if (
                response.cmd_id === 22998 ||
                (response.data && response.data.last_price)
            ) {
                const tick = response.data;

                const payload = {
                    ...tick,
                    updatedAt: Date.now(),
                };

                await redisClient.setEx(
                    CACHE_KEY,
                    CACHE_TTL,
                    JSON.stringify(payload)
                );

                io.emit("metal-prices-updated", payload);
                io.emit("hello" , "Hello")

                console.log(
                    `Gold Price: ${tick.last_price || tick.price}`
                );
                return;
            }

            if (response.msg === "success") {
                console.log(
                    "Server confirmed:",
                    response.cmd_id === 22000 ? "Heartbeat" : "Subscribed"
                );
                return;
            }

            console.log("System message:", response);
        } catch (err) {
            console.error("Message parse error:", err.message);
        }
    });

    ws.on("error", (err) => {
        console.error("WebSocket Error:", err.message);
    });

    ws.on("close", (code, reason) => {
        console.warn(
            `Connection closed (Code: ${code}). Reason: ${reason || "Unknown"
            }`
        );
    });
}