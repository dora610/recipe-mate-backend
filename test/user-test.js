let expect = require('chai').expect;

describe('Avg rating from array', function () {
  it('Using reduce function', function () {
    let arr = [
      {
        _id: '621f940c72aa13da84802ad0',
        createdBy: '621bc8fe193aca7585a9ab0f',
        rating: 3.67,
        id: '621f940c72aa13da84802ad0',
      },
      {
        _id: '622127b85b2c75674257a92a',
        createdBy: '621bc8fe193aca7585a9ab0f',
        rating: 4,
        id: '622127b85b2c75674257a92a',
      },
      {
        _id: '62301f5d1fceccc27f4c8028',
        createdBy: '621bc8fe193aca7585a9ab0f',
        rating: 3.55,
        id: '62301f5d1fceccc27f4c8028',
      },
    ];
    let totalCount = arr.length;
    let totalRating = arr.reduce((prev, current) => prev + current.rating, 0);
    let avgRating = Math.round((totalRating / totalCount) * 100) / 100;

    expect(avgRating).to.equal(3.74);
  });
});
