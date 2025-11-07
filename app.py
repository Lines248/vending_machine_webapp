from flask import Flask, render_template, jsonify
from vending.vending_machine import VendingMachine

app = Flask(__name__, static_folder="static", template_folder="templates")

try:
    machine = VendingMachine()
except Exception as e:
    print(f"[Startup Warning] Failed to init vending machine: {e}")
    machine = None

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/health")
def health():
    return jsonify(status="ok")

@app.route("/api/inventory")
def inventory():
    if not machine:
        return jsonify(error="Machine unavailable"), 500
    try:
        data = {slot: [p.name for p in s.products] for slot, s in machine.slots.items()}
        return jsonify(data)
    except Exception as e:
        return jsonify(error=str(e)), 500

if __name__ == "__main__":
    app.run(debug=True)