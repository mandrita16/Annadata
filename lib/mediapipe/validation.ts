export interface ValidationResult {
  isValid: boolean;
  message: string;
}

/**
 * Calculates the average relative luminance of an active HTMLVideoElement frame.
 */
export function getFrameLuminance(video: HTMLVideoElement): number {
  if (typeof document === "undefined") return 128;

  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }

    return totalLuminance / pixelCount;
  } catch (e) {
    return 128;
  }
}

/**
 * Calculates the average relative luminance of an HTMLImageElement.
 */
export function getImageLuminance(img: HTMLImageElement): number {
  if (typeof document === "undefined") return 128;

  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return 128;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  try {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    let totalLuminance = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuminance += luminance;
    }

    return totalLuminance / pixelCount;
  } catch (e) {
    return 128;
  }
}

/**
 * Validates the detected face bounding box, keypoints, and lighting quality.
 */
export function validateFace(
  detections: any[],
  imageWidth: number,
  imageHeight: number,
  luminance: number
): ValidationResult {
  // 1. Verify lighting quantity (Threshold < 50)
  if (luminance < 50) {
    return {
      isValid: false,
      message: "Too dark! Move to a well-lit area or turn on lights.",
    };
  }

  // 2. Single human face check
  if (detections.length === 0) {
    return {
      isValid: false,
      message: "No human face detected. Please align your face inside the camera frame.",
    };
  }

  if (detections.length > 1) {
    return {
      isValid: false,
      message: "Multiple faces detected. Please make sure only you are in the frame.",
    };
  }

  const detection = detections[0];
  const score = detection.categories?.[0]?.score ?? 0;

  // 3. Face coverage/occlusion check using keypoints
  const keypoints = detection.keypoints || [];
  if (keypoints.length < 6) {
    return {
      isValid: false,
      message: "Face is covered or not fully visible. Please remove face coverings.",
    };
  }

  // Ensure individual keypoints (eyes, nose, mouth) have high confidence
  for (const kp of keypoints) {
    if (kp.score !== undefined && kp.score < 0.45) {
      return {
        isValid: false,
        message: "Face is partially covered. Make sure eyes, nose, and mouth are fully visible.",
      };
    }
  }

  // 4. Overall confidence score threshold (raised to 0.8 to reject occluded/covered faces)
  if (score < 0.8) {
    return {
      isValid: false,
      message: "Face is covered or not clearly visible. Keep your face completely exposed.",
    };
  }

  const box = detection.boundingBox;
  if (!box) {
    return {
      isValid: false,
      message: "Unable to trace face bounding box boundaries. Please try again.",
    };
  }

  // 5. Centering calculations (within 25% boundary)
  const boxCenterX = box.originX + box.width / 2;
  const boxCenterY = box.originY + box.height / 2;
  const imageCenterX = imageWidth / 2;
  const imageCenterY = imageHeight / 2;

  const offsetX = Math.abs(boxCenterX - imageCenterX) / imageWidth;
  const offsetY = Math.abs(boxCenterY - imageCenterY) / imageHeight;

  if (offsetX > 0.25 || offsetY > 0.25) {
    return {
      isValid: false,
      message: "Face is not centered. Keep your face inside the center of the camera.",
    };
  }

  // 6. Size ratio calculations (must occupy at least 15% height and width)
  const widthRatio = box.width / imageWidth;
  const heightRatio = box.height / imageHeight;

  if (widthRatio < 0.15 || heightRatio < 0.15) {
    return {
      isValid: false,
      message: "You are too far. Please move closer to the camera.",
    };
  }

  return {
    isValid: true,
    message: "Selfie verified.",
  };
}
