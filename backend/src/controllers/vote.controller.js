import Vote from "../models/vote.model.js";
import Complaint from "../models/complaint.model.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

import { calculatePriority } from "../services/priority.service.js";

/**
 * UPVOTE A COMPLAINT
 * Triggered when a citizen clicks an un-filled upvote button.
 */
export const upvoteComplaint = asyncHandler(async (req, res) => {
  const user = req.user;
  const { complaintId } = req.params;

  if (user.role !== "citizen") {
    throw new ApiError(403, "Only citizens can upvote complaints");
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  try {
    // DB-level unique index on {complaintId, userId} prevents duplicates
    await Vote.create({
      complaintId,
      userId: user._id,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(400, "You have already upvoted this complaint");
    }
    throw err;
  }

  // Increment count and update priority
  complaint.upvoteCount += 1;
  complaint.priorityScore = calculatePriority(complaint);

  await complaint.save();

  return res.json(
    new ApiResponse(
      200,
      { upvoted: true, count: complaint.upvoteCount },
      "Complaint upvoted successfully"
    )
  );
});

/**
 * REMOVE UPVOTE
 * Triggered when a citizen clicks a filled upvote button to "undo" their vote.
 */
export const removeUpvote = asyncHandler(async (req, res) => {
  const user = req.user;
  const { complaintId } = req.params;

  if (user.role !== "citizen") {
    throw new ApiError(403, "Only citizens can remove upvotes");
  }

  // Atomically find and delete the vote record
  const vote = await Vote.findOneAndDelete({
    complaintId,
    userId: user._id,
  });

  if (!vote) {
    throw new ApiError(400, "You have not upvoted this complaint");
  }

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new ApiError(404, "Complaint not found");
  }

  // Decrease upvote count safely to prevent negative numbers
  if (complaint.upvoteCount > 0) {
    complaint.upvoteCount -= 1;
  }

  // Recalculate priority based on reduced community support
  complaint.priorityScore = calculatePriority(complaint);

  await complaint.save();

  return res.json(
    new ApiResponse(
      200,
      { upvoted: false, count: complaint.upvoteCount },
      "Upvote removed successfully"
    )
  );
});
