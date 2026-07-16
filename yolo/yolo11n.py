# This is a Kaggle notebook which was used to train
# a YOLO11n model using a merged dataset for 
# persons, fire and blunt objects
# The script is only added for tracking purposes

from roboflow import Roboflow
from kaggle_secrets import UserSecretsClient
from ultralytics import YOLO

# Paster your secrets from the Roboflow (RB) project
user_secrets = UserSecretsClient()
ws = user_secrets.get_secret("RB_WORKSPACE")
proj = user_secrets.get_secret("RB_PROJ")
api_key = user_secrets.get_secret("RB_API_KEY")

rf = Roboflow(api_key=api_key)
project = rf.workspace(ws).project(proj)
version = project.version(1)
dataset = version.download("yolov11")

model = YOLO('yolo11n.pt')

results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=100,
    imgsz=640,
    plots=True
)

# Conversion for RPI AI camera  
model = YOLO('/kaggle/working/best.pt')
model.export(format='onnx', imgsz=640, simplify=True)

# You run this command  
# !imxconv-pt -i /kaggle/working/best.onnx -o /kaggle/working/sony_output --no-input-persistency

# Unfortunately the conversion fails because the model is too complex for the AI camera