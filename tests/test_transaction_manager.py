import unittest
from decimal import Decimal

from vending.transaction_manager import TransactionManager
from vending.chips import Chips


class TestTransactionManager(unittest.TestCase):

    def setUp(self):
        self.tm = TransactionManager()
        self.chip = Chips("Potato Crisps", Decimal("3.05"))

    def test_feed_money_increases_balance(self):
        self.tm.feed_money(Decimal("1.00"))
        self.tm.feed_money(Decimal("2.00"))
        self.assertEqual(self.tm.get_balance(), Decimal("3.00"))

    def test_feed_money_rejects_negative_amount(self):
        with self.assertRaises(ValueError):
            self.tm.feed_money(Decimal("-1.00"))

    def test_purchase_with_enough_balance(self):
        self.tm.feed_money(Decimal("5.00"))
        success = self.tm.purchase(self.chip)
        self.assertTrue(success)
        self.assertEqual(self.tm.get_balance(), Decimal("1.95"))

    def test_purchase_with_insufficient_funds(self):
        success = self.tm.purchase(self.chip)
        self.assertFalse(success)
        self.assertEqual(self.tm.get_balance(), Decimal("0.00"))


    def test_get_change_returns_correct_coin_breakdown(self):
        self.tm.feed_money(Decimal("2.40"))   
        change = self.tm.get_change()        
    
        self.assertEqual(change["quarters"], 9)
        self.assertEqual(change["dimes"], 1)
        self.assertEqual(change["nickels"], 1)
        self.assertEqual(change["change_total"], Decimal("2.40"))
        self.assertEqual(self.tm.get_balance(), Decimal("0.00"))

    def test_reset_balance(self):
        self.tm.feed_money(Decimal("3.00"))
        self.tm.reset_balance()
        self.assertEqual(self.tm.get_balance(), Decimal("0.00"))


if __name__ == "__main__":
    unittest.main()