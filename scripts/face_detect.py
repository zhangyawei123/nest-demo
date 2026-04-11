import json
import sys

import cv2


def main():
    if len(sys.argv) < 2:
        raise RuntimeError('缺少图片路径参数')

    image_path = sys.argv[1]
    image = cv2.imread(image_path)
    if image is None:
        raise RuntimeError('无法读取图片')

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    faces = cascade.detectMultiScale(
        gray,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(40, 40),
    )

    result = {
        'faceCount': int(len(faces)),
        'faces': [
            {
                'x': int(x),
                'y': int(y),
                'width': int(w),
                'height': int(h),
            }
            for (x, y, w, h) in faces
        ],
    }
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
