from flask import Blueprint, request, jsonify
import tempfile
import os
from app.services.parser import extract_text_from_pdf, extract_text_from_jd
from app.services.rag import build_faiss_index, retrieve_chunks
from app.services.interviewer import start_interview, get_next_question
from app.services.evaluator import evaluate_interview
from app.utils.helpers import generate_session_id, sessions

interview_bp = Blueprint("interview", __name__)


@interview_bp.route("/start", methods=["POST"])
def start():
    if "resume" not in request.files:
        return jsonify({"error": "Resume file is required"}), 400

    if "jd" not in request.form:
        return jsonify({"error": "Job description is required"}), 400

    resume_file = request.files["resume"]

    # Windows-compatible temp file handling
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    try:
        resume_file.save(tmp.name)
        tmp.close()
        resume_text, page_count = extract_text_from_pdf(tmp.name)
    finally:
        os.unlink(tmp.name)  # manually delete after use

    jd_text = extract_text_from_jd(request.form["jd"])

    # smart context selection based on page count
    if page_count > 2:
        # long resume → scale k based on pages (3 chunks per page, max 20)
        k = min(page_count * 3, 20)
        index, chunks = build_faiss_index(resume_text + " " + jd_text)
        query = "candidate skills experience projects background"
        relevant_chunks = retrieve_chunks(query, index, chunks, k=k)
        context = " ".join(relevant_chunks)
        first_question, messages = start_interview(context, jd_text)
    else:
        # short resume → k=10 gets almost everything + filters noise
        index, chunks = build_faiss_index(resume_text + " " + jd_text)
        query = "candidate skills experience projects background"
        relevant_chunks = retrieve_chunks(query, index, chunks, k=10)
        context = " ".join(relevant_chunks)
        first_question, messages = start_interview(context, jd_text)

    session_id = generate_session_id()
    sessions[session_id] = {
        "messages": messages,
        "resume_text": resume_text,
        "index": index,
        "chunks": chunks,
        "answer_count": 0
    }

    return jsonify({
        "session_id": session_id,
        "question": first_question
    }), 200


@interview_bp.route("/answer", methods=["POST"])
def answer():
    data = request.json
    session_id = data.get("session_id")
    candidate_answer = data.get("answer")

    if not session_id or not candidate_answer:
        return jsonify({"error": "session_id and answer are required"}), 400

    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    session = sessions[session_id]
    messages = session["messages"]

    next_question, messages = get_next_question(messages, candidate_answer)

    sessions[session_id]["messages"] = messages
    sessions[session_id]["answer_count"] += 1

    return jsonify({
        "question": next_question
    }), 200


@interview_bp.route("/end", methods=["POST"])
def end():
    data = request.json
    session_id = data.get("session_id")

    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    if session_id not in sessions:
        return jsonify({"error": "Session not found"}), 404

    session = sessions[session_id]
    messages = session["messages"]
    resume_text = session["resume_text"]

    if session["answer_count"] < 2:
        return jsonify({
            "error": "Please answer at least 2 questions before ending the interview"
        }), 400

    evaluation = evaluate_interview(messages, resume_text)

    del sessions[session_id]

    return jsonify({"evaluation": evaluation}), 200