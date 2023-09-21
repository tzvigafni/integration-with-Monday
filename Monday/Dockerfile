FROM node:18 as builder
WORKDIR /app
COPY frontend/ ./
RUN npm install
RUN npm run build
FROM node:18
WORKDIR /app
COPY backend/ ./
COPY --from=builder /app/build ./build
# COPY package*.json ./
RUN npm install
ENV URL=k8s-integrat-integrat-c5615f8b7f-709974499.us-east-1.elb.amazonaws.com/monday
ENV CLIENT_ID=22d544aa63e7f1c6f9b5a4da4e6a8814
ENV CLIENT_SECRET=4fde4bf8cc71152549a410b6fb36465d

ENV DB_HOST=database-1.clvafvuijgxh.us-east-1.rds.amazonaws.com
ENV DB_USER=admin
ENV DB_PASSWORD=BXGH6TNgCsfkgWf2lFRy

# Expose the server port
EXPOSE 8000
# Set the startup command
CMD ["node", "server.js"]