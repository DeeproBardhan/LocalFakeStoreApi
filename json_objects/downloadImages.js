const fs = require("fs");
const path = require("path");
const axios = require("axios");

// Read the JSON file
const products = require("./products.json");

// Function to download an image
async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    responseType: "stream",
  });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(fs.createWriteStream(filepath))
      .on("finish", () => {
        console.log(`Downloaded: ${filepath}`);
        resolve();
      })
      .on("error", (e) => reject(e));
  });
}

// Main function to process products
async function processProducts() {
  const assetsDir = path.join(__dirname, "assets");

  // Create assets directory if it doesn't exist
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  for (const product of products) {
    const productId = product.id;
    const productDir = path.join(assetsDir, `product_${productId}`);

    // Create directory for the product
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir);
    }

    // Download images and update paths in JSON
    if (product.meta.qrCode) {
      const qrCodePath = path.join(productDir, "qrCode.png");
      await downloadImage(product.meta.qrCode, qrCodePath);
      product.meta.qrCode = `/assets/product_${productId}/qrCode.png`;
    }

    if (product.images) {
      product.images = await Promise.all(
        product.images.map(async (imageUrl, index) => {
          const imagePath = path.join(productDir, `image_${index}.png`);
          await downloadImage(imageUrl, imagePath);
          return `/assets/product_${productId}/image_${index}.png`;
        })
      );
    }

    if (product.thumbnail) {
      const thumbnailPath = path.join(productDir, "thumbnail.png");
      await downloadImage(product.thumbnail, thumbnailPath);
      product.thumbnail = `/assets/product_${productId}/thumbnail.png`;
    }
  }

  // Write the updated JSON to a new file
  fs.writeFileSync(
    path.join(__dirname, "updated_products.json"),
    JSON.stringify(products, null, 2)
  );
}

// Execute the main function
processProducts()
  .then(() => {
    console.log("Images downloaded and JSON updated successfully.");
  })
  .catch((err) => {
    console.error("Error processing products:", err);
  });
