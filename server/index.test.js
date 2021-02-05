const app = require('./index');
const request = require('supertest');
const Cars = require('./CarList');

describe('API test calls', () => {
  it("should return status 200 and non-empty message for GET /", async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text.length).toBeGreaterThan(0);
  });


  it('should return a non-empty array for GET /api/makes', async () => {
    const response = await request(app).get('/api/makes');
    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
  });
  
  for(let make in Cars) {
    it('should return non empty array of models for all makes', async () => {
      const response = await request(app).get(`/api/models?selectedMake=${make}`);
      expect(response.statusCode).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  }


});