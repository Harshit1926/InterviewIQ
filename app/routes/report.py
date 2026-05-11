from flask import Blueprint, jsonify

report_bp = Blueprint("report", __name__)


@report_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "report service ready"}), 200