## Task Brief
In this exercise we want you to design an API for a vending machine, allowing users
with a “seller” role to add, update or remove products, while users with a “buyer” role
can deposit coins into the machine and make purchases. Your vending machine
should only accept 5, 10, 20, 50 and 100 cent coins.(Feel free to use AI generative tools
to assist in building the solution.)

## Task Req
- REST API should be implemented consuming and producing
“application/json”
- Implement product model with amountAvailable, cost, productName and
sellerId fields
- Implement user model with username, password, deposit and role fields
- Implement CRUD for users (POST shouldn’t require authentication)
- Implement CRUD for a product model (GET can be called by anyone, while
POST, PUT and DELETE can be called only by the seller user who created the
product)
- Implement /deposit endpoint so users with a “buyer” role can deposit 5, 10, 20,
50 and 100 cent coins into their vending machine account
- Implement /buy endpoint (accepts productId, amount of products) so users
with a “buyer” role can buy products with the money they’ve deposited. API
should return total they’ve spent, products they’ve purchased and their
change if there’s any (in 5, 10, 20, 50 and 100 cent coins)
- Implement /reset endpoint so users with a “buyer” role can reset their deposit
- Take time to think about possible edge cases and access issues that should be solved

## Run project
- npm run install
- npx prisma migrate dev --name init
- npm run start
- use the postman collection for testing/using the APIs

## For your info
```
This project built with help of NestJs docs, Prisma docs and ChatGPT
```
- NestJs Link: https://docs.nestjs.com/
- Prisma Link: https://www.prisma.io/docs/getting-started/quickstart
- ChatGPT Thread Link: https://chatgpt.com/share/6880f958-f6a8-8011-8c00-d0055ea18d82
- ChatGPT Thread for write e2e test Link: https://chatgpt.com/share/6881159a-0b7c-8011-9b32-7d9254053a8a