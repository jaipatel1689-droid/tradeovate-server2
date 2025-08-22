// testRunner.js
// Run: node testRunner.js
// One-time install (in project root): npm i node-fetch@2

const fetch = require("node-fetch");

// ---- Config ----
const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
// Put your Supabase-auth user UUID here (the one we've been using):
const USER_ID = process.env.USER_ID || "c61df5bb-d504-4460-9c29-33e26860eee5";

// ---- Helpers ----
async function getJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) throw new Error(JSON.stringify(json));
    return json;
  } catch (e) {
    // If the body isn't JSON (e.g., HTML 404 page), show a helpful error
    throw new Error(
      `Invalid JSON from ${url}\nStatus: ${res.status}\nBody (first 200): ${text.slice(
        0,
        200
      )}`
    );
  }
}

function log(title, data) {
  console.log(`\n=== ${title} ===`);
  console.log(typeof data === "string" ? data : JSON.stringify(data, null, 2));
}

// ---- Tests ----
async function runTests() {
  console.log("=== Running API Tests ===");
  console.log(`BASE_URL: ${BASE_URL}`);
  console.log(`USER_ID : ${USER_ID}`);

  // 1) Create a sample order
  const orderId = `O-${Date.now()}`;
  try {
    const created = await getJson(`${BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        user_id: USER_ID,
        symbol: "AAPL",
        qty: 10,
        price: 150,
        side: "buy",
        status: "open",
      }),
    });
    log("Created Order", created);
  } catch (err) {
    log("Create Order FAILED", err.message);
  }

  // 2) Fetch all orders
  try {
    const orders = await getJson(`${BASE_URL}/orders`);
    log("All Orders", orders);
  } catch (err) {
    log("Get Orders FAILED", err.message);
  }

  // 3) Fetch ledger rows
  try {
    // Your /ledger route currently works without a user param in your setup.
    const ledger = await getJson(`${BASE_URL}/ledger`);
    log("Ledger Rows", ledger);
  } catch (err) {
    log("Get Ledger FAILED", err.message);
  }

  // 4) Fetch dashboard for this USER_ID
  try {
    const dashboard = await getJson(`${BASE_URL}/dashboard/${USER_ID}`);
    log("Dashboard", dashboard);
  } catch (err) {
    log("Get Dashboard FAILED", err.message);
  }

  console.log("\n=== Tests Completed ===");
}

// go!
runTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});

