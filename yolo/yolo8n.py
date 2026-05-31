# This is a Kaggle notebook which was used to train
# a YOLO8n model using a merged dataset for 
# persons, fire and blunt objects
# The script is only added for tracking purposes

from roboflow import Roboflow
from kaggle_secrets import UserSecretsClient
import shutil
from ultralytics import YOLO

# Paster your secrets from the Roboflow (RB) project
user_secrets = UserSecretsClient()
ws = user_secrets.get_secret("RB_WORKSPACE")
proj = user_secrets.get_secret("RB_PROJ")
api_key = user_secrets.get_secret("RB_API_KEY")

rf = Roboflow(api_key=api_key)
project = rf.workspace(ws).project(proj)
version = project.version(1)
dataset = version.download("yolov8")

model = YOLO('yolov8n.pt')

results = model.train(
    data=f"{dataset.location}/data.yaml",
    epochs=100,
    imgsz=320,
    batch=16
)

# Conversions for RPI AI camera  

# Enter YOUR_USERNAME and PROJECT_NAME based on your Kaggle notebook config
src_path = '/kaggle/input/models/YOUR_USERNAME/PROJECT_NAME/other/default/1/best.pt'
dst_path = '/kaggle/working/best.pt'

shutil.copy(src_path, dst_path)

model = YOLO(dst_path)

model.export(
    format='onnx',
    imgsz=320,
    simplify=True,
    opset=12
)
# Produces an RPI AI Camera compatible model under
# '/kaggle/working/best_imx_model' 
model.export(
    format='imx',
    imgsz=320
)