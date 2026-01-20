# Stage 1: Build the React application
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and yarn.lock (if available)
COPY package.json yarn.lock* ./

# Install dependencies
RUN yarn install

# Copy source code
COPY . .

# Build the app
RUN yarn build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/build /usr/share/nginx/html

# Custom Nginx config to handle React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
