# Django Enhanced OCR with Gemini AI

## Overview

This project provides a web-based solution for Optical Character Recognition (OCR) on image files. It leverages the Tesseract OCR engine for text extraction and integrates with the Google Gemini multimodal AI model to enhance the accuracy and structural interpretation of the extracted text based on the visual layout of the original image. The application features a user-friendly interface for uploading images and viewing the processed results.

## Key Features

*   **Image Upload:** Supports uploading image files through a web interface using drag-and-drop or a file selector.
*   **Image Preprocessing:** Applies standard image processing techniques (grayscale conversion, adaptive thresholding) using OpenCV to optimize images for OCR.
*   **OCR Processing:** Extracts text content from images using the PyTesseract library (a Python wrapper for Tesseract).
*   **AI Enhancement:** Utilizes the Google Gemini API to analyze the original image alongside the initial OCR output, aiming to correct errors and preserve the visual structure (layout, formatting) of the text.
*   **Synchronous Processing:** Image processing (preprocessing, OCR, AI enhancement) occurs directly within the web request cycle.
*   **Result Display:** Presents the final processed text alongside a preview of the original uploaded image.
*   **Text Actions:** Allows users to copy the extracted text to the clipboard or download it as a plain text file.

## Technology Stack

*   **Backend:** Python, Django
*   **OCR Engine:** Tesseract-OCR
*   **OCR Library:** PyTesseract
*   **Image Processing:** OpenCV (opencv-python-headless), Pillow
*   **AI Enhancement:** Google Generative AI SDK (`google-generativeai`)
*   **Frontend:** HTML, CSS (Bootstrap), JavaScript
*   **Database:** SQLite (default)
*   **Environment Variables:** python-dotenv

## Setup Instructions (Windows 11 / PowerShell)

1.  **Prerequisites:**
    *   Python 3.10+ (added to PATH)
    *   Tesseract-OCR (installed and added to PATH)
    *   Git (optional, for cloning)

2.  **Clone Repository (Optional):**
    ```powershell
    git clone <repository_url> django_ocr_project_sync
    cd django_ocr_project_sync
    ```
    *(Alternatively, download and extract the project files)*

3.  **Create & Activate Virtual Environment:**
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate.ps1
    ```

4.  **Install Dependencies:**
    ```powershell
    pip install -r requirements.txt
    ```

5.  **Configure Environment:**
    *   Rename `.env.template` to `.env`.
    *   Edit `.env` and provide values for:
        *   `SECRET_KEY` (generate a unique key)
        *   `GOOGLE_API_KEY` (your Google AI API key)
        *   `TESSERACT_CMD` (full path to `tesseract.exe`, e.g., `C:\\Program Files\\Tesseract-OCR\\tesseract.exe`)

6.  **Database Setup:**
    ```powershell
    python manage.py makemigrations core
    python manage.py migrate
    ```

7.  **Create Admin User (Optional):**
    ```powershell
    python manage.py createsuperuser
    ```

## Running the Application

1.  Ensure the virtual environment is active (`(venv)` prefix in prompt).
2.  Start the Django development server:
    ```powershell
    python manage.py runserver
    ```

## Usage

1.  Access the application in your web browser, typically at `http://127.0.0.1:8000/`.
2.  Upload one or more image files using the provided interface.
3.  The application will process the images sequentially. Wait for the processing to complete (a loading indicator will be shown).
4.  Once finished, the results for each image (preview and extracted text, or an error message) will be displayed on the page.
5.  Use the "Copy Text" or "Download Text" buttons for the successfully processed images.

## Project Structure

```
django_ocr_project_sync/
├── config/             # Django project settings and root URL configuration
├── core/               # Main application logic (models, views, services)
├── static/             # Static assets (CSS, JavaScript)
├── templates/          # HTML templates
├── media/              # Directory for user-uploaded files (created at runtime)
├── manage.py           # Django management script
├── requirements.txt    # Python package dependencies
├── .env                # Environment variable storage (ignored by Git)
└── .gitignore          # Git ignore rules
```