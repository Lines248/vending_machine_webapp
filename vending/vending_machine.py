from vending.slot import Slot
from vending.file_manager import FileManager

class VendingMachine:
    def __init__(self, slots: dict[str, Slot] | None = None):
        if slots is not None:
            self.slots = slots
        else: 
            fm = FileManager()
            self.slots = fm.read_inventory()

    def is_valid_slot(self, slot_id: str) -> bool:
        return slot_id in self.slots

    def peek_front(self, slot_id: str):
        return self.slots[slot_id].get_product(0) if self.is_valid_slot(slot_id) else None

    def dispense(self, slot_id: str):
        return self.slots[slot_id].dispense_product() if self.is_valid_slot(slot_id) else None

    def inventory_snapshot(self):
        return {sid: str(slot) for sid, slot in self.slots.items()}

    def front_item_info(self, slot_id: str):
        slot = self.slots.get(slot_id)
        if not slot:
            return None
        front = slot.get_product(0)
        if not front:
            return None
        return {"name": front.name, "price": f"{front.price:.2f}"}