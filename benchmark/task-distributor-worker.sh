#!/bin/bash
NUM_NODES=$1
IMG_PATH=$2
IMG_FILE=$3
FN=$4
WIDTH=$5
HEIGHT=$6
OUTPUT_DIR=$7
START=$8
END=$9
IMAGE_PARTS_PATH=${10}
LOCKFILE=${11}
BASENAME="${IMG_FILE%.*}"
MY_IP=$(hostname -I | awk '{print $1}')

if [ $NUM_NODES -eq 1 ] ; then
  TERM=dumb /usr/bin/povray +I${IMG_PATH}/${IMG_FILE} ${FN} ${WIDTH} ${HEIGHT} +O/tmp/${BASENAME}.png 1>/dev/null 2>/tmp/povraymessages
elif [ $NUM_NODES -gt 1 ] ; then
  TERM=dumb /usr/bin/povray +I${IMG_PATH}/${IMG_FILE} ${FN} ${WIDTH} ${HEIGHT} +O/tmp/${BASENAME}.png ${START} ${END} 1>/dev/null 2>/tmp/povraymessages
  SIZE_TEMP=$(echo $START | cut -c 4-)
  SIZE_RESULT=$(expr $SIZE_TEMP - 1)
  IMG_H=$(echo $HEIGHT | cut -c 3-)
  IMG_W=$(echo $WIDTH | cut -c 3-)
  ROW_SIZE=$(expr $IMG_H / ${NUM_NODES})
  /usr/bin/convert-im6.q16 -set colorspace RGB -crop ${IMG_W}x${ROW_SIZE}+0+${SIZE_RESULT} /tmp/${BASENAME}.png /tmp/${BASENAME}.png
else
  echo "Error: invalid NUM_NODES=${NUM_NODES}" && exit 1
fi
mv /tmp/${BASENAME}.png ${IMAGE_PARTS_PATH}/${MY_IP}.png
echo "${MY_IP} `date +%Y_%m_%d_%H:%M:%S`" >> ${LOCKFILE}