# Berkas penampung (container) untuk menjalankan aplikasi ini di layanan
# hosting berbasis Docker. Aplikasi tetap dijalankan apa adanya lewat
# perintah start yang sama seperti di komputer lokal.
FROM node:20-slim

WORKDIR /app

# Pasang dependensi lebih dulu agar lapisan ini tersimpan di tembolok
# dan tidak diulang setiap ada perubahan kode.
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Port diisi oleh layanan hosting lewat variabel lingkungan PORT;
# nilai bawaan di bawah hanya cadangan untuk menjalankan penampung
# di komputer lokal (docker run).
ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
