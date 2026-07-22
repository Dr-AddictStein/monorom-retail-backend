import mongoose, { Mongoose } from "mongoose";

const notificationSchema = new mongoose.Schema({
    token: {
        type: String
    },
}, { timestamps: true });


const notification = mongoose.model("NotificationCollection", notificationSchema);

export default notification;