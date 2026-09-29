import "dotenv/config";
import { db } from "./src/db";
import { profiles, inventory, repairs, customers, repairParts, stockMovements } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";
import { repairPartsService } from "./src/services/repair-parts.service";
import { invoiceService } from "./src/services/invoice.service";

async function runTests() {
  console.log("Starting DB verification tests...");
  let passed = 0;
  let failed = 0;

  try {
    const user = await db.select().from(profiles).limit(1).then(r => r[0]);
    if (!user) throw new Error("No user found");
    const techId = user.id;

    let customer = await db.select().from(customers).limit(1).then(r => r[0]);
    if (!customer) {
      customer = await db.insert(customers).values({
        name: "Test Customer",
        phone: "9999999999",
        owner_id: techId
      }).returning().then(r => r[0]);
    }

    // 1. Create a dummy repair
    const repair = await db.insert(repairs).values({
      customer_id: customer.id,
      ticket_no: "TEST-TKT-001",
      issue: "Test Issue",
      status: "diagnosing",
      estimated_cost: "1000.00",
      owner_id: techId
    }).returning().then(r => r[0]);

    // 2. Create a dummy inventory item
    const item = await db.insert(inventory).values({
      name: "TEST Part",
      sku: "TEST-SKU-001",
      stock_level: 10,
      quantity: 10,
      cost_price: "500.00",
      selling_price: "800.00",
      owner_id: techId
    }).returning().then(r => r[0]);

    console.log("Setup complete.");

    // TEST 3: REPAIR PART CONSUMPTION
    try {
      await repairPartsService.consumePart({
        repair_id: repair.id,
        item_id: item.id,
        quantity: 2,
        technician_id: techId
      });
      const checkItem = await db.select().from(inventory).where(eq(inventory.id, item.id)).then(r => r[0]);
      const checkParts = await db.select().from(repairParts).where(eq(repairParts.repair_id, repair.id));
      const checkMovements = await db.select().from(stockMovements).where(eq(stockMovements.item_id, item.id));
      
      if (checkItem.stock_level === 8 && checkParts.length === 1 && checkParts[0].quantity === 2 && checkMovements.length === 1 && checkMovements[0].type === "out") {
        console.log("PASS: Repair Part Consumption");
        passed++;
      } else {
        console.log("FAIL: Repair Part Consumption");
        failed++;
      }
    } catch(e) {
      console.log("FAIL: Repair Part Consumption", e);
      failed++;
    }

    // TEST 4: REPAIR PART REVERSAL
    try {
      const parts = await db.select().from(repairParts).where(eq(repairParts.repair_id, repair.id));
      await repairPartsService.reverseConsumption(parts[0].id);
      
      const checkItem = await db.select().from(inventory).where(eq(inventory.id, item.id)).then(r => r[0]);
      const checkParts = await db.select().from(repairParts).where(eq(repairParts.repair_id, repair.id));
      const checkMovements = await db.select().from(stockMovements).where(eq(stockMovements.item_id, item.id));

      if (checkItem.stock_level === 10 && checkParts.length === 0 && checkMovements.length === 2 && checkMovements[1].type === "in") {
        console.log("PASS: Repair Part Reversal");
        passed++;
      } else {
        console.log("FAIL: Repair Part Reversal");
        failed++;
      }
    } catch(e) {
      console.log("FAIL: Repair Part Reversal", e);
      failed++;
    }

    // TEST 18: CONCURRENCY / DOUBLE-CONSUMPTION TEST
    try {
      const p1 = repairPartsService.consumePart({ repair_id: repair.id, item_id: item.id, quantity: 10, technician_id: techId });
      const p2 = repairPartsService.consumePart({ repair_id: repair.id, item_id: item.id, quantity: 1, technician_id: techId });
      
      let p1Res, p2Res;
      try { p1Res = await p1; } catch(e) { p1Res = "ERR"; }
      try { p2Res = await p2; } catch(e) { p2Res = "ERR"; }

      const checkItem = await db.select().from(inventory).where(eq(inventory.id, item.id)).then(r => r[0]);
      if ((p1Res === "ERR" || p2Res === "ERR") && checkItem.stock_level >= 0) {
        console.log("PASS: Concurrency Double-Consumption Protection");
        passed++;
      } else {
        console.log("FAIL: Concurrency Double-Consumption Protection");
        failed++;
      }
    } catch(e) {
      console.log("FAIL: Concurrency Double-Consumption Protection", e);
      failed++;
    }

    // cleanup
    await db.delete(stockMovements).where(eq(stockMovements.item_id, item.id));
    await db.delete(repairParts).where(eq(repairParts.repair_id, repair.id));
    await db.delete(repairs).where(eq(repairs.id, repair.id));
    await db.delete(inventory).where(eq(inventory.id, item.id));
    console.log("Cleanup complete.");

  } catch (err) {
    console.error("Test setup failed", err);
  }

  console.log(`\nTests completed: ${passed} Passed, ${failed} Failed`);
  process.exit(0);
}

runTests();
