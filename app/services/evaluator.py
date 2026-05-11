from groq import Groq
import os
import json


def evaluate_interview(messages, resume_text):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    system_prompt = f"""You are an expert interview evaluator.

You will be given a full interview conversation and the candidate's resume.

Resume:
{resume_text}

Evaluate the candidate's performance and return ONLY a JSON object with this exact structure:
{{
    "overall_score": <number 1-10>,
    "clarity_score": <number 1-10>,
    "relevance_score": <number 1-10>,
    "depth_score": <number 1-10>,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
    "summary": "2-3 sentence overall summary"
}}

Be strict but fair. Cross check answers against the resume.
Return ONLY the JSON, no extra text."""

    messages.append({
        "role": "user",
        "content": "The interview is now complete. Please evaluate the candidate's performance and return the JSON report."
    })

    messages[0] = {"role": "system", "content": system_prompt}

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000
    )

    evaluation_text = response.choices[0].message.content

    # clean response in case Groq adds markdown code fences
    evaluation_text = evaluation_text.strip()
    if evaluation_text.startswith("```"):
        evaluation_text = evaluation_text.split("```")[1]
        if evaluation_text.startswith("json"):
            evaluation_text = evaluation_text[4:]
    evaluation_text = evaluation_text.strip()

    try:
        evaluation = json.loads(evaluation_text)
    except json.JSONDecodeError:
        # fallback if Groq doesn't return valid JSON
        evaluation = {
            "overall_score": 5,
            "clarity_score": 5,
            "relevance_score": 5,
            "depth_score": 5,
            "strengths": ["Unable to evaluate — please try again"],
            "weaknesses": ["Interview may have been too short"],
            "suggestions": ["Answer at least 3-4 questions before ending"],
            "summary": "Evaluation could not be completed. Please answer more questions and try again."
        }

    return evaluation