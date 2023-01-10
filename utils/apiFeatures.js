class apiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    let queryObj = { ...this.queryString };
    const excludedFields = ["sort", "page", "fields", "limit"];
    excludedFields.forEach((ele) => delete queryObj[ele]);
    queryObj = JSON.stringify(queryObj).replace(
      /\b(lte|gte|gt|lt)\b/g,
      (match) => `$${match}`
    );

    this.query = this.query.find(JSON.parse(queryObj));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" "); //{sort:price,ratingsAverage} to {sort:price ratingsAverage}
      this.query = this.query.sort(sortBy);
    } else this.query = this.query.sort("createdAt");

    return this;
  }
  
  fields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else this.query = this.query.select("-__v");

    return this;
  }
  
  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    //for page 2 and limit 3 we have to skip 3 documents i.e (page-1)*limit
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}


module.exports=apiFeatures;