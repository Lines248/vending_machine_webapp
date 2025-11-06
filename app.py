from __future__ import annotations
from decimal import Decimal, InvalidOperation
from flask import Flask, jsonify, request, render_template
import sys, os
from vending.file_manager import FileManager
from vending.transaction_manager import TransactionManager
from vending.vending_machine import VendingMachine

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, template_folder="templates", static_folder="static")

file_manager = FileManager()
slots = file_manager.read_inventory()
vm = VendingMachine(slots)
tm = TransactionManager()

def json_error(message: str, status: int = 400):
    return jsonify({"ok": False, "error": message}), status

def money_str(val: Decimal) -> str:
    return f"{val:.2f}"

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/inventory")
def api_inventory():
    return jsonify({"ok": True, "inventory": vm.inventory_snapshot()})

@app.get("/api/status")
def api_status():
    return jsonify({"ok": True, "balance": money_str(tm.get_balance())})

@app.post("/api/feed")
def api_feed():
    data = request.get_json(silent=True) or {}
    amount_str = data.get("amount", "1.00")
    try:
        amount = Decimal(str(amount_str))
        if amount <= 0:
            return json_error("Amount must be positive.")
    except (InvalidOperation, ValueError):
        return json_error("Invalid amount.")

    new_balance = tm.feed_money(amount)
    file_manager.write_to_log(f"FEED_MONEY ${money_str(amount)} -> balance ${money_str(new_balance)}")

    return jsonify({"ok": True, "balance": money_str(new_balance)})

@app.post("/api/purchase")
def api_purchase():
    data = request.get_json(silent=True) or {}
    slot_id = (data.get("slot_id") or "").upper().strip()
    if not slot_id:
        return json_error("slot_id is required")

    if not vm.is_valid_slot(slot_id):
        return json_error("Invalid slot code.")

    front = vm.peek_front(slot_id)
    if front is None:
        return json_error("Product is SOLD OUT.")

    can_buy = tm.purchase(front)
    if not can_buy:
        return json_error("Insufficient funds.")

    dispensed = vm.dispense(slot_id)
    if dispensed is None:
        return json_error("Product is SOLD OUT.")

    file_manager.write_to_log(
        f"PURCHASE {slot_id} {dispensed.name} ${money_str(dispensed.price)} -> balance ${money_str(tm.get_balance())}"
    )

    sound = getattr(dispensed, "dispense_sound", lambda: "")()

    return jsonify({
        "ok": True,
        "product": {
            "slot_id": slot_id,
            "name": dispensed.name,
            "price": money_str(dispensed.price),
            "sound": sound,
        },
        "balance": money_str(tm.get_balance()),
        "slot": vm.front_item_info(slot_id),
    })

@app.post("/api/finish")
def api_finish():
    change = tm.get_change()
    file_manager.write_to_log(
        f"FINISH -> change ${money_str(change['change_total'])} "
        f"(q={change['quarters']}, d={change['dimes']}, n={change['nickels']})"
    )
    change["change_total"] = money_str(change["change_total"])
    return jsonify({"ok": True, "change": change, "balance": money_str(tm.get_balance())})

if __name__ == "__main__":
    app.run(debug=True)