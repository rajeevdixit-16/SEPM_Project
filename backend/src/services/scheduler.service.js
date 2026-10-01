import cron from "node-cron";
import Complaint from "../models/complaint.model.js";
import { calculatePriority } from "./priority.service.js";

export const startSchedulers = () => {
  // Run every night at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running daily priority recalculation...");

    const complaints = await Complaint.find({
      status: { $ne: "resolved" },
    });

    for (const complaint of complaints) {
      complaint.priorityScore = calculatePriority(complaint);
      await complaint.save();
    }
  });

  console.log("Scheduler started");
};
