from decimal import Decimal
from vending.transaction_manager import TransactionManager
from vending.chips import Chips

tm = TransactionManager()
chip = Chips("Potato Crisps", Decimal("3.05"))

print(tm)  # $0.00
tm.feed_money(Decimal("5.00"))
print(tm)  # $5.00

if tm.purchase(chip):
    print(f"Purchased {chip.name}, remaining balance: ${tm.get_balance():.2f}")

change = tm.get_change()
print(f"Returned change: {change}")
print(tm)  # $0.00