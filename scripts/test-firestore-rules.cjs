// Run only via the local emulator: firebase emulators:exec --only firestore --project demo-wolfskin "node scripts/test-firestore-rules.cjs"
const assert = require("node:assert/strict");
const { initializeApp, deleteApp } = require("firebase/app");
const {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  deleteDoc,
  terminate,
} = require("firebase/firestore");

(async () => {
  if (!process.env.FIRESTORE_EMULATOR_HOST)
    throw new Error("Refusing to run without a local Firestore emulator.");
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  assert(
    /^127\.0\.0\.1:|^localhost:/.test(host),
    "Only a local emulator is allowed",
  );
  const project = "demo-wolfskin";
  const app = initializeApp(
    { projectId: project, apiKey: "demo-key" },
    "rules-regressions",
  );
  const db = getFirestore(app);
  const [hostname, port] = host.split(":");
  connectFirestoreEmulator(db, hostname, Number(port));
  let checks = 0;
  try {
    for (const name of [
      "products",
      "images",
      "categories",
      "reels",
      "shopConfig",
      "orders",
      "pendingOrders",
    ]) {
      const seeded = await fetch(
        `http://${host}/v1/projects/${project}/databases/(default)/documents/${name}/fixture`,
        {
          method: "PATCH",
          headers: {
            Authorization: "Bearer owner",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: { name: { stringValue: "Test fixture" } },
          }),
        },
      );
      assert(seeded.ok, await seeded.text());
      if (["orders", "pendingOrders"].includes(name)) {
        await assert.rejects(
          getDoc(doc(db, name, "fixture")),
          (error) => error.code === "permission-denied",
        );
        await assert.rejects(
          getDocs(collection(db, name)),
          (error) => error.code === "permission-denied",
        );
      } else {
        assert((await getDoc(doc(db, name, "fixture"))).exists());
        assert.equal((await getDocs(collection(db, name))).size, 1);
      }
      await assert.rejects(
        setDoc(doc(db, name, "fixture"), { name: "unauthorized update" }),
        (error) => error.code === "permission-denied",
      );
      await assert.rejects(
        setDoc(doc(db, name, "new"), { name: "unauthorized creation" }),
        (error) => error.code === "permission-denied",
      );
      await assert.rejects(
        deleteDoc(doc(db, name, "fixture")),
        (error) => error.code === "permission-denied",
      );
      checks += 5;
    }
    console.log(
      `PASS ${checks} rules checks: catalog readable, orders private, all browser writes denied`,
    );
  } finally {
    await terminate(db);
    await deleteApp(app);
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
