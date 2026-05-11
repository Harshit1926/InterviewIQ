from groq import Groq
import os


def start_interview(resume_text, jd_text):
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    system_prompt = f"""You are a professional technical interviewer conducting a job interview.

You have access to the candidate's resume and the job description below.

Resume:
{resume_text}

Job Description:
{jd_text}

IMPORTANT: Before doing ANYTHING else, silently check if the resume content
is a real professional resume. Do NOT mention this check in your response.

A real resume MUST contain:
- A person's name
- Technical skills or work experience
- Education or projects

If the document contains food items, prices, menu items, articles, or ANY
non-resume content — you MUST respond with EXACTLY this message and NOTHING else:

"I notice you haven't uploaded a valid resume. This appears to be a non-professional
document. Please click the 'Wrong Resume?' button to re-upload your actual resume
before we can begin the interview."

DO NOT introduce yourself.
DO NOT ask any questions.
DO NOT proceed with the interview under any circumstances.
ONLY output the above message and stop.

If the resume IS valid:
- Do NOT mention the validation check at all
- Do NOT say the resume looks valid or professional
- Just silently proceed with the interview
- Introduce yourself briefly
- Ask one relevant interview question at a time
- Mix technical, behavioral and resume specific questions
- Ask follow up questions if an answer is vague or incomplete
- Stay professional and neutral
- Do NOT evaluate or score answers yet
- Do NOT ask multiple questions at once"""

    messages = [
        {"role": "system", "content": system_prompt}
    ]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000
    )

    first_question = response.choices[0].message.content

    messages.append({
        "role": "assistant",
        "content": first_question
    })

    return first_question, messages


def get_next_question(messages, candidate_answer):
    messages.append({
        "role": "user",
        "content": candidate_answer
    })

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=1000
    )

    next_question = response.choices[0].message.content

    messages.append({
        "role": "assistant",
        "content": next_question
    })

    return next_question, messages