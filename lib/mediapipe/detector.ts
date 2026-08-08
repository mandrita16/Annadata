import { FilesetResolver, FaceDetector } from "@mediapipe/tasks-vision";

let detectorInstance: FaceDetector | null = null;
let detectorPromise: Promise<FaceDetector> | null = null;

export async function getFaceDetector(): Promise<FaceDetector> {
  if (typeof window === "undefined") {
    throw new Error("FaceDetector can only be initialized on the client side.");
  }

  if (detectorInstance) {
    return detectorInstance;
  }

  if (!detectorPromise) {
    detectorPromise = (async () => {
      // Initialize the WASM fileset resolver from CDN
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );

      // Create FaceDetector instance with standard short-range model path
      const detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
          delegate: "GPU",
        },
        runningMode: "IMAGE",
      });

      detectorInstance = detector;
      return detector;
    })();
  }

  return detectorPromise;
}

export function closeFaceDetector() {
  if (detectorInstance) {
    detectorInstance.close();
    detectorInstance = null;
    detectorPromise = null;
  }
}
