import { useState, useRef, useEffect } from "react";
import { getFaceDetector, closeFaceDetector } from "@/lib/mediapipe/detector";
import { validateFace, ValidationResult, getImageLuminance, getFrameLuminance } from "@/lib/mediapipe/validation";

export function useFaceDetector() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detectorRef = useRef<any>(null);

  // Automatically clean up WebGL context and WASM resources on unmount
  useEffect(() => {
    return () => {
      closeFaceDetector();
    };
  }, []);

  /**
   * Initializes the detector model.
   * Can be pre-loaded when camera component mounts to prevent latency during capture.
   */
  const initDetector = async () => {
    if (detectorRef.current) return;
    setIsLoading(true);
    setError(null);
    try {
      const detector = await getFaceDetector();
      detectorRef.current = detector;
      setIsReady(true);
    } catch (err: any) {
      console.error("Failed to load MediaPipe FaceDetector:", err);
      setError(err.message || "Failed to load face detector model.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Captures the screenshot data URL, loads it as an image, and validates it locally.
   */
  const validateSelfie = async (imageSrc: string): Promise<ValidationResult> => {
    try {
      let detector = detectorRef.current;
      if (!detector) {
        setIsLoading(true);
        detector = await getFaceDetector();
        detectorRef.current = detector;
        setIsReady(true);
        setIsLoading(false);
      }

      // Load screenshot base64 into HTMLImageElement
      const img = new Image();
      img.src = imageSrc;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load selfie frame."));
      });

      // Calculate luminance
      const luminance = getImageLuminance(img);

      // Run inference
      const result = detector.detect(img);
      const detections = result.detections || [];

      // Validate face
      return validateFace(detections, img.naturalWidth, img.naturalHeight, luminance);
    } catch (err: any) {
      console.error("Selfie validation error:", err);
      setIsLoading(false);
      return {
        isValid: false,
        message: err.message || "Face validation model execution failed.",
      };
    }
  };

  /**
   * Run synchronous inference directly on an active HTMLVideoElement frame.
   */
  const validateSelfieVideoFrame = (video: HTMLVideoElement): ValidationResult => {
    try {
      const detector = detectorRef.current;
      if (!detector) {
        return {
          isValid: false,
          message: "Face detector is loading...",
        };
      }

      // Calculate frame luminance
      const luminance = getFrameLuminance(video);

      const result = detector.detect(video);
      const detections = result.detections || [];

      return validateFace(detections, video.videoWidth, video.videoHeight, luminance);
    } catch (err: any) {
      return {
        isValid: false,
        message: "Analyzing camera stream...",
      };
    }
  };

  return {
    isLoading,
    isReady,
    error,
    initDetector,
    validateSelfie,
    validateSelfieVideoFrame,
  };
}
