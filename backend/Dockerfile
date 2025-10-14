# Gunakan Go image
FROM golang:latest

# Set working directory di dalam container
WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
COPY go.mod go.sum ./

RUN go mod download

# Copy semua source code
COPY . .

# Build binary
RUN go build -o server .

# Jalankan server
CMD ["./server"]
