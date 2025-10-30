from decimal import Decimal
from vending.product import Product

class Gum(Product):
    def __init__(self, name: str, price: Decimal):
        super().__init__(name, price)

    def dispense_sound(self) -> str:
        return "Chew Chew, Yum!"