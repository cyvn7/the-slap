FROM nginx

# Create ssl directory
RUN mkdir -p /etc/nginx/ssl

# Copy configuration and SSL files
COPY default.conf /etc/nginx/conf.d/
COPY ssl/localhost.crt /etc/nginx/ssl/
COPY ssl/localhost.key /etc/nginx/ssl/

# Set permissions
RUN chmod 644 /etc/nginx/ssl/localhost.crt \
    && chmod 644 /etc/nginx/ssl/localhost.key