# webapp
test


## Prerequisites softwares and libraries
- MySQL DB
- NodeJS (Version 16.17)
- Sequelize (3rd party package for ORM in Node)
- bcryptjs
- express
- mocha
- mysql
- mysql2
- sequelize
- supertest
## Steps to deploy it locally.
- clone fork repo:  `git@github.com:AnweshPeddineni/webapp.git'

- run  `npm install` to install packages

- Once  node_modules is installed. create a .env file and add db details and port details.
-   `DB_HOSTNAME = localhost`
-   `DB_PASSWORD = 123456`
-   `DB_USER = root`
-   `DB_NAME = webapp`
-   `DB_DIALECT = mysql`
-   `DB_PORT = 3306`
-   `APP_PORT = 8080`
-    Before running a application make sure there 
- since node_modules contains nodemon as well. we can run the server using `npm start`

## Application Testing
run `npm test` : this runs test on integration-test.js