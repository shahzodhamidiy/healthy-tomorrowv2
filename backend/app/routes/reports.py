"""Export PDF/Excel reports — admin only."""
import io
from datetime import datetime, timedelta
from flask import Blueprint, send_file, current_app
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from openpyxl import Workbook
from app.utils.auth import role_required

reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/reports/revenue.pdf")
@role_required("admin")
def revenue_pdf():
    db = current_app.db
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("Healthy Tomorrow — Revenue Report", styles["Title"]),
             Paragraph(datetime.utcnow().strftime("%B %d, %Y"), styles["Normal"]),
             Spacer(1, 14)]

    last_30 = datetime.utcnow() - timedelta(days=30)
    pipeline = [
        {"$match": {"payment_status": "paid", "created_at": {"$gte": last_30}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "revenue": {"$sum": "$total"},
            "orders": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    rows = [["Date", "Orders", "Revenue"]]
    total_orders = total_rev = 0
    for d in db.orders.aggregate(pipeline):
        rows.append([d["_id"], d["orders"], f"${d['revenue']:.2f}"])
        total_orders += d["orders"]
        total_rev += d["revenue"]
    rows.append(["TOTAL", total_orders, f"${total_rev:.2f}"])

    t = Table(rows, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8A9A5B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF1EA")),
    ]))
    story.append(t)
    doc.build(story)
    buf.seek(0)
    return send_file(buf, mimetype="application/pdf",
                     as_attachment=True, download_name="revenue.pdf")


@reports_bp.get("/reports/orders.xlsx")
@role_required("admin")
def orders_xlsx():
    db = current_app.db
    wb = Workbook()
    ws = wb.active
    ws.title = "Orders"
    ws.append(["Order ID", "User ID", "Status", "Payment", "Total", "Created"])
    for o in db.orders.find().sort("created_at", -1).limit(1000):
        ws.append([
            str(o["_id"]),
            o.get("user_id", ""),
            o.get("status", ""),
            o.get("payment_status", ""),
            o.get("total", 0),
            o["created_at"].isoformat() if "created_at" in o else "",
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True, download_name="orders.xlsx",
    )


@reports_bp.get("/reports/users.xlsx")
@role_required("admin")
def users_xlsx():
    db = current_app.db
    wb = Workbook()
    ws = wb.active
    ws.title = "Users"
    ws.append(["ID", "Name", "Email", "Role", "Suspended", "Created"])
    for u in db.users.find().sort("created_at", -1).limit(5000):
        ws.append([
            str(u["_id"]),
            u.get("name", ""),
            u.get("email", ""),
            u.get("role", ""),
            "yes" if u.get("suspended") else "no",
            u["created_at"].isoformat() if "created_at" in u else "",
        ])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return send_file(
        buf,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True, download_name="users.xlsx",
    )
