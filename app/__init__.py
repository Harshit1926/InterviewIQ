from flask import Flask, render_template
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(
    __name__,
    static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
    template_folder=os.path.join(os.path.dirname(__file__), "..", "templates")
)

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024
    CORS(app)

    from app.routes.interview import interview_bp
    from app.routes.report import report_bp

    app.register_blueprint(interview_bp, url_prefix="/api/interview")
    app.register_blueprint(report_bp, url_prefix="/api/report")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/")
    def index():
        return render_template("index.html")

    return app