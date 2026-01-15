const Notification = require("../models/Notification");

const createNotification = async ({ userId, type, title = "", message = "", payload = {} }) => {
  if (!userId || !type) return null;

  const notif = await Notification.create({
    userId,
    type,
    title,
    message,
    payload,
    isRead: false,
    readAt: null,
  });

  return notif;
};

module.exports = { createNotification };
