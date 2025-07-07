import heapq
import os
import sys
import json
import struct

class HuffmanCoding:
    def __init__(self, path):
        self.path = path
        self.heap = []
        self.codes = {}
        self.reverse_mapping = {}

    class HeapNode:
        def __init__(self, char, freq):
            self.char = char
            self.freq = freq
            self.left = None
            self.right = None

        def __lt__(self, other):
            return self.freq < other.freq

    def make_frequency_dict(self, data):
        frequency = {}
        for byte in data:
            if byte not in frequency:
                frequency[byte] = 0
            frequency[byte] += 1
        return frequency

    def make_heap(self, frequency):
        for key in frequency:
            node = self.HeapNode(key, frequency[key])
            heapq.heappush(self.heap, node)

    def merge_nodes(self):
        while len(self.heap) > 1:
            node1 = heapq.heappop(self.heap)
            node2 = heapq.heappop(self.heap)
            merged = self.HeapNode(None, node1.freq + node2.freq)
            merged.left = node1
            merged.right = node2
            heapq.heappush(self.heap, merged)

    def make_codes_helper(self, root, current_code):
        if root is None:
            return
        if root.char is not None:
            self.codes[root.char] = current_code
            self.reverse_mapping[current_code] = root.char
            return
        self.make_codes_helper(root.left, current_code + "0")
        self.make_codes_helper(root.right, current_code + "1")

    def make_codes(self):
        # Handle empty heap (empty file)
        if not self.heap:
            return

        root = heapq.heappop(self.heap)
        current_code = ""
        self.make_codes_helper(root, current_code)
        
        # Handle single-character files: If only one unique character, assign "0" as its code
        if len(self.codes) == 0 and root.char is not None: # This specifically handles the case of a single character file
             self.codes[root.char] = "0"
             self.reverse_mapping["0"] = root.char
        elif len(self.codes) == 1 and root.char is None: # This handles cases where merge_nodes created a root with a single child
            # If the root is not a leaf node (meaning it has children) and there's only one code, 
            # it implies a single character in the original file.
            # We need to explicitly assign "0" to that character.
            for char_val in self.codes: # Iterate to find the single char
                self.codes[char_val] = "0"
                self.reverse_mapping["0"] = char_val
                break # Only one character, so we can break


    def get_encoded_text(self, data):
        encoded_text = ""
        for byte in data:
            encoded_text += self.codes[byte]
        return encoded_text

    def pad_encoded_text(self, encoded_text):
        extra_padding = 8 - len(encoded_text) % 8
        if extra_padding == 8: # If already a multiple of 8, no extra padding
            extra_padding = 0
        encoded_text += "0" * extra_padding
        padded_info = f"{extra_padding:08b}" # Store padding info as 8-bit binary
        return padded_info + encoded_text

    def get_byte_array(self, padded_encoded_text):
        b = bytearray()
        for i in range(0, len(padded_encoded_text), 8):
            byte = padded_encoded_text[i:i+8]
            b.append(int(byte, 2))
        return b

    def serialize_frequency(self, frequency):
        # Convert byte keys (int) to strings for JSON serialization
        string_frequency = {str(k): v for k, v in frequency.items()}
        return json.dumps(string_frequency).encode('utf-8') # Ensure UTF-8 encoding

    def compress_to_file(self, output_path):
        try:
            with open(self.path, 'rb') as file:
                data = file.read()
        except FileNotFoundError:
            print(f"Error: Input file '{self.path}' not found.")
            return

        frequency = self.make_frequency_dict(data)
        self.make_heap(frequency)
        
        # Handle empty file
        if not self.heap:
            with open(output_path, 'wb') as output:
                # Write 0 for freq_size, indicating no frequency table
                output.write(struct.pack('I', 0))
                # Write 0 for padding info (8 bits of 0s)
                output.write(b'\x00')
            print("Compression complete (empty file). Output saved to:", output_path)
            return

        self.merge_nodes()
        self.make_codes()
        
        # Serialize frequency table and write to file
        freq_bytes = self.serialize_frequency(frequency)
        # Write size of frequency table
        with open(output_path, 'wb') as output:
            output.write(struct.pack('I', len(freq_bytes)))
            output.write(freq_bytes)
            
            encoded_text = self.get_encoded_text(data)
            padded_encoded_text = self.pad_encoded_text(encoded_text)
            byte_array = self.get_byte_array(padded_encoded_text)
            output.write(byte_array)
        print("Compression complete. Output saved to:", output_path)

    def deserialize_frequency(self, freq_bytes):
        # Convert string keys back to int for byte values
        return {int(k): v for k, v in json.loads(freq_bytes.decode('utf-8')).items()}

    def remove_padding(self, padded_encoded_text):
        if len(padded_encoded_text) < 8: # Handle cases where there might not be enough bits for padding info
            return ""
        
        padded_info = padded_encoded_text[:8]
        extra_padding = int(padded_info, 2)
        
        # Check if removal would result in negative length or beyond bounds
        if 8 + extra_padding > len(padded_encoded_text):
            return "" # Or raise an error, depending on desired behavior for corrupted data
            
        return padded_encoded_text[8:-extra_padding] if extra_padding > 0 else padded_encoded_text[8:]

    def decode_text(self, encoded_text):
        current_code = ""
        decoded_bytes = bytearray()
        
        if not self.reverse_mapping: # Handle empty reverse mapping (e.g., empty file or single char file)
            return bytes(decoded_bytes)

        # Handle single character file decompression specifically
        if len(self.reverse_mapping) == 1 and "0" in self.reverse_mapping:
            single_char_byte = self.reverse_mapping["0"]
            # The encoded_text for a single character file will be all '0's (after padding removal)
            # The length of encoded_text indicates how many times the character should appear
            for _ in range(len(encoded_text)):
                decoded_bytes.append(single_char_byte)
            return bytes(decoded_bytes)

        for bit in encoded_text:
            current_code += bit
            if current_code in self.reverse_mapping:
                byte_val = self.reverse_mapping[current_code]
                decoded_bytes.append(byte_val)
                current_code = ""
        return bytes(decoded_bytes)

    def decompress(self, input_path, output_path):
        try:
            with open(input_path, 'rb') as file:
                # Read frequency table header
                freq_size_bytes = file.read(4)
                if not freq_size_bytes: # Handle empty compressed file
                    print("Decompression complete (empty compressed file). Output saved to:", output_path)
                    return
                
                freq_size = struct.unpack('I', freq_size_bytes)[0]
                
                frequency = {}
                if freq_size > 0:
                    freq_bytes = file.read(freq_size)
                    frequency = self.deserialize_frequency(freq_bytes)
                
                # If frequency is empty (original file was empty), just create empty output file
                if not frequency:
                    with open(output_path, 'wb') as output:
                        pass # Create empty file
                    print("Decompression complete (empty original file). Output saved to:", output_path)
                    return

                # Build Huffman tree from frequency table
                self.make_heap(frequency)
                self.merge_nodes()
                self.make_codes()
                
                # Read the rest of the file (encoded data)
                bit_string = ""
                byte = file.read(1)
                while byte:
                    bit_string += f"{byte[0]:08b}"
                    byte = file.read(1)
                
                # Handle cases where the bit_string might be very short or just the padding info
                if len(bit_string) < 8: # If there's less than 8 bits, it's malformed or empty
                    encoded_text = ""
                else:
                    encoded_text = self.remove_padding(bit_string)
                
                decompressed_data = self.decode_text(encoded_text)

            with open(output_path, 'wb') as output:
                output.write(decompressed_data)
            print("Decompression complete. Output saved to:", output_path)

        except FileNotFoundError:
            print(f"Error: Compressed file '{input_path}' not found.")
        except struct.error:
            print(f"Error: Corrupted compressed file '{input_path}'. Could not read frequency table size.")
        except json.JSONDecodeError:
            print(f"Error: Corrupted compressed file '{input_path}'. Could not decode frequency table.")
        except Exception as e:
            print(f"An unexpected error occurred during decompression: {e}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python main.py <command> <input_path> [output_path]")
        sys.exit(1)
    
    command = sys.argv[1]
    input_path = sys.argv[2]
    
    if command == "compress":
        output_path = sys.argv[3] if len(sys.argv) > 3 else input_path + ".bin"
        h = HuffmanCoding(input_path)
        h.compress_to_file(output_path)
    elif command == "decompress":
        # Determine a sensible default output path for decompression
        # If the input_path is "original.txt.bin", default to "original_decompressed.txt"
        # If the input_path is "compressed.bin", and no output specified, default to "compressed_decompressed" or similar.
        
        # First, try to remove a common compressed extension like '.bin'
        base_filename = os.path.basename(input_path)
        if base_filename.endswith('.bin'):
            base_filename_without_bin = base_filename[:-4] # Remove '.bin'
            original_ext = "" # We don't know the original extension directly from .bin
        else:
            base_filename_without_bin, original_ext = os.path.splitext(base_filename)

        # Construct a default output path
        default_output_dir = os.path.dirname(input_path)
        
        if original_ext: # If we managed to get an original extension (e.g., from original.txt.bin)
            default_output_path = os.path.join(default_output_dir, f"{base_filename_without_bin}_decompressed{original_ext}")
        else: # Fallback if we couldn't infer original extension, just append _decompressed
            default_output_path = os.path.join(default_output_dir, f"{base_filename_without_bin}_decompressed")
            
        output_path = sys.argv[3] if len(sys.argv) > 3 else default_output_path
        
        # When decompressing, the path passed to HuffmanCoding init isn't directly used
        # to open the input file, but rather for deriving the output file name if not provided.
        # It's better to pass the original file's expected name or a placeholder if the original name isn't known.
        # For simplicity, we can pass the output_path to the constructor here, as it will be used
        # by the decompress method's internal filename generation if we uncommented the old logic.
        # However, since decompress now takes explicit output_path, self.path's role is diminished for decompression.
        h = HuffmanCoding(output_path) # Pass the intended output path to the constructor for consistency.
        h.decompress(input_path, output_path)
    else:
        print("Invalid command. Use 'compress' or 'decompress'.")