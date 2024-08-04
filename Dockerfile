FROM node:21 AS builder
WORKDIR /app
COPY . /app
RUN npm ci
RUN cd packages/graph-editor && npm run build
RUN npm run build

FROM nginx:latest
COPY --from=builder /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/templates/default.conf.template
