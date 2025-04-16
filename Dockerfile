# Use the official Node.js 23 slim image as the base
FROM node:23-slim

# Install OpenSSL to resolve Prisma warning
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Debug: List contents of /app and /app/dist to verify build output
RUN ls -la /app && ls -la /app/dist

# Expose the port the app runs on
EXPOSE 5000

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]