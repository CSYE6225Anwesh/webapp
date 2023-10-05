const supertest = require('supertest');
const app = require('../src/app');


var assert = require('assert');


describe('Testing our Application', function () {
    it('Simple assert test', function () {
        assert.equal(1, 1);
    });

    it('GET /healthz end point of the application', (done) => {
        supertest(app)
            .get('/healthz')
            .expect(200)
            .end((err, response) => {
                if (err) return done(err)
                else{

                    done()
  
                    process.exit()
  
                  }
            })
    })
    
});