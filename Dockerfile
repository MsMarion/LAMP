FROM php:8.2-apache

RUN docker-php-ext-install pdo pdo_mysql

RUN a2enmod rewrite

# Same file-blocking rules the droplet uses
COPY apache/lamp-security.conf /etc/apache2/conf-available/lamp-security.conf
RUN a2enconf lamp-security

WORKDIR /var/www/html
