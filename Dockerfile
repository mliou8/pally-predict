FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Use npm install instead of npm ci to handle lock file differences
RUN npm install --legacy-peer-deps

# Copy rest of application
COPY . .

# Build args for Vite (needed at build time)
ARG VITE_PRIVY_APP_ID
ENV VITE_PRIVY_APP_ID=$VITE_PRIVY_APP_ID

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
