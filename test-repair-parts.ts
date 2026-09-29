import { db } from "@/db";
import { inventory, repairs, repairParts, stockMovements } from "@/db/schema";
import { eq } from "drizzle-orm";
import { repairPartsService } from "@/services/repair-parts.service";

async function runTests() {
  console.log("Starting tests...");

  let testRepair = null;
  try {
    const res = await db.insert(repairs).values({
      ticket_no: "TEST-TICKET",
      issue: "Test issue",
      status: "received",
      owner_id: "00000000-0000-0000-0000-000000000000",
    }).returning();
    testRepair = res[0];
  } catch (e) {
    testRepair = null;
  }

  let ownerId = "00000000-0000-0000-0000-000000000000";
  // Find a valid profile
  const { profiles } = await import("@/db/schema");
  const profileList = await db.select().from(profiles).limit(1);
  if (profileList.length > 0) {
    ownerId = profileList[0].id;
  } else {
    // Insert a dummy profile
    const [p] = await db.insert(profiles).values({
      id: ownerId,
      name: "Test User",
      role: "admin",
      status: "active"
    }).returning();
    ownerId = p.id;
  }

  const [repair] = await db.insert(repairs).values({
    ticket_no: "TEST-TICKET",
    issue: "Test issue",
    status: "received",
    owner_id: ownerId,
  }).returning();

  const [item] = await db.insert(inventory).values({
    name: "Test Part",
    cost_price: 100,
    selling_price: 150,
    stock_level: 10,
    quantity: 10,
    owner_id: ownerId,
  }).returning();

  console.log(`Setup complete. Item ID: ${item.id}, Repair ID: ${repair.id}`);

  try {
    // TEST 1
    console.log("TEST 1: Consume 1 (Stock 10 -> 9)");
    await repairPartsService.consumePart({
      repair_id: repair.id,
      item_id: item.id,
      quantity: 1,
      technician_id: ownerId
    });
    let check = await db.select().from(inventory).where(eq(inventory.id, item.id));
    if (check[0].stock_level !== 9) throw new Error("TEST 1 Failed");
    console.log("TEST 1 Passed");

    // TEST 2
    console.log("TEST 2: Consume 3 (Stock 9 -> 6, since we didn't reset, but let's reset to 10)");
    await db.update(inventory).set({ stock_level: 10, quantity: 10 }).where(eq(inventory.id, item.id));
    await repairPartsService.consumePart({
      repair_id: repair.id,
      item_id: item.id,
      quantity: 3,
      technician_id: ownerId
    });
    check = await db.select().from(inventory).where(eq(inventory.id, item.id));
    if (check[0].stock_level !== 7) throw new Error("TEST 2 Failed");
    console.log("TEST 2 Passed");

    // TEST 3
    console.log("TEST 3: Consume > Stock (Stock 2 -> consume 3)");
    await db.update(inventory).set({ stock_level: 2, quantity: 2 }).where(eq(inventory.id, item.id));
    try {
      await repairPartsService.consumePart({
        repair_id: repair.id,
        item_id: item.id,
        quantity: 3,
        technician_id: ownerId
      });
      throw new Error("TEST 3 Failed - should have rejected");
    } catch (e: any) {
      if (e.message.includes("Insufficient stock")) {
        console.log("TEST 3 Passed");
      } else {
        throw e;
      }
    }

    // TEST 4
    console.log("TEST 4: Reverse consumption");
    await db.update(inventory).set({ stock_level: 10, quantity: 10 }).where(eq(inventory.id, item.id));
    const part = await repairPartsService.consumePart({
      repair_id: repair.id,
      item_id: item.id,
      quantity: 2,
      technician_id: ownerId
    });
    check = await db.select().from(inventory).where(eq(inventory.id, item.id));
    if (check[0].stock_level !== 8) throw new Error("TEST 4 Setup Failed");
    
    await repairPartsService.reverseConsumption(part.id);
    check = await db.select().from(inventory).where(eq(inventory.id, item.id));
    if (check[0].stock_level !== 10) throw new Error("TEST 4 Failed");
    console.log("TEST 4 Passed");

    // TEST 5
    console.log("TEST 5: Duplicate prevention / Simultaneous request");
    await db.update(inventory).set({ stock_level: 1, quantity: 1 }).where(eq(inventory.id, item.id));
    
    const p1 = repairPartsService.consumePart({ repair_id: repair.id, item_id: item.id, quantity: 1, technician_id: ownerId });
    const p2 = repairPartsService.consumePart({ repair_id: repair.id, item_id: item.id, quantity: 1, technician_id: ownerId });
    
    const results = await Promise.allSettled([p1, p2]);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;
    
    if (successCount !== 1 || errorCount !== 1) {
      throw new Error("TEST 5/6 Failed");
    }
    console.log("TEST 5/6 Passed");

    console.log("All tests completed successfully!");

  } finally {
    // Cleanup
    await db.delete(repairParts).where(eq(repairParts.repair_id, repair.id));
    await db.delete(stockMovements).where(eq(stockMovements.item_id, item.id));
    await db.delete(inventory).where(eq(inventory.id, item.id));
    await db.delete(repairs).where(eq(repairs.id, repair.id));
    console.log("Cleanup complete.");
  }
}

runTests().catch(console.error).then(() => process.exit(0));
