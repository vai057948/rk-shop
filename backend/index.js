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
   HELPER FUNCTIONS
========================================= */

function generateOrderId() {

    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const random =
        Math.floor(100000 + Math.random() * 900000);

    return `RK-${year}${month}${day}-${random}`;

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


        const ordersCollection =
            db.collection("orders");


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


                    const numericPrice =
                        Number(price);

                    const numericStock =
                        Number(stock);


                    if (
                        !Number.isFinite(
                            numericPrice
                        ) ||
                        numericPrice < 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid price দিতে হবে"

                        });

                    }


                    if (
                        !Number.isFinite(
                            numericStock
                        ) ||
                        numericStock < 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid stock দিতে হবে"

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
                        typeof image === "string" &&
                        image.trim() !== ""
                    ) {

                        productImages = [
                            image.trim()
                        ];

                    }


                    const newProduct = {

                        name:
                            name.trim(),

                        category:
                            category.trim(),

                        price:
                            numericPrice,

                        image:
                            typeof image === "string"
                                ? image.trim()
                                : (
                                    productImages[0] ||
                                    ""
                                ),

                        images:
                            productImages,

                        description:
                            typeof description === "string"
                                ? description.trim()
                                : "",

                        stock:
                            numericStock,

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

                    console.error(error);

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


                    const numericPrice =
                        Number(price);

                    const numericStock =
                        Number(stock);


                    if (
                        !Number.isFinite(
                            numericPrice
                        ) ||
                        numericPrice < 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid price দিতে হবে"

                        });

                    }


                    if (
                        !Number.isFinite(
                            numericStock
                        ) ||
                        numericStock < 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid stock দিতে হবে"

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
                        typeof image === "string" &&
                        image.trim() !== ""
                    ) {

                        productImages = [
                            image.trim()
                        ];

                    }


                    const updatedProduct = {

                        name:
                            name.trim(),

                        category:
                            category.trim(),

                        price:
                            numericPrice,

                        image:
                            typeof image === "string"
                                ? image.trim()
                                : (
                                    productImages[0] ||
                                    ""
                                ),

                        images:
                            productImages,

                        description:
                            typeof description === "string"
                                ? description.trim()
                                : "",

                        stock:
                            numericStock,

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

                    console.error(error);

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

                    console.error(error);

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
           CREATE ORDER
           PUBLIC
           
           IMPORTANT:
           Stock is reduced atomically in MongoDB.
        ===================================== */

        app.post(
            "/api/orders",
            async (req, res) => {

                try {

                    const {

                        productId,
                        quantity,
                        deliveryArea,
                        deliveryCharge,
                        customerName,
                        customerPhone,
                        customerAddress,
                        customerArea,
                        paymentMethod

                    } = req.body;


                    /* =========================
                       BASIC VALIDATION
                    ========================= */

                    if (
                        !productId ||
                        !ObjectId.isValid(productId)
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid productId দিতে হবে"

                        });

                    }


                    const orderQuantity =
                        Number(quantity);


                    if (
                        !Number.isInteger(
                            orderQuantity
                        ) ||
                        orderQuantity <= 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Valid quantity দিতে হবে"

                        });

                    }


                    const name =
                        typeof customerName === "string"
                            ? customerName.trim()
                            : "";

                    const phone =
                        typeof customerPhone === "string"
                            ? customerPhone.trim()
                            : "";

                    const address =
                        typeof customerAddress === "string"
                            ? customerAddress.trim()
                            : "";

                    const area =
                        typeof customerArea === "string"
                            ? customerArea.trim()
                            : "";


                    if (!name) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Customer name required"

                        });

                    }


                    if (!phone) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Customer phone required"

                        });

                    }


                    if (!address) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Customer address required"

                        });

                    }


                    if (!area) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Customer area required"

                        });

                    }


                    /* =========================
                       PHONE VALIDATION
                    ========================= */

                    const phonePattern =
                        /^(?:\+?8801|01)[3-9]\d{8}$/;


                    if (
                        !phonePattern.test(phone)
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "সঠিক Bangladesh phone number দিন"

                        });

                    }


                    /* =========================
                       DELIVERY
                    ========================= */

                    const validDeliveryArea =
                        deliveryArea === "outside"
                            ? "outside"
                            : "inside";


                    const calculatedDeliveryCharge =
                        validDeliveryArea === "outside"
                            ? 130
                            : 80;


                    /*
                       Frontend থেকে deliveryCharge
                       পাঠালেও আমরা সেটাকে বিশ্বাস করছি না।

                       Backend নিজে charge calculate করবে।
                    */


                    /* =========================
                       PAYMENT
                    ========================= */

                    const validPaymentMethod =
                        paymentMethod === "Cash on Delivery"
                            ? "Cash on Delivery"
                            : "Cash on Delivery";


                    /* =========================
                       PRODUCT
                    ========================= */

                    const product =
                        await productsCollection.findOne({

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


                    const productStock =
                        Number(product.stock || 0);


                    const productPrice =
                        Number(product.price || 0);


                    if (
                        productStock < orderQuantity
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                `এই product-এর পর্যাপ্ত stock নেই। Available stock: ${productStock}`

                        });

                    }


                    if (
                        !Number.isFinite(
                            productPrice
                        ) ||
                        productPrice < 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Product price invalid"

                        });

                    }


                    /* =========================
                       CALCULATE TOTAL
                    ========================= */

                    const productTotal =
                        productPrice *
                        orderQuantity;


                    const totalAmount =
                        productTotal +
                        calculatedDeliveryCharge;


                    /* =========================
                       ATOMIC STOCK UPDATE
                       
                       This is important.
                       MongoDB will reduce stock
                       only if enough stock still exists.
                    ========================= */

                    const stockUpdate =
                        await productsCollection.updateOne(

                            {
                                _id:
                                    new ObjectId(
                                        productId
                                    ),

                                stock:
                                    {
                                        $gte:
                                            orderQuantity
                                    }

                            },

                            {
                                $inc:
                                    {
                                        stock:
                                            -orderQuantity
                                    }

                            }

                        );


                    if (
                        stockUpdate.modifiedCount !== 1
                    ) {

                        return res.status(409).json({

                            success: false,

                            message:
                                "Stock পরিবর্তন হয়েছে। আবার order করুন।"

                        });

                    }


                    /* =========================
                       CREATE ORDER
                    ========================= */

                    const orderId =
                        generateOrderId();


                    const newOrder = {

                        orderId:

                            orderId,

                        product: {

                            productId:
                                product._id.toString(),

                            name:
                                product.name,

                            category:
                                product.category || "",

                            price:
                                productPrice,

                            quantity:
                                orderQuantity,

                            productTotal:
                                productTotal

                        },

                        customer: {

                            name:
                                name,

                            phone:
                                phone,

                            address:
                                address,

                            area:
                                area

                        },

                        delivery: {

                            area:
                                validDeliveryArea,

                            charge:
                                calculatedDeliveryCharge

                        },

                        totalAmount:
                            totalAmount,

                        paymentMethod:
                            validPaymentMethod,

                        status:
                            "Pending",

                        createdAt:
                            new Date(),

                        updatedAt:
                            new Date()

                    };


                    try {

                        const orderResult =
                            await ordersCollection
                                .insertOne(
                                    newOrder
                                );


                        res.status(201).json({

                            success: true,

                            message:
                                "Order successfully created!",

                            order: {

                                _id:
                                    orderResult
                                        .insertedId
                                        .toString(),

                                ...newOrder

                            }

                        });

                    } catch (orderError) {

                        /*
                           If order saving fails after stock
                           was reduced, restore the stock.
                        */

                        await productsCollection.updateOne(

                            {
                                _id:
                                    new ObjectId(
                                        productId
                                    )
                            },

                            {
                                $inc:
                                    {
                                        stock:
                                            orderQuantity
                                    }

                            }

                        );

                        throw orderError;

                    }


                } catch (error) {

                    console.error(
                        "Order creation error:",
                        error
                    );


                    res.status(500).json({

                        success: false,

                        message:
                            "Order create করা যায়নি",

                        error:
                            error.message

                    });

                }

            }
        );


        /* =====================================
           GET ORDERS
           ADMIN ONLY

           STEP 2-তে Admin Panel থেকে
           এই API ব্যবহার করব।
        ===================================== */

        app.get(
            "/api/orders",
            authenticateAdmin,
            async (req, res) => {

                try {

                    const orders =
                        await ordersCollection
                            .find({})
                            .sort({
                                createdAt: -1
                            })
                            .toArray();


                    const formattedOrders =
                        orders.map(order => ({

                            ...order,

                            _id:
                                order._id.toString()

                        }));


                    res.json({

                        success: true,

                        orders:
                            formattedOrders

                    });


                } catch (error) {

                    console.error(error);

                    res.status(500).json({

                        success: false,

                        message:
                            "Orders পাওয়া যায়নি",

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