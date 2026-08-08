import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
        },
        avatar: {
            type: String
        },
        state: {
            type: String,
        },
        city: {
            type: String,
        },
        pincode: {
            type: String,
        },
        isAddressUpdated: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Force Mongoose to drop the cached model to apply schema changes during hot reloads
if (mongoose.models.User) {
    delete mongoose.models.User;
}

const User = mongoose.model("User", UserSchema);

export default User;
