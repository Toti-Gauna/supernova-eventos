"""Portable crop reference, used only for an explicitly requested video.

Requires Pillow. Paths and coordinates are arguments; no personal paths,
third-party brand geometry, external downloads, or repo mutation are assumed.

python recortes_ejemplo.py screenshot.png reference.png --box 120 80 840 480
"""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image


def create_reference(source: Path, output: Path, box: tuple[int, int, int, int]) -> None:
    with Image.open(source) as image:
        left, top, right, bottom = box
        if not (0 <= left < right <= image.width and 0 <= top < bottom <= image.height):
            raise ValueError("Crop coordinates must stay inside the source image.")
        component = image.convert("RGBA").crop(box)

    width, height = 1920, 1080
    scale = min(3.0, width * 0.86 / component.width, height * 0.78 / component.height)
    component = component.resize(
        (round(component.width * scale), round(component.height * scale)),
        Image.Resampling.LANCZOS,
    )
    canvas = Image.new("RGBA", (width, height), (7, 7, 14, 255))
    canvas.alpha_composite(component, ((width - component.width) // 2, (height - component.height) // 2))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output)


if __name__ == "__main__":
    parser = ArgumentParser(description="Center a real component crop on a 16:9 reference canvas.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--box", type=int, nargs=4, required=True, metavar=("LEFT", "TOP", "RIGHT", "BOTTOM"))
    arguments = parser.parse_args()
    if arguments.source.resolve() == arguments.output.resolve():
        parser.error("Output must be a different file from the source.")
    create_reference(arguments.source, arguments.output, tuple(arguments.box))
