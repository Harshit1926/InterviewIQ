// ── State ──
let sessionId = null

// ══════════════════════════════════════════
// Voice + webcam + mascot module
// ══════════════════════════════════════════

const mascotEl = document.getElementById("mascot")
const mascotLabel = document.getElementById("mascot-label")
const webcamVideo = document.getElementById("webcam-video")
const webcamStatus = document.getElementById("webcam-status")
const micBtn = document.getElementById("mic-btn")
const doneAnsweringBtn = document.getElementById("done-answering-btn")
const liveTranscript = document.getElementById("live-transcript")
const liveTranscriptText = document.getElementById("live-transcript-text")
const answerInput = document.getElementById("answer-input")

let recognition = null
let isRecognitionSupported = false
let micPermissionDenied = false

// ── Mascot state ──
// "idle" | "listening" | "speaking"
function setMascotState(state, label) {
    mascotEl.classList.remove("idle", "listening", "speaking")
    mascotEl.classList.add(state)
    mascotLabel.textContent = label
}

// ── Webcam: mirror-only, no processing, no backend calls ──
async function initWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        webcamVideo.srcObject = stream
        webcamStatus.style.display = "none"
    } catch (err) {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            webcamStatus.textContent = "Camera access denied"
        } else if (err.name === "NotFoundError") {
            webcamStatus.textContent = "No camera found"
        } else {
            webcamStatus.textContent = "Camera unavailable"
        }
        webcamStatus.style.display = "block"
        console.warn("Webcam not available:", err)
    }
}

// ── Text-to-speech: speak AI questions aloud ──
function speak(text) {
    if (!("speechSynthesis" in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1

    utterance.onstart = () => setMascotState("speaking", "Speaking")
    utterance.onend = () => setMascotState("idle", "Ready")
    utterance.onerror = () => setMascotState("idle", "Ready")

    window.speechSynthesis.speak(utterance)
}

// ── Speech-to-text: mic capture with live transcript ──
function setupRecognition() {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
        isRecognitionSupported = false
        micBtn.style.display = "none"
        return
    }

    isRecognitionSupported = true
    recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    let finalTranscript = ""

    recognition.onstart = () => {
        finalTranscript = answerInput.value ? answerInput.value + " " : ""
        setMascotState("listening", "Listening")
        micBtn.classList.add("recording")
        micBtn.textContent = "■"
        liveTranscript.style.display = "flex"
        doneAnsweringBtn.style.display = "inline-block"
    }

    recognition.onresult = (event) => {
        let interimTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
                finalTranscript += transcript + " "
            } else {
                interimTranscript += transcript
            }
        }
        liveTranscriptText.textContent = (finalTranscript + interimTranscript).trim() || "Listening..."
        answerInput.value = finalTranscript.trim()
    }

    recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error)
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            micPermissionDenied = true
            showMicDeniedMessage()
        }
        stopListeningUI()
    }

    recognition.onend = () => {
        stopListeningUI()
    }
}

function stopListeningUI() {
    micBtn.classList.remove("recording")
    micBtn.textContent = "🎤"
    liveTranscript.style.display = "none"
    setMascotState("idle", "Ready")
}

function showMicDeniedMessage() {
    liveTranscript.style.display = "flex"
    liveTranscript.classList.add("live-transcript-error")
    liveTranscriptText.textContent = "Microphone access denied — you can still type your answer below"
    micBtn.disabled = true
    micBtn.title = "Microphone access denied"
    setTimeout(() => {
        liveTranscript.style.display = "none"
        liveTranscript.classList.remove("live-transcript-error")
    }, 4000)
}

function toggleMic() {
    if (!isRecognitionSupported || micPermissionDenied) return

    if (micBtn.classList.contains("recording")) {
        recognition.stop()
    } else {
        try {
            recognition.start()
        } catch (err) {
            console.warn("Recognition already started:", err)
        }
    }
}

function finishAnswering() {
    if (recognition && micBtn.classList.contains("recording")) {
        recognition.stop()
    }
    doneAnsweringBtn.style.display = "none"
    answerInput.focus()
}

setupRecognition()

// ══════════════════════════════════════════
// Existing app logic
// ══════════════════════════════════════════

// ── Screen elements ──
const uploadScreen = document.getElementById("upload-screen")
const interviewScreen = document.getElementById("interview-screen")
const reportScreen = document.getElementById("report-screen")

// ── Helper: switch screens ──
function showScreen(screen) {
    uploadScreen.style.display = "none"
    interviewScreen.style.display = "none"
    reportScreen.style.display = "none"
    screen.style.display = "block"
}

// ── Helper: add chat bubble ──
function addBubble(text, sender, skipSpeech) {
    const chatWindow = document.getElementById("chat-window")
    const bubble = document.createElement("div")
    bubble.className = sender === "ai" ? "bubble-ai" : "bubble-user"
    bubble.innerHTML = `
        <div class="avatar">${sender === "ai" ? "AI" : "You"}</div>
        <div class="text">${text}</div>
    `
    chatWindow.appendChild(bubble)
    chatWindow.scrollTop = chatWindow.scrollHeight

    if (sender === "ai" && !skipSpeech) {
        speak(text)
    }
}

// ── Start interview ──
async function startInterview() {
    const resumeFile = document.getElementById("resume-input").files[0]
    const jdText = document.getElementById("jd-input").value

    if (!resumeFile) {
        alert("Please upload your resume!")
        return
    }
    if (!jdText) {
        alert("Please paste the job description!")
        return
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
        alert("File too large! Please upload a PDF under 5MB")
        return
    }

    const formData = new FormData()
    formData.append("resume", resumeFile)
    formData.append("jd", jdText)

    showScreen(interviewScreen)
    initWebcam()
    addBubble("Starting your interview...", "ai", true)

    const response = await fetch("/api/interview/start", {
        method: "POST",
        body: formData
    })

    const data = await response.json()
    sessionId = data.session_id

    const chatWindow = document.getElementById("chat-window")
    chatWindow.removeChild(chatWindow.lastChild)
    addBubble(data.question, "ai")
}

// ── Submit answer ──
async function submitAnswer() {
    const answer = document.getElementById("answer-input").value

    if (!answer) {
        alert("Please write your answer!")
        return
    }

    if (recognition && micBtn.classList.contains("recording")) {
        recognition.stop()
    }
    doneAnsweringBtn.style.display = "none"

    addBubble(answer, "user")
    document.getElementById("answer-input").value = ""
    addBubble("Thinking...", "ai", true)

    const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answer: answer })
    })

    const data = await response.json()

    const chatWindow = document.getElementById("chat-window")
    chatWindow.removeChild(chatWindow.lastChild)
    addBubble(data.question, "ai")
}

// ── End interview ──
async function endInterview() {
    addBubble("Evaluating your performance...", "ai", true)

    const response = await fetch("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
    })

    const data = await response.json()

    if (data.error) {
        const chatWindow = document.getElementById("chat-window")
        chatWindow.removeChild(chatWindow.lastChild)
        addBubble(data.error, "ai")
        return
    }

    showScreen(reportScreen)
    window.speechSynthesis.cancel()
    stopWebcam()
    renderReport(data.evaluation)
}

// ── Render report ──
function renderReport(evaluation) {
    document.getElementById("summary-content").innerHTML = `
        <strong>Overall: ${evaluation.overall_score}/10</strong> &nbsp;|&nbsp;
        <strong>Clarity: ${evaluation.clarity_score}/10</strong> &nbsp;|&nbsp;
        <strong>Relevance: ${evaluation.relevance_score}/10</strong> &nbsp;|&nbsp;
        <strong>Depth: ${evaluation.depth_score}/10</strong>
        <br><br>
        ${evaluation.summary}
    `

    const strengthsList = document.getElementById("strengths-list")
    evaluation.strengths.forEach(item => {
        const li = document.createElement("li")
        li.innerText = item
        strengthsList.appendChild(li)
    })

    const weaknessesList = document.getElementById("weaknesses-list")
    evaluation.weaknesses.forEach(item => {
        const li = document.createElement("li")
        li.innerText = item
        weaknessesList.appendChild(li)
    })

    const suggestionsList = document.getElementById("suggestions-list")
    evaluation.suggestions.forEach(item => {
        const li = document.createElement("li")
        li.innerText = item
        suggestionsList.appendChild(li)
    })

    const ctx = document.getElementById("radar-chart").getContext("2d")
    new Chart(ctx, {
        type: "radar",
        data: {
            labels: ["Overall", "Clarity", "Relevance", "Depth"],
            datasets: [{
                label: "Your Score",
                data: [
                    evaluation.overall_score,
                    evaluation.clarity_score,
                    evaluation.relevance_score,
                    evaluation.depth_score
                ],
                backgroundColor: "rgba(26, 26, 46, 0.2)",
                borderColor: "#1a1a2e",
                pointBackgroundColor: "#1a1a2e"
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                r: { min: 0, max: 10, ticks: { stepSize: 2 } }
            }
        }
    })
}

// ── Event listeners ──
document.getElementById("start-btn").addEventListener("click", startInterview)
document.getElementById("submit-btn").addEventListener("click", submitAnswer)
document.getElementById("end-btn").addEventListener("click", endInterview)
document.getElementById("mic-btn").addEventListener("click", toggleMic)
document.getElementById("done-answering-btn").addEventListener("click", finishAnswering)
document.getElementById("wrong-resume-btn").addEventListener("click", () => {
    document.getElementById("resume-input").value = ""
    sessionId = null
    document.getElementById("chat-window").innerHTML = ""
    window.speechSynthesis.cancel()
    stopWebcam()
    showScreen(uploadScreen)
})
document.getElementById("startover-btn").addEventListener("click", () => {
    document.getElementById("resume-input").value = ""
    document.getElementById("jd-input").value = ""
    document.getElementById("chat-window").innerHTML = ""
    sessionId = null
    window.speechSynthesis.cancel()
    stopWebcam()
    showScreen(uploadScreen)
})

function stopWebcam() {
    if (webcamVideo.srcObject) {
        webcamVideo.srcObject.getTracks().forEach(track => track.stop())
        webcamVideo.srcObject = null
    }
}