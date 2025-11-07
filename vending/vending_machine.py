from vending.file_manager import FileManager
class VendingMachine:
    def __init__(self, slots=None):
        if slots is not None:
            self.slots = slots
        else:
            fm = FileManager()
            self.slots = fm.read_inventory()