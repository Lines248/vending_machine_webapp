from typing import List, Optional
from vending.product import Product

class Slot:

    MAXIMUM_CAPACITY = 5

    def __init__(self, slot_id: str):
        self.slot_id = slot_id
        self.products: List[Product] = []

    def is_sold_out(self) -> bool:

        return len(self.products) == 0

    def add_product(self, product: Product):
        if product is None:
            raise ValueError("Cannot add a null product.")
        if len(self.products) >= self.MAXIMUM_CAPACITY:
            raise ValueError(f"Slot {self.slot_id} is full (max {self.MAXIMUM_CAPACITY}).")
        self.products.append(product)

    def get_product(self, index: int = 0) -> Optional[Product]:
        
        if 0 <= index < len(self.products):
            return self.products[index]
        return None

    def get_product_count(self) -> int:
      
        return len(self.products)

    def dispense_product(self) -> Optional[Product]:

        if self.is_sold_out():
            return None
        return self.products.pop(0)

    def __str__(self) -> str:

        if self.is_sold_out():
            return f"{self.slot_id}: SOLD OUT"
        front_product = self.products[0]
        return f"{self.slot_id}: {front_product.name} (${front_product.price:.2f}) [{len(self.products)} remaining]"