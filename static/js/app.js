// ── State ──
let sessionId = null

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
function addBubble(text, sender) {
    const chatWindow = document.getElementById("chat-window")
    const bubble = document.createElement("div")
    bubble.className = sender === "ai" ? "bubble-ai" : "bubble-user"
    bubble.innerHTML = `
        <div class="avatar">${sender === "ai" ? "AI" : "You"}</div>
        <div class="text">${text}</div>
    `
    chatWindow.appendChild(bubble)
    chatWindow.scrollTop = chatWindow.scrollHeight
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
    addBubble("Starting your interview...", "ai")

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

    addBubble(answer, "user")
    document.getElementById("answer-input").value = ""
    addBubble("Thinking...", "ai")

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
    addBubble("Evaluating your performance...", "ai")

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
document.getElementById("wrong-resume-btn").addEventListener("click", () => {
    document.getElementById("resume-input").value = ""
    sessionId = null
    document.getElementById("chat-window").innerHTML = ""
    showScreen(uploadScreen)
})
document.getElementById("startover-btn").addEventListener("click", () => {
    document.getElementById("resume-input").value = ""
    document.getElementById("jd-input").value = ""
    document.getElementById("chat-window").innerHTML = ""
    sessionId = null
    showScreen(uploadScreen)
})