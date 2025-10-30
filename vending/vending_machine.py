from __future__ import annotations

from decimal import Decimal
from typing import Dict, Optional, List, TypedDict

from vending.slot import Slot
from vending.product import Product

class FrontItem(TypedDict, total=False):
    slot_id: str
    name: str
    price: str         
    count: int
    sold_out: bool


class VendingMachine:

    def __init__(self, slots: Dict[str, Slot]):
        self.slots: Dict[str, Slot] = {k.upper(): v for k, v in slots.items()}

    def get_slots(self) -> Dict[str, Slot]:
        return self.slots

    def get_slot(self, slot_id: str) -> Optional[Slot]:
        return self.slots.get(slot_id.upper())

    def is_valid_slot(self, slot_id: str) -> bool:
        return slot_id.upper() in self.slots

    def peek_front(self, slot_id: str) -> Optional[Product]:
        slot = self.get_slot(slot_id)
        if not slot:
            return None
        return slot.get_product(0)

    def front_item_info(self, slot_id: str) -> FrontItem:

        slot = self.get_slot(slot_id)
        if not slot:
            return {"slot_id": slot_id.upper(), "sold_out": True}

        front = slot.get_product(0)
        sold_out = slot.is_sold_out()

        if sold_out or front is None:
            return {
                "slot_id": slot_id.upper(),
                "sold_out": True,
                "count": 0
            }

        return {
            "slot_id": slot_id.upper(),
            "name": front.name,
            "price": f"{front.price:.2f}",
            "count": slot.get_product_count(),
            "sold_out": False,
        }

    def inventory_snapshot(self) -> List[FrontItem]:
    
        out: List[FrontItem] = []
        for slot_id in sorted(self.slots.keys()):
            out.append(self.front_item_info(slot_id))
        return out

    def dispense(self, slot_id: str) -> Optional[Product]:

        slot = self.get_slot(slot_id)
        if not slot:
            return None
        return slot.dispense_product()