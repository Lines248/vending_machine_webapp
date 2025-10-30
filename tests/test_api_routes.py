import unittest
from decimal import Decimal

import app as app_module

from vending.vending_machine import VendingMachine
from vending.slot import Slot
from vending.chips import Chips
from vending.transaction_manager import TransactionManager


class DummyFileManager:
    def write_to_log(self, message: str = "Event") -> None:
        pass


class ApiRouteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
    
        slot_a1 = Slot("A1")
        for _ in range(2):
            slot_a1.add_product(Chips("Potato Crisps", Decimal("1.25")))

        slot_b1 = Slot("B1")
        slot_b1.add_product(Chips("Stackers", Decimal("0.75")))

        vm = VendingMachine({"A1": slot_a1, "B1": slot_b1})
        tm = TransactionManager()
        fm = DummyFileManager()

        app_module.vm = vm
        app_module.tm = tm
        app_module.file_manager = fm

        app_module.app.testing = True
        cls.client = app_module.app.test_client()

    def setUp(self):
        app_module.tm.reset_balance()


    def test_inventory_endpoint(self):
        resp = self.client.get("/api/inventory")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["ok"])
        slots = {row["slot_id"]: row for row in data["inventory"]}
        self.assertIn("A1", slots)
        self.assertIn("B1", slots)
        self.assertEqual(slots["A1"]["count"], 2)
        self.assertEqual(slots["B1"]["count"], 1)

    def test_status_endpoint_starts_at_zero(self):
        resp = self.client.get("/api/status")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["balance"], "0.00")


    def test_feed_default_amount_is_one_dollar(self):
        resp = self.client.post("/api/feed", json={})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["balance"], "1.00")

    def test_feed_custom_amount(self):
        resp = self.client.post("/api/feed", json={"amount": "3.50"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.get_json()["balance"], "3.50")

    def test_feed_rejects_negative(self):
        resp = self.client.post("/api/feed", json={"amount": "-1.00"})
        self.assertEqual(resp.status_code, 400)
        data = resp.get_json()
        self.assertFalse(data["ok"])
        self.assertIn("Amount must be positive", data["error"])

    def test_feed_rejects_bad_number(self):
        resp = self.client.post("/api/feed", json={"amount": "not-a-number"})
        self.assertEqual(resp.status_code, 400)


    def test_purchase_invalid_slot(self):
        self.client.post("/api/feed", json={"amount": "5.00"})
        resp = self.client.post("/api/purchase", json={"slot_id": "Z9"})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Invalid slot", resp.get_json()["error"])

    def test_purchase_insufficient_funds(self):
        self.client.post("/api/feed", json={"amount": "1.00"})
        resp = self.client.post("/api/purchase", json={"slot_id": "A1"})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Insufficient funds", resp.get_json()["error"])

    def test_purchase_success_updates_balance_and_count(self):
        self.client.post("/api/feed", json={"amount": "1.00"})
        resp = self.client.post("/api/purchase", json={"slot_id": "B1"})
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["product"]["name"], "Stackers")
        self.assertEqual(data["product"]["price"], "0.75")
        self.assertEqual(data["balance"], "0.25")
        self.assertTrue(data["slot"]["sold_out"])
        self.assertEqual(data["slot"]["count"], 0)

    def test_purchase_sold_out(self):
        self.client.post("/api/feed", json={"amount": "5.00"})  # plenty of balance
        self.client.post("/api/purchase", json={"slot_id": "A1"})
        self.client.post("/api/purchase", json={"slot_id": "A1"})
        resp = self.client.post("/api/purchase", json={"slot_id": "A1"})
        self.assertEqual(resp.status_code, 400)
        self.assertIn("SOLD OUT", resp.get_json()["error"])


    def test_finish_returns_change_and_resets_balance(self):
        self.client.post("/api/feed", json={"amount": "2.40"})
        resp = self.client.post("/api/finish")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["change"]["quarters"], 9)
        self.assertEqual(data["change"]["dimes"], 1)
        self.assertEqual(data["change"]["nickels"], 1)
        self.assertEqual(data["change"]["change_total"], "2.40")
        self.assertEqual(data["balance"], "0.00")


if __name__ == "__main__":
    unittest.main(verbosity=2)