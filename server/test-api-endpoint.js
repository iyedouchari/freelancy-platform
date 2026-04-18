// Quick test to verify the request data includes client info
import fetch from "node-fetch";

async function testApiEndpoint() {
  try {
    console.log("\nTesting API Endpoint /requests...\n");

    const response = await fetch("http://localhost:4000/api/requests?status=Ouverte&limit=2", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log("API Response:");
    console.log(JSON.stringify(data, null, 2).substring(0, 1000) + "...");

    if (data.data && Array.isArray(data.data)) {
      const firstRequest = data.data[0];
      if (firstRequest) {
        console.log("\nFirst Request Details:");
        console.log("  - ID:", firstRequest.id);
        console.log("  - Title:", firstRequest.title);
        console.log("  - Client Name:", firstRequest.clientName);
        console.log("  - Client Avatar URL:", firstRequest.clientAvatarUrl ? "YES" : "NO");
      }
    }

    console.log("\nTest complete!\n");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testApiEndpoint();
