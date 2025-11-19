from flask import Flask, render_template, jsonify, request
from decimal import Decimal
from vending.vending_machine import VendingMachine
from vending.transaction_manager import TransactionManager

app = Flask(__name__, static_folder="static", template_folder="templates")

try:
    machine = VendingMachine()
except Exception as e:
    print(f"[Startup Warning] Failed to init vending machine: {e}")
    machine = None

transaction_manager = TransactionManager()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/favicon.ico")
def favicon():
    return "", 204

@app.route("/api/health")
def health():
    return jsonify(status="ok")

@app.route("/api/status")
def status():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        balance = transaction_manager.get_balance()
        return jsonify(balance=f"{balance:.2f}")
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/inventory")
def inventory():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        inventory_list = []
        for slot_id, slot in machine.slots.items():
            front_product = slot.get_product(0)
            if front_product:
                inventory_list.append({
                    "slot_id": slot_id,
                    "name": front_product.name,
                    "price": f"{front_product.price:.2f}",
                    "count": slot.get_product_count(),
                    "sold_out": False
                })
            else:
                inventory_list.append({
                    "slot_id": slot_id,
                    "name": None,
                    "price": "0.00",
                    "count": 0,
                    "sold_out": True
                })
        return jsonify(inventory=inventory_list)
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/purchase", methods=["POST"])
def purchase():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        data = request.get_json()
        slot_id = data.get("slot_id")
        
        if not slot_id:
            return jsonify(error="slot_id is required"), 400
        
        if not machine.is_valid_slot(slot_id):
            return jsonify(error=f"Invalid slot: {slot_id}"), 400
        
        front_product = machine.peek_front(slot_id)
        if not front_product:
            return jsonify(error=f"Slot {slot_id} is sold out"), 400 
 
        if not transaction_manager.purchase(front_product):
            balance = transaction_manager.get_balance()
            return jsonify(error=f"Insufficient funds. Balance: ${balance:.2f}"), 400
        
        dispensed = machine.dispense(slot_id)
        if not dispensed:
            transaction_manager.feed_money(front_product.price)
            return jsonify(error="Failed to dispense product"), 500
        
        balance = transaction_manager.get_balance()
        return jsonify({
            "product": {
                "name": dispensed.name,
                "price": f"{dispensed.price:.2f}",
                "sound": dispensed.dispense_sound()
            },
            "balance": f"{balance:.2f}"
        })
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/feed", methods=["POST"])
def feed():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        data = request.get_json()
        amount_str = data.get("amount")
        
        if not amount_str:
            return jsonify(error="amount is required"), 400
        
        amount = Decimal(amount_str)
        balance = transaction_manager.feed_money(amount)
        return jsonify(balance=f"{balance:.2f}")
    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route("/api/finish", methods=["POST"])
def finish():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        change = transaction_manager.get_change()
        change["change_total"] = float(change["change_total"])
        return jsonify(change=change)
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    app.run(debug=True)