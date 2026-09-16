"""List direct DLL imports from a Windows PE file without extra packages."""

import struct
import sys
from pathlib import Path


data = Path(sys.argv[1]).read_bytes()
pe = struct.unpack_from("<I", data, 0x3C)[0]
sections_count = struct.unpack_from("<H", data, pe + 6)[0]
optional_size = struct.unpack_from("<H", data, pe + 20)[0]
optional = pe + 24
magic = struct.unpack_from("<H", data, optional)[0]
directory = optional + (112 if magic == 0x20B else 96)
imports_rva = struct.unpack_from("<I", data, directory + 8)[0]
sections = []
for index in range(sections_count):
    offset = optional + optional_size + index * 40
    virtual_size, virtual_address, raw_size, raw_offset = struct.unpack_from("<IIII", data, offset + 8)
    sections.append((virtual_address, max(virtual_size, raw_size), raw_offset))


def file_offset(rva):
    for virtual_address, size, raw_offset in sections:
        if virtual_address <= rva < virtual_address + size:
            return raw_offset + rva - virtual_address
    raise ValueError(f"RVA outside sections: {rva:x}")


cursor = file_offset(imports_rva)
while True:
    descriptor = struct.unpack_from("<IIIII", data, cursor)
    if not any(descriptor):
        break
    name = file_offset(descriptor[3])
    end = data.index(0, name)
    print(data[name:end].decode("ascii"))
    cursor += 20
