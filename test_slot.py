from decimal import Decimal
from vending.chips import Chips
from vending.slot import Slot

slot = Slot("A1")
chip = Chips("Potato Crisps", Decimal("3.05"))

for _ in range(3):
    slot.add_product(chip)

print(slot)                   
print(slot.dispense_product()) 
print(slot.get_product_count()) 
print(slot.is_sold_out())       