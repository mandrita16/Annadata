import mongoose from "mongoose";

const PlotSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Please provide a name for the plot"],
            trim: true,
            minlength: [5, "Plot name must be at least 5 characters"],
            maxlength: [12, "Plot name cannot exceed 12 characters"],
            validate: {
                validator: function (v: string) {
                    // Allow only alphanumeric characters, no spaces or special symbols
                    return /^[a-zA-Z0-9]+$/.test(v);
                },
                message: "Plot name must be alphanumeric without spaces or special characters",
            },
        },
        state: {
            type: String,
            required: [true, "Please provide a state"],
        },
        city: {
            type: String,
            required: [true, "Please provide a city"],
        },
        pincode: {
            type: String,
            required: [true, "Please provide a pincode"],
        },
        area: {
            type: Number,
            required: [true, "Please provide the land area"],
        },
        landmark: {
            name: {
                type: String,
                required: true,
            },
            address: {
                type: String,
                required: true,
            },
            lat: {
                type: Number,
                required: true,
            },
            lng: {
                type: Number,
                required: true,
            },
        },
        soilData: {
            moisture: {
                type: Number,
                default: null,
            },
            temperature: {
                type: Number,
                default: null,
            },
            lastUpdated: {
                type: Date,
                default: null,
            },
        },
    },
    {
        timestamps: true,
    }
);

if (mongoose.models.Plot) {
    delete mongoose.models.Plot;
}

const Plot = mongoose.model("Plot", PlotSchema);

export default Plot;
