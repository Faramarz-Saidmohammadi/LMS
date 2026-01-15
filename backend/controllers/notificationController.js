const mongoose = require("mongoose");
const Notification = require("../models/Notification");

// GET /me/notifications?isRead=false&page=1&limit=20
const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);

    const filter = { userId };

    if (req.query.isRead === "true") filter.isRead = true;
    if (req.query.isRead === "false") filter.isRead = false;

    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return res.status(200).json({
      notifications: items,
      page,
      limit,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /me/notifications/:id/read
const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }

    const notif = await Notification.findOne({ _id: id, userId });
    if (!notif) return res.status(404).json({ message: "Notification not found" });

    if (!notif.isRead) {
      notif.isRead = true;
      notif.readAt = new Date();
      await notif.save();
    }

    return res.status(200).json({ message: "Notification marked as read", notification: notif });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyNotifications,
  markNotificationRead,
};
