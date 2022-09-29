
<!-- ABOUT THE PROJECT -->

### What's inside this repo?

1. User signup/registration with Email verification.
2. User Login.
3. Forgot password and reset password.
4. Session management using JWT (JSON Web Tokens).
5. Other APIs

### Built With

- [Node.js]() - JavaScript runtime built on Chrome's V8 JavaScript engine.
- [Express.js]() - Minimal and flexible Node.js web application framework
- [MongoDB]() - Cross-platform document-oriented database program

<!-- GETTING STARTED -->

## Getting Started

To get a local copy up and running follow these simple steps :

### Prerequisites

To run this project, you'll need to have the following installed:

- Node.js : [https://nodejs.org](https://nodejs.org)

- npm :
  ```sh
  npm install npm@latest -g
  ```
- MongoDB : [https://mongodb.com](https://mongodb.com) <br>

> You can also use MongoDB Atlas if you prefer.
> <br>

### Installation

1. Register at [SendGrid](https://sendgrid.com) SendGrid and create an API KEY.

2. Clone the repo :
   ```sh
   git clone https://github.com/PraneshASP/node-authentication-jwt-mongodb.git
   ```
3. Install dependencies (use `sudo` if required) :

   ```sh
   npm install
   ```

4. Create `.env` file and configure :
   ```JS
   MONGO_URI = <MONGODB_URL>
   JWT_SECRET = <SOME_LONG_SECURE_SECRET>
   ```
5. Start the server :
   ```sh
   npm start
   ```
