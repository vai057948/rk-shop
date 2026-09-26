require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================
   MIDDLEWARE
========================================= */

app.use(cors());
app.use(express.json());


/* =========================================
   ENVIRONMENT VARIABLES
========================================= */

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;


/* =========================================
   SECURITY CHECK
========================================= */

if (
    !MONGODB_URI ||
    !ADMIN_USERNAME ||
    !ADMIN_PASSWORD_HASH ||
    !JWT_SECRET
) {
    console.log("❌ Required Environment Variables missing!");

    console.log(`
Required:
MONGODB_URI
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
JWT_SECRET
`);

    process.exit(1);
}


/* =========================================
   MONGODB
========================================= */

const client = new MongoClient(MONGODB_URI);


/* =========================================
   AUTHENTICATION MIDDLEWARE
========================================= */

function authenticateAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });

    }


    const token =
        authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;


    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Invalid authentication token"
        });

    }


    try {

        const decoded =
            jwt.verify(token, JWT_SECRET);


        if (
            decoded.username !== ADMIN_USERNAME
        ) {

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }


        req.admin = decoded;

        next();


    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Token expired or invalid"
        });

    }

}


/* =========================================
   START SERVER
========================================= */

async function startServer() {

    try {

        await client.connect();

        console.log(
            "✅ MongoDB Connected Successfully!"
        );


        const db =
            client.db("rkshop");


        const productsCollection =
            db.collection("products");


        /* =====================================
           HOME
        ===================================== */

        app.get("/", (req, res) => {

            res.json({

                success: true,

                message:
                    "RK Shop Backend + MongoDB is Running!"

            });

        });


        /* =====================================
           ADMIN LOGIN
        ===================================== */

        app.post(
            "/api/admin/login",
            async (req, res) => {

                try {

                    const {
                        username,
                        password
                    } = req.body;


                    if (
                        !username ||
                        !password
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Username and password required"

                        });

                    }


                    if (
                        username !==
                        ADMIN_USERNAME
                    ) {

                        return res.status(401).json({

                            success: false,

                            message:
                                "Invalid username or password"

                        });

                    }


                    const passwordMatch =
                        await bcrypt.compare(
                            password,
                            ADMIN_PASSWORD_HASH
                        );


                    if (!passwordMatch) {

                        return res.status(401).json({

                            success: false,

                            message:
                                "Invalid username or password"

                        });

                    }


                    const token =
                        jwt.sign(
                            {
                                username:
                                    ADMIN_USERNAME,

                                role: "admin"
                            },

                            JWT_SECRET,

                            {
                                expiresIn:
                                    "2h"
                            }
                        );


                    res.json({

                        success: true,

                        message:
                            "Login successful",

                        token

                    });


                } catch (error) {

                    console.error(error);

                    res.status(500).json({

                        success: false,

                        message:
                            "Login failed"

                    });

                }

            }
        );


        /* =====================================
           CHECK ADMIN AUTH
        ===================================== */

        app.get(
            "/api/admin/check",
            authenticateAdmin,
            (req, res) => {

                res.json({

                    success: true,

                    message:
                        "Admin authentication valid",

                    username:
                        req.admin.username

                });

            }
        );


        /* =====================================
           GET ALL PRODUCTS
           PUBLIC
        ===================================== */

        app.get(
            "/api/products",
            async (req, res) => {

                try {

                    const products =
                        await productsCollection
                            .find({})
                            .sort({
                                createdAt: -1
                            })
                            .toArray();


                    const formattedProducts =
                        products.map(product => ({

                            ...product,

                            _id:
                                product._id.toString(),

                            images:
                                Array.isArray(
                                    product.images
                                ) &&
                                product.images.length > 0

                                    ? product.images

                                    : product.image

                                        ? [product.image]

                                        : []

                        }));


                    res.json({

                        success: true,

                        products:
                            formattedProducts

                    });


                } catch (error) {

                    res.status(500).json({

                        success: false,

                        message:
                            "Products পাওয়া যায়নি",

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           GET SINGLE PRODUCT
           PUBLIC
        ===================================== */

        app.get(
            "/api/products/:id",
            async (req, res) => {

                try {

                    const productId =
                        req.params.id;


                    if (
                        !ObjectId.isValid(
                            productId
                        )
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Invalid Product ID"

                        });

                    }


                    const product =
                        await productsCollection
                            .findOne({

                                _id:
                                    new ObjectId(
                                        productId
                                    )

                            });


                    if (!product) {

                        return res.status(404).json({

                            success: false,

                            message:
                                "Product পাওয়া যায়নি"

                        });

                    }


                    const formattedProduct = {

                        ...product,

                        _id:
                            product._id.toString(),

                        images:
                            Array.isArray(
                                product.images
                            ) &&
                            product.images.length > 0

                                ? product.images

                                : product.image

                                    ? [product.image]

                                    : []

                    };


                    res.json({

                        success: true,

                        product:
                            formattedProduct

                    });


                } catch (error) {

                    res.status(500).json({

                        success: false,

                        message:
                            "Product details পাওয়া যায়নি",

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           ADD PRODUCT
           ADMIN ONLY
        ===================================== */

        app.post(
            "/api/products",
            authenticateAdmin,
            async (req, res) => {

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


                    let productImages = [];


                    if (
                        Array.isArray(images)
                    ) {

                        productImages =
                            images.filter(
                                img =>
                                    typeof img ===
                                        "string" &&
                                    img.trim() !== ""
                            );

                    }


                    if (
                        productImages.length === 0 &&
                        image
                    ) {

                        productImages = [image];

                    }


                    const newProduct = {

                        name:
                            name.trim(),

                        category:
                            category.trim(),

                        price:
                            Number(price),

                        image:
                            image ||
                            productImages[0] ||
                            "",

                        images:
                            productImages,

                        description:
                            description || "",

                        stock:
                            Number(stock) || 0,

                        createdAt:
                            new Date()

                    };


                    const result =
                        await productsCollection
                            .insertOne(
                                newProduct
                            );


                    res.status(201).json({

                        success: true,

                        message:
                            "Product successfully added!",

                        product: {

                            _id:
                                result.insertedId
                                    .toString(),

                            ...newProduct

                        }

                    });


                } catch (error) {

                    res.status(500).json({

                        success: false,

                        message:
                            "Product add করা যায়নি",

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           UPDATE PRODUCT
           ADMIN ONLY
        ===================================== */

        app.put(
            "/api/products/:id",
            authenticateAdmin,
            async (req, res) => {

                try {

                    const productId =
                        req.params.id;


                    if (
                        !ObjectId.isValid(
                            productId
                        )
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Invalid Product ID"

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


                    let productImages = [];


                    if (
                        Array.isArray(images)
                    ) {

                        productImages =
                            images.filter(
                                img =>
                                    typeof img ===
                                        "string" &&
                                    img.trim() !== ""
                            );

                    }


                    if (
                        productImages.length === 0 &&
                        image
                    ) {

                        productImages = [image];

                    }


                    const updatedProduct = {

                        name:
                            name.trim(),

                        category:
                            category.trim(),

                        price:
                            Number(price),

                        image:
                            image ||
                            productImages[0] ||
                            "",

                        images:
                            productImages,

                        description:
                            description || "",

                        stock:
                            Number(stock) || 0,

                        updatedAt:
                            new Date()

                    };


                    const result =
                        await productsCollection
                            .updateOne(

                                {
                                    _id:
                                        new ObjectId(
                                            productId
                                        )
                                },

                                {
                                    $set:
                                        updatedProduct
                                }

                            );


                    if (
                        result.matchedCount === 0
                    ) {

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

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           DELETE PRODUCT
           ADMIN ONLY
        ===================================== */

        app.delete(
            "/api/products/:id",
            authenticateAdmin,
            async (req, res) => {

                try {

                    const productId =
                        req.params.id;


                    if (
                        !ObjectId.isValid(
                            productId
                        )
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Invalid Product ID"

                        });

                    }


                    const result =
                        await productsCollection
                            .deleteOne({

                                _id:
                                    new ObjectId(
                                        productId
                                    )

                            });


                    if (
                        result.deletedCount === 0
                    ) {

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

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           SERVER
        ===================================== */

        app.listen(
            PORT,
            () => {

                console.log(
                    `🚀 RK Shop Backend running on port ${PORT}`
                );

            }
        );


    } catch (error) {

        console.log(
            "❌ MongoDB Connection Failed:"
        );

        console.log(
            error.message
        );

    }

}


startServer();
