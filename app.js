const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const products_json = require("./json_objects/updated_products.json");
const categories_json = require("./json_objects/categories.json");
const category_list_json = require("./json_objects/category-list.json");

const search_fields = ["title", "description", "category"];

const stop_words = [
  "a", "about", "above", "across", "after", "again", "against", "all", "almost", "alone", 
    "along", "already", "also", "although", "always", "am", "among", "an", "and", "another", 
    "any", "anybody", "anyone", "anything", "anywhere", "are", "around", "as", "at", "away", 
    "back", "be", "because", "before", "behind", "being", "below", "between", "both", "but", 
    "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "either", 
    "enough", "even", "every", "everybody", "everyone", "everything", "everywhere", "for", 
    "from", "further", "had", "has", "have", "having", "he", "he'd", "he'll", "he's", "her", 
    "here", "herself", "him", "himself", "his", "how", "however", "i", "i'd", "i'll", "i'm", 
    "i've", "if", "in", "indeed", "into", "is", "it", "it's", "its", "itself", "just", "keep", 
    "know", "like", "likely", "look", "made", "make", "many", "may", "me", "might", "more", 
    "most", "much", "must", "my", "myself", "near", "neither", "never", "new", "next", "no", 
    "nobody", "none", "noone", "nor", "not", "nothing", "now", "nowhere", "of", "off", "on", 
    "once", "one", "only", "onto", "or", "other", "others", "our", "ours", "ourselves", "out", 
    "over", "own", "quite", "rather", "really", "same", "see", "seem", "seemed", "seems", 
    "several", "she", "she'd", "she'll", "she's", "should", "show", "side", "since", "so", 
    "some", "somebody", "someone", "something", "somewhere", "still", "such", "take", "than", 
    "that", "the", "their", "them", "themselves", "then", "there", "there's", "these", "they", 
    "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", 
    "until", "up", "very", "was", "we", "we'd", "we'll", "we're", "we've", "well", "were", 
    "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", 
    "whom", "why", "why's", "with", "would", "you", "you'd", "you'll", "you're", "you've", 
    "your", "yours", "yourself", "yourselves"
];
let limit_g = 0,
  skip_g = 0,
  total_g = 0;

app.use(bodyParser.json());

// Serve static files from the assets directory inside json_objects
app.use("/assets", express.static(path.join(__dirname, "json_objects/assets")));

function search(keyword, products) {
  if (keyword.length < 1) return []; // skip if input is empty

  const results = [];
  let keywords = keyword.toLowerCase().split(" "); // split keyword into words
  keywords = keywords.filter((word) => !stop_words.includes(word)); // filter out stop words

  console.log("Searching....");
  products.forEach((product) => {
    for (const field of search_fields) {
      let valueWords = product[field].toLowerCase().split(" "); // split field value into words
      let match = keywords.every((word) => valueWords.includes(word)); // check if all keywords are present as individual words
      if (match) {
        results.push(product);
        break;
      }
    }
  });
  return results;
}

async function processing(skip, total, select_array, sortBy, order, q) {
  let products_json_copy = products_json;
  let product_result = []; //after processing the resulting array of prodcuts
  //search
  if (q) {
    products_json_copy = search(q, products_json);
  }

  if (total == 0) {
    products_json_copy.forEach((product) => {
      product_result.push(product);
    });
    total_g = product_result.length;
  } else {
    //for normal pushing data and when select values present
    for (let i = skip; i < total; i++) {
      if (i < products_json_copy.length) {
        let product = products_json_copy[i]; //indivigual product
        //if select is present this program works
        if (select_array.length > 0) {
          let selected_product = {};
          selected_product["id"] = product["id"];
          select_array.forEach((key) => {
            if (product.hasOwnProperty(key)) {
              selected_product[key] = product[key];
            }
          });
          select_array.forEach((key) => {
            if (product.hasOwnProperty(key)) {
              selected_product[key] = product[key];
            }
          });
          product_result.push(selected_product);
        } else {
          product_result.push(product);
        }
      }
    }
  }

  //for sorting by default or it is ascending
  if ((sortBy && order == "asc") || !order) {
    product_result.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });
  }
  //for sorting in descending
  if (sortBy && order == "desc") {
    product_result.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return +1;
      if (a[sortBy] > b[sortBy]) return -1;
      return 0;
    });
  }
  return product_result;
}

app.get("/products", async (req, res) => {
  let product_result = []; //after processing the resulting array of prodcuts
  const { limit, skip, select, sortBy, order } = req.query;
  isNaN(limit) ? (limit_g = 0) : (limit_g = parseInt(limit));

  isNaN(skip) ? (skip_g = 0) : (skip_g = parseInt(skip));

  let select_array = select ? select.split(",") : [];

  total_g = limit_g + skip_g;
  product_result = await processing(
    skip_g,
    total_g,
    select_array,
    sortBy,
    order,
    ""
  );

  console.log("limit:", limit_g);
  console.log("skip:", skip_g);
  console.log("select_array:", select_array);
  console.log("total=" + total_g);

  result = {
    products: product_result,
    total: total_g,
    skip: skip_g,
    limit: limit_g,
  };
  res.json(result);
});

app.get("/products/categories", async (req, res) => {
  res.json(categories_json);
});
app.get("/products/category-list", async (req, res) => {
  res.json(category_list_json);
});

app.get("/products/search", async (req, res) => {
  let product_result = []; //after processing the resulting array of prodcuts
  const { limit, skip, select, sortBy, order, q } = req.query;
  isNaN(limit) ? (limit_g = 0) : (limit_g = parseInt(limit));

  isNaN(skip) ? (skip_g = 0) : (skip_g = parseInt(skip));

  let select_array = select ? select.split(",") : [];

  total_g = limit_g + skip_g;

  product_result = await processing(
    skip_g,
    total_g,
    select_array,
    sortBy,
    order,
    q
  );
  console.log("limit:", limit_g);
  console.log("skip:", skip_g);
  console.log("select_array:", select_array);
  console.log("search_query:", q);
  console.log("total=" + total_g);
  result = {
    products: product_result,
    total: total_g,
    skip: skip_g,
    limit: limit_g,
  };
  res.json(result);
});

app.get("/products/:id", async (req, res) => {
  let product_result = [];
  products_json.forEach((product) => {
    if (product.id == req.params.id) {
      product_result = product;
      return;
    }
  });
  result = {
    products: product_result,
    total: total_g,
    skip: skip_g,
    limit: limit_g,
  };
  res.json(result);
});

app.listen(3000, () => console.log("server started"));
