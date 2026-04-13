# Minimal Dockerfile for testing ACR push (dry run!!)

FROM node:18-alpine

WORKDIR /app

# Create a simple dummy file so the build doesn't fail
RUN echo "Hello from Node.js Docker demo" > index.js

# Expose port (standard for Node.js apps)
EXPOSE 8080

# Dummy start command
CMD ["node", "index.js"]