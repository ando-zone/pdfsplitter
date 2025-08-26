pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let convertedPages = [];

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('pdfFile');
    const uploadArea = document.querySelector('.upload-area');
    const progress = document.getElementById('progress');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const results = document.getElementById('results');
    const pageContainer = document.getElementById('pageContainer');
    const downloadAllBtn = document.getElementById('downloadAllBtn');

    // 드래그 앤 드롭 기능
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    downloadAllBtn.addEventListener('click', downloadAllPages);

    function handleFile(file) {
        const fileReader = new FileReader();
        
        fileReader.onload = function(e) {
            const typedarray = new Uint8Array(e.target.result);
            processPDF(typedarray);
        };
        
        fileReader.readAsArrayBuffer(file);
    }

    async function processPDF(pdfData) {
        try {
            progress.style.display = 'block';
            results.style.display = 'none';
            convertedPages = [];
            pageContainer.innerHTML = '';

            const pdf = await pdfjsLib.getDocument(pdfData).promise;
            const totalPages = pdf.numPages;

            progressText.textContent = `총 ${totalPages}페이지 처리 중...`;

            for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');

                const viewport = page.getViewport({ scale: 2.0 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                const imageDataUrl = canvas.toDataURL('image/png');
                convertedPages.push({
                    pageNumber: pageNumber,
                    dataUrl: imageDataUrl
                });

                const progressPercent = (pageNumber / totalPages) * 100;
                progressFill.style.width = progressPercent + '%';
                progressText.textContent = `페이지 ${pageNumber}/${totalPages} 처리 완료`;

                displayPage(pageNumber, imageDataUrl);
            }

            progress.style.display = 'none';
            results.style.display = 'block';

        } catch (error) {
            console.error('PDF 처리 중 오류 발생:', error);
            alert('PDF 파일을 처리하는 중 오류가 발생했습니다.');
            progress.style.display = 'none';
        }
    }

    function displayPage(pageNumber, dataUrl) {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page-item';

        const img = document.createElement('img');
        img.src = dataUrl;
        img.alt = `페이지 ${pageNumber}`;

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn-secondary';
        downloadBtn.textContent = `페이지 ${pageNumber} 다운로드`;
        downloadBtn.addEventListener('click', () => downloadPage(pageNumber, dataUrl));

        pageDiv.appendChild(img);
        pageDiv.appendChild(downloadBtn);
        pageContainer.appendChild(pageDiv);
    }

    function downloadPage(pageNumber, dataUrl) {
        const link = document.createElement('a');
        link.download = `page-${pageNumber}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function downloadAllPages() {
        convertedPages.forEach((page) => {
            setTimeout(() => {
                downloadPage(page.pageNumber, page.dataUrl);
            }, page.pageNumber * 100);
        });
    }
});