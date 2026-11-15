import os
from PIL import Image, ImageDraw, ImageFont

# Ensure target directories exist
public_dir = r"c:\Desktop\Sem-5\FS Project\inventiq\client\public\demo-invoices"
artifact_dir = r"C:\Users\krish\.gemini\antigravity\brain\b0e9d083-9ca8-47b8-9ba6-91b90777085b"
os.makedirs(public_dir, exist_ok=True)
os.makedirs(artifact_dir, exist_ok=True)

# Font setup
font_bold_path = r"C:\Windows\Fonts\arialbd.ttf" if os.path.exists(r"C:\Windows\Fonts\arialbd.ttf") else r"C:\Windows\Fonts\arial.ttf"
font_regular_path = r"C:\Windows\Fonts\arial.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

font_title = get_font(font_bold_path, 30)
font_subtitle = get_font(font_regular_path, 15)
font_h2 = get_font(font_bold_path, 18)
font_bold = get_font(font_bold_path, 15)
font_regular = get_font(font_regular_path, 14)
font_small = get_font(font_regular_path, 12)
font_small_bold = get_font(font_bold_path, 12)

# ==============================================================================
# INVOICE 1: SHARMA BROTHERS WHOLESALE DISTRIBUTORS
# ==============================================================================
def create_invoice_sharma():
    W, H = 1000, 1300
    img = Image.new("RGB", (W, H), color="#FDFDFD")
    draw = ImageDraw.Draw(img)

    # Outer border & header bar
    draw.rectangle([(20, 20), (W - 20, H - 20)], outline="#2B2D42", width=2)
    draw.rectangle([(20, 20), (W - 20, 70)], fill="#1E3A8A")
    draw.text((W // 2, 45), "TAX INVOICE / CASH MEMO", fill="#FFFFFF", font=font_h2, anchor="mm")

    # Company Details
    draw.text((45, 95), "SHARMA BROTHERS WHOLESALE DISTRIBUTORS", fill="#111827", font=font_title)
    draw.text((45, 135), "Leading Kirana, Grocery & FMCG Wholesale Merchants", fill="#4B5563", font=font_subtitle)
    draw.text((45, 158), "Gala No. 14-16, APMC Wholesale Market Phase-2, Vashi, Navi Mumbai - 400703", fill="#4B5563", font=font_small)
    draw.text((45, 178), "GSTIN: 27AABCS1429Q1Z8  |  FSSAI Lic No: 11521034000412  |  Mob: +91 98201 44552", fill="#1F2937", font=font_small_bold)

    # Top right QR / Badge box
    draw.rectangle([(W - 190, 95), (W - 45, 195)], outline="#D1D5DB", fill="#F3F4F6", width=1)
    draw.text((W - 117, 135), "[ GST VERIFIED ]", fill="#1E3A8A", font=font_small_bold, anchor="mm")
    draw.text((W - 117, 155), "ORIGINAL FOR", fill="#4B5563", font=font_small, anchor="mm")
    draw.text((W - 117, 172), "RECIPIENT", fill="#4B5563", font=font_small, anchor="mm")

    draw.line([(20, 210), (W - 20, 210)], fill="#E5E7EB", width=2)

    # Invoice & Buyer Metadata boxes
    draw.rectangle([(35, 225), (W // 2 - 15, 345)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    draw.text((50, 238), "INVOICE DETAILS:", fill="#1E3A8A", font=font_small_bold)
    draw.text((50, 262), "Invoice No:  INV-SB-4091", fill="#111827", font=font_bold)
    draw.text((50, 287), "Invoice Date: 20-Oct-2026", fill="#374151", font=font_regular)
    draw.text((50, 312), "Payment Mode: 15-Day Wholesale Credit", fill="#374151", font=font_regular)

    draw.rectangle([(W // 2 + 15, 225), (W - 35, 345)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    draw.text((W // 2 + 30, 238), "BILLED TO (RETAILER):", fill="#1E3A8A", font=font_small_bold)
    draw.text((W // 2 + 30, 262), "Lakshmi Kirana & General Store", fill="#111827", font=font_bold)
    draw.text((W // 2 + 30, 287), "Shop 3, Station Road, Chembur East, Mumbai", fill="#374151", font=font_regular)
    draw.text((W // 2 + 30, 312), "Store ID: INVQ-MUM-8921  |  Ph: +91 98765 43210", fill="#374151", font=font_regular)

    # TABLE HEADER
    t_top = 370
    draw.rectangle([(35, t_top), (W - 35, t_top + 38)], fill="#1E3A8A")
    cols = [
        ("Sr.", 45, "left"),
        ("Item Description", 100, "left"),
        ("HSN", 460, "left"),
        ("Pack Details", 540, "left"),
        ("Qty (Pcs)", 730, "right"),
        ("Rate (₹)", 830, "right"),
        ("Total (₹)", 945, "right"),
    ]
    for title, x, align in cols:
        draw.text((x, t_top + 10), title, fill="#FFFFFF", font=font_small_bold, anchor="lt" if align=="left" else "rt")

    # TABLE ITEMS
    items = [
        ("1", "Fortune Sunflower Oil 1L", "1512", "2 Cartons (12 pcs/ctn)", "24", "115.00", "2,760.00"),
        ("2", "Parle-G 100g Biscuits", "1905", "2 Cartons (24 pcs/ctn)", "48", "5.00", "240.00"),
        ("3", "Maggi 2-Min Noodles 70g", "1902", "4 Boxes (12 pcs/box)", "48", "12.00", "576.00"),
        ("4", "Lifebuoy Soap 100g", "3401", "1 Carton (24 pcs/ctn)", "24", "22.00", "528.00"),
        ("5", "Colgate Strong Teeth 200g", "3306", "1 Carton (20 pcs/ctn)", "20", "50.00", "1,000.00"),
        ("6", "Genda Phool Agarbatti", "3307", "2 Bundles (10 pkts/bdl)", "20", "15.00", "300.00"),
    ]

    row_y = t_top + 38
    for idx, (sr, name, hsn, pack, qty, rate, amt) in enumerate(items):
        bg = "#FFFFFF" if idx % 2 == 0 else "#F9FAFB"
        draw.rectangle([(35, row_y), (W - 35, row_y + 42)], fill=bg, outline="#E5E7EB", width=1)
        draw.text((cols[0][1], row_y + 12), sr, fill="#6B7280", font=font_small)
        draw.text((cols[1][1], row_y + 11), name, fill="#111827", font=font_bold)
        draw.text((cols[2][1], row_y + 12), hsn, fill="#6B7280", font=font_small)
        draw.text((cols[3][1], row_y + 12), pack, fill="#4B5563", font=font_small)
        draw.text((cols[4][1], row_y + 11), qty, fill="#111827", font=font_bold, anchor="rt")
        draw.text((cols[5][1], row_y + 12), rate, fill="#374151", font=font_regular, anchor="rt")
        draw.text((cols[6][1], row_y + 11), amt, fill="#111827", font=font_bold, anchor="rt")
        row_y += 42

    # Fill remaining table space
    draw.rectangle([(35, row_y), (W - 35, row_y + 60)], fill="#FFFFFF", outline="#E5E7EB", width=1)
    draw.text((50, row_y + 20), "Total Quantity Received: 184 Units across 6 Products", fill="#4B5563", font=font_small_bold)

    # SUMMARY / TOTALS BOX
    tot_y = row_y + 80
    draw.rectangle([(W - 420, tot_y), (W - 35, tot_y + 190)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    
    sum_lines = [
        ("Subtotal:", "₹5,404.00", False),
        ("CGST (2.5%):", "₹135.10", False),
        ("SGST (2.5%):", "₹135.10", False),
        ("Round Off:", "+₹0.80", False),
    ]
    cur_y = tot_y + 12
    for l_label, l_val, _ in sum_lines:
        draw.text((W - 400, cur_y), l_label, fill="#4B5563", font=font_regular)
        draw.text((W - 55, cur_y), l_val, fill="#374151", font=font_regular, anchor="rt")
        cur_y += 26

    draw.line([(W - 420, cur_y + 5), (W - 35, cur_y + 5)], fill="#D1D5DB", width=1)
    cur_y += 15
    draw.rectangle([(W - 420, cur_y), (W - 35, cur_y + 45)], fill="#1E3A8A")
    draw.text((W - 400, cur_y + 12), "NET PAYABLE:", fill="#FFFFFF", font=font_bold)
    draw.text((W - 55, cur_y + 10), "₹5,675.00", fill="#FFFFFF", font=font_h2, anchor="rt")

    # Terms & Conditions (Left side)
    draw.text((45, tot_y + 10), "TERMS & CONDITIONS:", fill="#1E3A8A", font=font_small_bold)
    t_lines = [
        "1. Goods once sold will not be taken back or exchanged without prior authorization.",
        "2. Interest @ 18% p.a. will be charged if payment is not cleared within 15 days.",
        "3. Stock received verified against delivery challan by store owner.",
        "4. Subject to Mumbai Jurisdiction only."
    ]
    ty = tot_y + 35
    for tl in t_lines:
        draw.text((45, ty), tl, fill="#6B7280", font=font_small)
        ty += 22

    # SIGNATURES & STAMPS
    sig_y = H - 180
    draw.rectangle([(45, sig_y), (280, sig_y + 110)], outline="#D1D5DB", fill="#FFFFFF", width=1)
    draw.text((162, sig_y + 15), "Lakshmi Kirana Store", fill="#9CA3AF", font=font_small, anchor="mm")
    draw.text((162, sig_y + 50), "[ STORE STAMP ]", fill="#2563EB", font=font_small_bold, anchor="mm")
    draw.text((162, sig_y + 90), "Receiver's Signature", fill="#4B5563", font=font_small_bold, anchor="mm")

    draw.rectangle([(W - 300, sig_y), (W - 45, sig_y + 110)], outline="#D1D5DB", fill="#FFFFFF", width=1)
    draw.text((W - 172, sig_y + 15), "Sharma Brothers Wholesale", fill="#9CA3AF", font=font_small, anchor="mm")
    draw.ellipse([(W - 250, sig_y + 30), (W - 95, sig_y + 80)], outline="#DC2626", width=2)
    draw.text((W - 172, sig_y + 55), "SHARMA BROS", fill="#DC2626", font=font_small_bold, anchor="mm")
    draw.text((W - 172, sig_y + 90), "Authorized Signatory", fill="#4B5563", font=font_small_bold, anchor="mm")

    # Footer note
    draw.text((W // 2, H - 35), "Computer-generated wholesale invoice for Kirana Reorder & Inventory Management", fill="#9CA3AF", font=font_small, anchor="mm")

    out_public = os.path.join(public_dir, "invoice_sharma_traders.png")
    out_artifact = os.path.join(artifact_dir, "invoice_sharma_traders.png")
    img.save(out_public, "PNG")
    img.save(out_artifact, "PNG")
    print(f"Saved: {out_public}")


# ==============================================================================
# INVOICE 2: MUMBAI DAIRY SUPPLIES & PROVISIONS
# ==============================================================================
def create_invoice_dairy():
    W, H = 1000, 1260
    img = Image.new("RGB", (W, H), color="#FDFDFD")
    draw = ImageDraw.Draw(img)

    # Outer border & header bar
    draw.rectangle([(20, 20), (W - 20, H - 20)], outline="#047857", width=2)
    draw.rectangle([(20, 20), (W - 20, 70)], fill="#065F46")
    draw.text((W // 2, 45), "WHOLESALE DELIVERY CHALLAN & TAX INVOICE", fill="#FFFFFF", font=font_h2, anchor="mm")

    # Company Details
    draw.text((45, 95), "MUMBAI DAIRY SUPPLIES & FMCG WHOLESALE", fill="#111827", font=font_title)
    draw.text((45, 135), "Authorized Amul, Mother Dairy & Cold Chain Distributor", fill="#047857", font=font_subtitle)
    draw.text((45, 158), "G-4, Dadar Cold Storage Hub, Senapati Bapat Marg, Mumbai - 400028", fill="#4B5563", font=font_small)
    draw.text((45, 178), "GSTIN: 27AAMMD9921B1Z3  |  FSSAI Lic: 11523018000982  |  Hotline: +91 98334 11209", fill="#1F2937", font=font_small_bold)

    # Top right QR / Badge box
    draw.rectangle([(W - 190, 95), (W - 45, 195)], outline="#D1D5DB", fill="#ECFDF5", width=1)
    draw.text((W - 117, 130), "[ COLD CHAIN ]", fill="#065F46", font=font_small_bold, anchor="mm")
    draw.text((W - 117, 150), "DISPATCHED AT", fill="#047857", font=font_small, anchor="mm")
    draw.text((W - 117, 170), "4°C REFRIGERATED", fill="#047857", font=font_small_bold, anchor="mm")

    draw.line([(20, 210), (W - 20, 210)], fill="#E5E7EB", width=2)

    # Invoice & Buyer Metadata boxes
    draw.rectangle([(35, 225), (W // 2 - 15, 345)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    draw.text((50, 238), "DISPATCH & CHALLAN DETAILS:", fill="#065F46", font=font_small_bold)
    draw.text((50, 262), "Challan / Inv No: INV-MD-8812", fill="#111827", font=font_bold)
    draw.text((50, 287), "Dispatch Date: 20-Oct-2026 (Morning Route)", fill="#374151", font=font_regular)
    draw.text((50, 312), "Delivery Vehicle: MH-01-DR-4122 (Tempo)", fill="#374151", font=font_regular)

    draw.rectangle([(W // 2 + 15, 225), (W - 35, 345)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    draw.text((W // 2 + 30, 238), "CONSIGNEE (RETAILER):", fill="#065F46", font=font_small_bold)
    draw.text((W // 2 + 30, 262), "Lakshmi Kirana & General Store", fill="#111827", font=font_bold)
    draw.text((W // 2 + 30, 287), "Shop 3, Station Road, Chembur East, Mumbai", fill="#374151", font=font_regular)
    draw.text((W // 2 + 30, 312), "Route Order ID: ROT-7712  |  Delivery Slot: 7:30 AM", fill="#374151", font=font_regular)

    # TABLE HEADER
    t_top = 370
    draw.rectangle([(35, t_top), (W - 35, t_top + 38)], fill="#065F46")
    cols = [
        ("Sr.", 45, "left"),
        ("Product Description", 100, "left"),
        ("Category", 440, "left"),
        ("Packaging / Batch", 550, "left"),
        ("Quantity", 730, "right"),
        ("Wholesale (₹)", 830, "right"),
        ("Total (₹)", 945, "right"),
    ]
    for title, x, align in cols:
        draw.text((x, t_top + 10), title, fill="#FFFFFF", font=font_small_bold, anchor="lt" if align=="left" else "rt")

    # TABLE ITEMS
    items = [
        ("1", "Amul Full Cream Milk 1L", "Dairy", "3 Crates (10 pouches/ctn)", "30 Pcs", "60.00", "1,800.00"),
        ("2", "Amul Butter 100g", "Dairy", "1 Master Box (20 pcs)", "20 Pcs", "50.00", "1,000.00"),
        ("3", "Mother Dairy Curd 500g", "Dairy", "1 Crate (12 tubs)", "12 Tubs", "38.00", "456.00"),
        ("4", "Frooti Mango Drink 200ml", "Beverages", "2 Trays (24 tetra/tray)", "48 Tetra", "10.00", "480.00"),
        ("5", "Bisleri Mineral Water 1L", "Beverages", "1 Shrink Pack (24 bottles)", "24 Btls", "18.00", "432.00"),
    ]

    row_y = t_top + 38
    for idx, (sr, name, cat, pack, qty, rate, amt) in enumerate(items):
        bg = "#FFFFFF" if idx % 2 == 0 else "#F0FDF4"
        draw.rectangle([(35, row_y), (W - 35, row_y + 44)], fill=bg, outline="#E5E7EB", width=1)
        draw.text((cols[0][1], row_y + 13), sr, fill="#6B7280", font=font_small)
        draw.text((cols[1][1], row_y + 12), name, fill="#111827", font=font_bold)
        draw.text((cols[2][1], row_y + 13), cat, fill="#047857", font=font_small_bold)
        draw.text((cols[3][1], row_y + 13), pack, fill="#4B5563", font=font_small)
        draw.text((cols[4][1], row_y + 12), qty, fill="#111827", font=font_bold, anchor="rt")
        draw.text((cols[5][1], row_y + 13), rate, fill="#374151", font=font_regular, anchor="rt")
        draw.text((cols[6][1], row_y + 12), amt, fill="#111827", font=font_bold, anchor="rt")
        row_y += 44

    # Fill remaining table space
    draw.rectangle([(35, row_y), (W - 35, row_y + 60)], fill="#FFFFFF", outline="#E5E7EB", width=1)
    draw.text((50, row_y + 20), "Total Received: 134 Fresh & Beverage Units delivered under standard cold-chain.", fill="#065F46", font=font_small_bold)

    # SUMMARY / TOTALS BOX
    tot_y = row_y + 80
    draw.rectangle([(W - 420, tot_y), (W - 35, tot_y + 170)], outline="#E5E7EB", fill="#F9FAFB", width=1)
    
    sum_lines = [
        ("Gross Goods Value:", "₹4,168.00"),
        ("Cold Chain Handling:", "₹0.00 (Waived)"),
        ("GST Included (5%):", "₹208.40"),
    ]
    cur_y = tot_y + 12
    for l_label, l_val in sum_lines:
        draw.text((W - 400, cur_y), l_label, fill="#4B5563", font=font_regular)
        draw.text((W - 55, cur_y), l_val, fill="#374151", font=font_regular, anchor="rt")
        cur_y += 28

    draw.line([(W - 420, cur_y + 5), (W - 35, cur_y + 5)], fill="#D1D5DB", width=1)
    cur_y += 15
    draw.rectangle([(W - 420, cur_y), (W - 35, cur_y + 45)], fill="#065F46")
    draw.text((W - 400, cur_y + 12), "TOTAL PAYABLE:", fill="#FFFFFF", font=font_bold)
    draw.text((W - 55, cur_y + 10), "₹4,168.00", fill="#FFFFFF", font=font_h2, anchor="rt")

    # Delivery & Verification Notes (Left side)
    draw.text((45, tot_y + 10), "DELIVERY & RETURN POLICY:", fill="#065F46", font=font_small_bold)
    t_lines = [
        "1. Temperature verified upon delivery: Below 4°C for dairy milk & curd.",
        "2. Empty crates must be returned with the next morning tempo delivery.",
        "3. Any leakage or packaging defect must be reported within 2 hours of receipt.",
        "4. Thank you for your continued partnership with Mumbai Dairy Supplies."
    ]
    ty = tot_y + 35
    for tl in t_lines:
        draw.text((45, ty), tl, fill="#6B7280", font=font_small)
        ty += 22

    # SIGNATURES & STAMPS
    sig_y = H - 180
    draw.rectangle([(45, sig_y), (280, sig_y + 110)], outline="#D1D5DB", fill="#FFFFFF", width=1)
    draw.text((162, sig_y + 15), "Lakshmi Kirana Store", fill="#9CA3AF", font=font_small, anchor="mm")
    draw.text((162, sig_y + 50), "[ RECEIVED OK ]", fill="#059669", font=font_small_bold, anchor="mm")
    draw.text((162, sig_y + 90), "Store Receiver Signature", fill="#4B5563", font=font_small_bold, anchor="mm")

    draw.rectangle([(W - 300, sig_y), (W - 45, sig_y + 110)], outline="#D1D5DB", fill="#FFFFFF", width=1)
    draw.text((W - 172, sig_y + 15), "Mumbai Dairy Logistics", fill="#9CA3AF", font=font_small, anchor="mm")
    draw.ellipse([(W - 250, sig_y + 30), (W - 95, sig_y + 80)], outline="#059669", width=2)
    draw.text((W - 172, sig_y + 55), "MUMBAI DAIRY", fill="#059669", font=font_small_bold, anchor="mm")
    draw.text((W - 172, sig_y + 90), "Route In-Charge", fill="#4B5563", font=font_small_bold, anchor="mm")

    draw.text((W // 2, H - 35), "Official Wholesale Delivery Challan for Automated OCR Ingestion", fill="#9CA3AF", font=font_small, anchor="mm")

    out_public = os.path.join(public_dir, "invoice_mumbai_dairy.png")
    out_artifact = os.path.join(artifact_dir, "invoice_mumbai_dairy.png")
    img.save(out_public, "PNG")
    img.save(out_artifact, "PNG")
    print(f"Saved: {out_public}")

if __name__ == "__main__":
    create_invoice_sharma()
    create_invoice_dairy()
    print("Done generating 2 demo invoices!")
