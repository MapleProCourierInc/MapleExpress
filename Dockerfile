# Use lightweight Node 20 Alpine image
FROM node:20-alpine


RUN npm install -g pnpm@10.6.5

# Create and switch to working directory
WORKDIR /app

# Copy package files first for caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies with exact lockfile
RUN pnpm install --frozen-lockfile

# Copy the rest of the project
COPY . .

# Build Next.js app
RUN pnpm run build

# Expose port 3000
EXPOSE 3000

# Set port environment variable
ENV PORT=3000

# Start Next.js server
CMD ["pnpm", "start"]
