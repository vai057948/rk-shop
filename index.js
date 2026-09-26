require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.log("❌ MONGODB_URI পাওয়া যায়নি");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

async function startServer() {
    try {
        await client.connect();

        console.log("✅ MongoDB Connected Successfully!");

        const db = client.db("rkshop");
        const productsCollection = db.collection("products");

        // =========================
        // HOME / TEST ROUTE
        // =========================

        app.get("/", (req, res) => {
            res.json({
                success: true,
                message: "RK Shop Backend + MongoDB is Running!"
            });
        });

        // =========================
        // GET ALL PRODUCTS
        // =========================

        app.get("/api/products", async (req, res) => {
            try {
                const products =
                    await productsCollection
                        .find({})
                        .sort({ createdAt: -1 })
                        .toArray();

                const formattedProducts = products.map(product => ({
                    ...product,
                    _id: product._id.toString(),

                    // পুরোনো product-এর জন্যও images তৈরি হবে
                    images:
                        Array.isArray(product.images) &&
                        product.images.length > 0
                            ? product.images
                            : product.image
                                ? [product.image]
                                : []
                }));

                res.json({
                    success: true,
                    products: formattedProducts
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Products পাওয়া যায়নি",
                    error: error.message
                });
            }
        });

        // =========================
        // GET SINGLE PRODUCT
        // =========================

        app.get("/api/products/:id", async (req, res) => {
            try {
                const productId = req.params.id;

                if (!ObjectId.isValid(productId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Product ID"
                    });
                }

                const product =
                    await productsCollection.findOne({
                        _id: new ObjectId(productId)
                    });

                if (!product) {
                    return res.status(404).json({
                        success: false,
                        message: "Product পাওয়া যায়নি"
                    });
                }

                const formattedProduct = {
                    ...product,
                    _id: product._id.toString(),

                    // পুরোনো product-এর image থেকেও gallery তৈরি হবে
                    images:
                        Array.isArray(product.images) &&
                        product.images.length > 0
                            ? product.images
                            : product.image
                                ? [product.image]
                                : []
                };

                res.json({
                    success: true,
                    product: formattedProduct
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Product details পাওয়া যায়নি",
                    error: error.message
                });
            }
        });

        // =========================
        // ADD NEW PRODUCT
        // =========================

        app.post("/api/products", async (req, res) => {
            try {
                const {
                    name,
                    category,
                    price,
                    image,
                    images,
                    description,
                    stock
                } = req.body;

                // Required fields
                if (
                    !name ||
                    !category ||
                    price === undefined
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "name, category এবং price দিতে হবে"
                    });
                }

                // Multiple images
                let productImages = [];

                if (Array.isArray(images)) {
                    productImages = images.filter(
                        img =>
                            typeof img === "string" &&
                            img.trim() !== ""
                    );
                }

                // যদি images না থাকে কিন্তু পুরোনো image থাকে
                if (
                    productImages.length === 0 &&
                    image
                ) {
                    productImages = [image];
                }

                const newProduct = {
                    name: name.trim(),
                    category: category.trim(),
                    price: Number(price),

                    // Main image
                    image:
                        image ||
                        productImages[0] ||
                        "",

                    // Multiple images
                    images: productImages,

                    description: description || "",

                    stock: Number(stock) || 0,

                    createdAt: new Date()
                };

                const result =
                    await productsCollection.insertOne(
                        newProduct
                    );

                res.status(201).json({
                    success: true,
                    message: "Product successfully added!",

                    product: {
                        _id:
                            result.insertedId.toString(),
                        ...newProduct
                    }
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Product add করা যায়নি",
                    error: error.message
                });
            }
        });

        // =========================
        // UPDATE PRODUCT
        // =========================

        app.put("/api/products/:id", async (req, res) => {
            try {
                const productId = req.params.id;

                if (!ObjectId.isValid(productId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Product ID"
                    });
                }

                const {
                    name,
                    category,
                    price,
                    image,
                    images,
                    description,
                    stock
                } = req.body;

                // Required fields
                if (
                    !name ||
                    !category ||
                    price === undefined
                ) {
                    return res.status(400).json({
                        success: false,
                        message:
                            "name, category এবং price দিতে হবে"
                    });
                }

                // Multiple images
                let productImages = [];

                if (Array.isArray(images)) {
                    productImages = images.filter(
                        img =>
                            typeof img === "string" &&
                            img.trim() !== ""
                    );
                }

                // যদি images না থাকে কিন্তু image থাকে
                if (
                    productImages.length === 0 &&
                    image
                ) {
                    productImages = [image];
                }

                const updatedProduct = {
                    name: name.trim(),
                    category: category.trim(),
                    price: Number(price),

                    image:
                        image ||
                        productImages[0] ||
                        "",

                    images: productImages,

                    description: description || "",

                    stock: Number(stock) || 0,

                    updatedAt: new Date()
                };

                const result =
                    await productsCollection.updateOne(
                        {
                            _id:
                                new ObjectId(productId)
                        },
                        {
                            $set:
                                updatedProduct
                        }
                    );

                if (result.matchedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Product পাওয়া যায়নি"
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Product successfully updated!"
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message:
                        "Product update করা যায়নি",
                    error: error.message
                });
            }
        });

        // =========================
        // DELETE PRODUCT
        // =========================

        app.delete("/api/products/:id", async (req, res) => {
            try {
                const productId = req.params.id;

                if (!ObjectId.isValid(productId)) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid Product ID"
                    });
                }

                const result =
                    await productsCollection.deleteOne({
                        _id:
                            new ObjectId(productId)
                    });

                if (result.deletedCount === 0) {
                    return res.status(404).json({
                        success: false,
                        message:
                            "Product পাওয়া যায়নি"
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Product successfully deleted!"
                });

            } catch (error) {
                res.status(500).json({
                    success: false,
                    message:
                        "Product delete করা যায়নি",
                    error: error.message
                });
            }
        });

        // =========================
        // START SERVER
        // =========================

        app.listen(PORT, () => {
            console.log(
                `🚀 RK Shop Backend running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.log(
            "❌ MongoDB Connection Failed:"
        );

        console.log(error.message);
    }
}

startServer();