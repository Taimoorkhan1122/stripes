"use strict";

/**
 * A set of functions called "actions" for `build`
 */

const _ = require("lodash");
const { ApplicationError } = require("@strapi/utils/lib/errors");

module.exports = {
  build: async (ctx, next) => {
    try {
      const product = await strapi.entityService.findOne(
        "api::product.product",
        ctx.params?.id,
        {
          fields: ["*"],
        }
      );
      console.log(product);
      if (!product.attributes.length) return;

      /*
        function to create cartesian product of given arrays 
          [[1], ["a"], ["hello"]] => [1, "a", "hello"]
      */
      const cartesian = (sets) => {
        return sets.reduce(
          (acc, curr) => {
            return acc
              .map((x) => {
                return curr.map((y) => {
                  return x.concat([y]);
                });
              })
              .flat();
          },
          [[]]
        );
      };

      //capitalize function
      const capitalize = (s) => {
        if (typeof s !== "string") return "";
        return s
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      };

      const { attributes } = product;

      /*
        map functions return an array of array [["sm", "md", "lg"], ["red", "green", "blue"]]
        cartesian function reduces and combines arrays and returns mixed variations
        [ [ { size: 'sm' }, { color: 'blue' } ], [ { size: 'sm' }, { color: 'red' } ], [ { size: 'sm' }, { color: 'green' } ], [ { size: 'md' }, { color: 'blue' } ], [ { size: 'md' }, { color: 'red' } ], [ { size: 'md' }, { color: 'green' } ], [ { size: 'lg' }, { color: 'blue' } ], [ { size: 'lg' }, { color: 'red' } ], [ { size: 'lg' }, { color: 'green' } ]]
      */
      const variations = cartesian(
        _.map(attributes, ({ name, options }) =>
          _.map(options, ({ value, description }) => ({ [name]: value, description }))
        )
      );

      //iterate through all variations creating the records
      const records = _.map(variations, (variation) => {
        let name = variation.reduce(
          (acc, current) => acc + " " + Object.values(current)[0],
          product.name
        );
        let slug = variation
          .reduce(
            (acc, current) => acc + "-" + Object.values(current)[0].replace(/ /g, "-"),
            product.slug
          )
          .toLowerCase();

        return {
          product: product._id,
          name: capitalize(name),
          slug: slug,
          price: product.price,
          description: product.description,
          variantDescription: variation.description,
          stock: product.stock,
          ...("sale" in product && { sale: product.sale }),
        };
      });

      console.log("variations", variations[0], { records});


      ctx.body = { data: {product, records} };
    } catch (err) {
      console.log("error", err);
      throw new ApplicationError("Error occurred :", err);
    }
  },
};


// https://hashinteractive.com/blog/strapi-ecommerce-product-variations-generator/
