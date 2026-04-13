FROM node:18-alpine

WORKDIR /app

# Copy app code
COPY app.js .

# Expose the port Azure expects
EXPOSE 8080

# Start the app
CMD ["node", "app.js"]