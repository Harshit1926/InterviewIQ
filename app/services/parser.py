import fitz
import pytesseract
from PIL import Image
import io
import os

if os.name == 'nt':
    pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


def extract_text_from_pdf(pdf_path):
    text = ""

    doc = fitz.open(pdf_path)
    page_count = len(doc)

    for page in doc:
        page_text = page.get_text()

        if not page_text:
            pix = page.get_pixmap()
            img_bytes = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_bytes))
            page_text = pytesseract.image_to_string(img)

        text += page_text

    doc.close()
    return text.strip(), page_count


def extract_text_from_jd(jd_text):
    return jd_text.strip()