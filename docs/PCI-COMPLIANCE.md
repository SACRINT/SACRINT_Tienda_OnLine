# PCI DSS Compliance Documentation

This document outlines the measures taken to ensure compliance with the Payment Card Industry Data Security Standard (PCI DSS) for the Tienda Online 2025 platform.

## 1. No Storage of Cardholder Data

**We do not store, process, or transmit any cardholder data on our servers.**

All payment information is handled directly by our payment processors, Stripe and Mercado Pago, which are PCI DSS Level 1 compliant service providers.

## 2. Use of Stripe Elements

- **Card Input**: We use **Stripe Elements** for all credit and debit card input fields.
- **Tokenization**: Stripe Elements tokenizes sensitive card information in the user's browser before it ever touches our servers.
- **SAQ A**: This approach makes us eligible for **SAQ A**, the simplest form of PCI DSS self-assessment, as we have outsourced all cardholder data functions.

## 3. Secure Payment Processing

- **API-based Payments**: All payments are initiated through secure, server-to-server API calls to Stripe and Mercado Pago.
- **Payment Intents**: We use the Payment Intents API, which is the recommended approach for Strong Customer Authentication (SCA) and 3D Secure.

## 4. HTTPS Everywhere

- **Vercel Enforcement**: The entire application is served over HTTPS, enforced by Vercel.
- **HSTS**: We have enabled HTTP Strict Transport Security (HSTS) to ensure browsers only connect to our site over HTTPS.

## 5. Rate Limiting

- **Checkout Endpoint**: The checkout and payment creation endpoints are rate-limited to prevent abuse and brute-force attacks.
- **Limit**: A maximum of 5 checkout attempts per user/IP address are allowed within a 15-minute window.

## 6. Access Control

- **Principle of Least Privilege**: Access to payment configurations and transaction data is restricted to authorized personnel only (SUPER_ADMIN role).
- **Stripe Dashboard**: Direct access to sensitive payment data is only available through the Stripe Dashboard, which has its own multi-factor authentication and security controls.

## 7. Regular Security Scans

- **Dependency Scanning**: We use `npm audit` and other tools to regularly scan for vulnerabilities in our dependencies.
- **Code Audits**: Regular security audits of our codebase are performed to identify and remediate potential vulnerabilities.

By following these practices, we ensure that our platform meets the requirements for PCI DSS compliance and provides a secure environment for our users' payment information.
