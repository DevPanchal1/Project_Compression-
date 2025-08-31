# Project Compression

A simple yet effective **file compression and decompression web app**, built as a test of skills by **Dev Panchal**.  
Currently, the app supports **`.txt` ↔ `.bin` conversions** with up to **~60% compression** for files sized **up to 3 MB**.

🔗 **Live Demo:** [project-compression.onrender.com](https://project-compression.onrender.com)

---

## 🚀 Features
- 🔄 Compress `.txt` files into `.bin` format  
- 🔓 Decompress `.bin` files back into `.txt`  
- 📉 Achieves ~60% file size reduction  
- 📂 Handles files up to **3 MB**  
- 🌐 Deployed and hosted on **Render**

---

## 🛠️ Tech Stack
- **Frontend:** React (UI for uploading/downloading files)  
- **Backend:** Node.js (handles requests, spawns Python processes)  
- **Compression Engine:** Python (core compression & decompression logic)  
- **Hosting:** Render  

---

## 📖 How It Works
1. User uploads a `.txt` or `.bin` file through the React frontend.  
2. The request is sent to the Node.js backend.  
3. Node.js spawns a **Python process** to run the compression/decompression logic.  
4. The processed file is returned to the user for download.  

---

## 📌 Roadmap
- [ ] Add support for more file types (PDF, DOCX, Images, etc.)  
- [ ] Improve compression ratio further  
- [ ] Implement drag-and-drop interface  
- [ ] Enable file history with user authentication  
- [ ] Optimize Python integration for faster performance  

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome!  
Feel free to fork this repo and submit a pull request.

---

## 📜 License
This project is licensed under the **MIT License**.

---

### 👨‍💻 Author
**Dev Panchal**  
*"A test of my skills."*
