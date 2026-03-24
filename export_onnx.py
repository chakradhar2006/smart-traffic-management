from ultralytics import YOLO
import os

# This script should be run locally to export the YOLOv8 model to ONNX format.
# ONNX models are much smaller and don't require PyTorch for inference.

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
PT_MODEL_PATH = os.path.join(MODEL_DIR, "yolov8n.pt")
ONNX_MODEL_PATH = os.path.join(MODEL_DIR, "yolov8n.onnx")

def export():
    print(f"Loading PyTorch model from {PT_MODEL_PATH}...")
    model = YOLO(PT_MODEL_PATH)
    
    print("Exporting to ONNX format...")
    # Export the model
    success = model.export(format="onnx", imgsz=640)
    
    if success:
        print(f"Successfully exported model to {ONNX_MODEL_PATH}")
        print("You can now safely uninstall 'torch', 'torchvision', and 'ultralytics' from your production environment.")
    else:
        print("Export failed.")

if __name__ == "__main__":
    export()
