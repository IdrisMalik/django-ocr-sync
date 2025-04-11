document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const resultsContainer = document.getElementById('results-container');
    const resultsArea = document.getElementById('results-area');
    const resultTemplate = document.getElementById('result-item-template');
    const spinner = document.getElementById('spinner');

    // --- Drag and Drop / File Input ---
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFiles(e.target.files);
    });

    // --- File Handling and Synchronous Upload ---
    async function handleFiles(files) {
        spinner.style.display = 'block'; // Show spinner
        resultsContainer.innerHTML = ''; // Clear previous results
        resultsArea.style.display = 'none'; // Hide results area initially
        const formData = new FormData();
        let validFiles = false;

        for (const file of files) {
            if (file.type.startsWith('image/')) {
                formData.append('images', file, file.name);
                validFiles = true;
            } else {
                console.warn(`Skipping non-image file: ${file.name}`);
                // Optionally display a message about skipped files
            }
        }

        if (!validFiles) {
            spinner.style.display = 'none';
            alert("No valid image files selected.");
            return;
        }

        try {
            const response = await fetch('/api/upload/', {
                method: 'POST',
                body: formData,
                // headers: { 'X-CSRFToken': getCookie('csrftoken') }, // Add if CSRF protection is enabled via JS
            });

            // Check if response is ok and content type is JSON before parsing
            if (!response.ok) {
                 let errorText = `Upload failed: ${response.statusText}`;
                 try {
                     // Try to get more specific error from response body if available
                     const errorData = await response.json();
                     errorText = errorData.detail || errorData.error || errorText;
                 } catch (e) { /* Ignore if response body is not JSON */ }
                 throw new Error(errorText);
            }

            // Check content type before parsing
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 throw new Error(`Received non-JSON response from server.`);
            }


            const data = await response.json();
            console.log('Processing complete:', data);

            if (data.results && data.results.length > 0) {
                resultsArea.style.display = 'block'; // Show results area
                data.results.forEach(result => {
                    renderResultItem(result);
                });
            } else {
                // Handle cases where the response is successful but empty
                 resultsArea.style.display = 'block';
                 resultsContainer.innerHTML = '<p class="text-muted">No results were returned.</p>';
            }

        } catch (error) {
            console.error('Error processing files:', error);
            resultsArea.style.display = 'block'; // Show area to display the error
            resultsContainer.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
        } finally {
            spinner.style.display = 'none'; // Hide spinner
            fileInput.value = ''; // Reset file input
        }
    }

    // --- Render Result Item ---
    function renderResultItem(data) {
        const templateClone = resultTemplate.content.cloneNode(true);
        const resultItem = templateClone.querySelector('.result-item');
        resultItem.dataset.id = data.id || `error-${Date.now()}`; // Use ID or generate one for errors without ID

        const filenameEl = resultItem.querySelector('.filename');
        const statusBadge = resultItem.querySelector('.status-badge');
        const imagePreview = resultItem.querySelector('.image-preview');
        const imgElement = imagePreview.querySelector('img');
        const textContainer = resultItem.querySelector('.result-text-container');
        const textElement = textContainer.querySelector('.result-text');
        const errorElement = resultItem.querySelector('.error-message');

        filenameEl.textContent = data.filename || 'Unknown File';

        // Update Status Badge and Content Visibility
        statusBadge.textContent = data.status;
        statusBadge.className = 'status-badge badge '; // Reset classes

        if (data.status === 'COMPLETED') {
            statusBadge.classList.add('bg-success');
            textElement.textContent = data.finalText || '(No text extracted)';
            textContainer.style.display = 'block';
            errorElement.style.display = 'none';
            setupActionButtons(resultItem, data.filename || `result-${data.id}.txt`, data.finalText);

            if (data.imageUrl) {
                imgElement.src = data.imageUrl;
                imgElement.alt = data.filename || `Image ${data.id}`;
                imagePreview.style.display = 'block';
            } else {
                 imagePreview.style.display = 'none';
            }

        } else { // FAILED or other error status
            statusBadge.classList.add('bg-danger');
            errorElement.textContent = data.error || 'An unknown error occurred.';
            errorElement.style.display = 'block';
            textContainer.style.display = 'none';
             // Show image preview even on failure if URL is available
             if (data.imageUrl) {
                 imgElement.src = data.imageUrl;
                 imgElement.alt = `Failed: ${data.filename || `Image ${data.id}`}`;
                 imagePreview.style.display = 'block';
             } else {
                 imagePreview.style.display = 'none';
             }
        }

        resultsContainer.appendChild(templateClone);
    }

     // --- Setup Copy/Download Buttons ---
     function setupActionButtons(resultItem, filename, textToProcess) {
         const copyBtn = resultItem.querySelector('.copy-btn');
         const downloadBtn = resultItem.querySelector('.download-btn');

         copyBtn.onclick = () => {
             navigator.clipboard.writeText(textToProcess)
                 .then(() => {
                     copyBtn.textContent = 'Copied!';
                     setTimeout(() => { copyBtn.textContent = 'Copy Text'; }, 2000);
                 })
                 .catch(err => { console.error('Failed to copy: ', err); });
         };

         downloadBtn.onclick = () => {
             const blob = new Blob([textToProcess || ''], { type: 'text/plain;charset=utf-8' });
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             const safeFilename = (filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase() || 'download') + '.txt';
             a.download = safeFilename;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
         };
     }

    // --- CSRF Cookie Helper (if needed) ---
    // function getCookie(name) { ... }

});