module.exports = {
  routes: [
    {
      method: "GET",
      path: "/products/:_id/build",
      handler: "Product.build",
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
