# syntax=docker/dockerfile:1.4
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose a port (if your app listens on a specific port)
EXPOSE 1234

# Define the command to run your application (e.g., npm start)
CMD ["npm", "run", "dev"]