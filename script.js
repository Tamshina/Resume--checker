document.getElementById("resumeInput").addEventListener("change", handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();

    if (fileType === "pdf") {
        extractTextFromPDF(file);
    } else if (fileType === "docx") {
        extractTextFromDOCX(file);
    } else {
        displayFeedback("❌ Unsupported file type. Please upload a PDF or DOCX.", "error");
    }
}

function extractTextFromPDF(file) {
    const fileReader = new FileReader();
    fileReader.onload = function () {
        const typedArray = new Uint8Array(this.result);
        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            let text = "";
            let pagesPromises = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                pagesPromises.push(pdf.getPage(i).then(page => {
                    return page.getTextContent().then(content => {
                        return content.items.map(item => item.str).join(" ");
                    });
                }));
            }
            Promise.all(pagesPromises).then(pagesText => {
                text = pagesText.join("\n");
                analyzeResume(text);
            });
        });
    };
    fileReader.readAsArrayBuffer(file);
}

function extractTextFromDOCX(file) {
    const fileReader = new FileReader();
    fileReader.onload = function (event) {
        mammoth.extractRawText({ arrayBuffer: event.target.result })
            .then(result => analyzeResume(result.value))
            .catch(() => displayFeedback("❌ Error processing DOCX file.", "error"));
    };
    fileReader.readAsArrayBuffer(file);
}

function analyzeResume(text) {
    let feedback = "✅ Resume Analysis:\n";
    let missingSections = [];

    if (!text.includes("Experience")) missingSections.push("Experience");
    if (!text.includes("Education")) missingSections.push("Education");
    if (!text.includes("Skills")) missingSections.push("Skills");

    if (missingSections.length > 0) {
        feedback += `⚠️ Missing sections: ${missingSections.join(", ")}\n`;
    } else {
        feedback += "✅ All key sections are present.\n";
    }

    displayFeedback(feedback, missingSections.length > 0 ? "error" : "success");
}

function displayFeedback(message, type) {
    const feedbackDiv = document.getElementById("feedback");
    feedbackDiv.innerText = message;
    feedbackDiv.className = `feedback ${type}`;
}
