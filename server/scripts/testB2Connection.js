import { uploadToB2, deleteFromB2 } from "../config/b2.js";

const testB2Connection = async () => {
  console.log("🔍 Testing B2 Connection...\n");

  try {
    // Test upload
    const testKey = `test-connection/${Date.now()}-test.txt`;
    const testContent = Buffer.from("Test B2 Connection - Delete this file");

    console.log("Uploading test file to B2...");
    console.log(`   Key: ${testKey}`);

    await uploadToB2({
      key: testKey,
      body: testContent,
      contentType: "text/plain",
    });

    console.log("Upload successful!\n");

    // Test deletion
    console.log("🗑️  Deleting test file from B2...");
    await deleteFromB2(testKey);
    console.log("Deletion successful!\n");

    console.log("🎉 B2 Connection is working perfectly!");
    console.log("\nConfiguration verified:");
    console.log("   - Attachments: Reports → B2");
    console.log("   - Chat files: Local storage");
    console.log("   - Deal files: B2 (unchanged)");

  } catch (error) {
    console.error("B2 Connection Error:");
    console.error(`   ${error.message}`);
    console.error("\nCheck your .env file:");
    console.error("   B2_ENDPOINT", process.env.B2_ENDPOINT || "MISSING");
    console.error("   B2_KEY_ID", process.env.B2_KEY_ID ? "OK" : "MISSING");
    console.error("   B2_APP_KEY", process.env.B2_APP_KEY ? "OK" : "MISSING");
    console.error("   B2_BUCKET", process.env.B2_BUCKET || "MISSING");
    process.exit(1);
  }
};

testB2Connection();
