import { ImageKit, toFile } from "@imagekit/nodejs";

const imagekit = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
});

export async function uploadImage(buffer: Buffer, fileName: string, folder = "/Tatva") {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error("Missing ImageKit private key");
    }

    const file = await toFile(buffer, fileName);

    const response = await imagekit.files.upload({
        file: file,
        fileName: fileName,
        folder: folder,
        useUniqueFileName: false,
    });

    return {
        secure_url: response.url,
        public_id: response.fileId,
        width: response.width,
        height: response.height,
    };
}

export async function deleteImage(url: string) {
    if (!process.env.IMAGEKIT_PRIVATE_KEY) {
        throw new Error("Missing ImageKit private key");
    }

    if (!url.includes("imagekit.io")) {
        return { result: "ignored", message: "Not an ImageKit URL" };
    }

    try {
        const urlObj = new URL(url);
        const fileName = urlObj.pathname.split("/").pop();
        if (!fileName) {
            throw new Error("Could not extract filename");
        }

        const response = await imagekit.assets.list({
            searchQuery: `name = "${fileName}"`,
        });

        if (Array.isArray(response) && response.length > 0) {
            const file = response[0];
            if ("fileId" in file && file.fileId) {
                await imagekit.files.delete(file.fileId);
                return { result: "ok" };
            }
        }

        return { result: "not found" };
    } catch (error) {
        console.error("Error deleting image from ImageKit:", error);
        throw error;
    }
}
