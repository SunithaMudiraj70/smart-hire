def parse_resume(file_path):
    text = ""
    # Try pdfplumber (installed)
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        pass

    # Try pypdfium2 (installed)
    try:
        import pypdfium2 as pdfium
        pdf = pdfium.PdfDocument(file_path)
        for page in pdf:
            textpage = page.get_textpage()
            text += textpage.get_text_range() + "\n"
        if text.strip():
            return text.strip()
    except Exception as e:
        pass

    # Try fitz if installed
    try:
        import fitz
        pdf = fitz.open(file_path)
        for page in pdf:
            text += page.get_text() + "\n"
        return text.strip()
    except Exception as e:
        pass

    return text.strip()