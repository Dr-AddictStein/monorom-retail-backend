import notification from "../models/notificationModel.js";
import fetch from "node-fetch";

export const registerPushToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    
    // Check if token already exists to avoid duplicates
    const existingToken = await notification.findOne({ token });
    
    if (existingToken) {
      return res.status(200).json({ 
        message: "Token already registered",
        token: existingToken
      });
    }
    
    // Create new token entry
    const newToken = new notification({ token });
    await newToken.save();
    
    return res.status(201).json({
      message: "Push notification token registered successfully",
      token: newToken
    });
    
  } catch (error) {
    console.error("Error registering push token:", error);
    return res.status(500).json({ 
      message: "Error registering push token",
      error: error.message
    });
  }
};

export const sendPushNotification = async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }
    
    // Get all registered tokens
    const notifications = await notification.find({});
    
    if (notifications.length === 0) {
      return res.status(404).json({ message: "No notification tokens found" });
    }
    
    // Prepare messages for each token
    const messages = notifications.map(item => ({
      to: item.token,
      sound: 'default',
      title: title,
      body: body,
      data: { data: 'goes here' },
    }));
    
    // Send notifications using Expo's push notification service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages)
    });
    
    const result = await response.json();
    
    return res.status(200).json({
      message: "Notifications sent successfully",
      tokens: notifications.length,
      result: result
    });
    
  } catch (error) {
    console.error("Error sending push notifications:", error);
    return res.status(500).json({ 
      message: "Error sending push notifications", 
      error: error.message 
    });
  }
};
