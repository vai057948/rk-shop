/* =========================================================
   RK SHOP - FINAL SCRIPT
   Frontend + MongoDB Backend
   STEP 4 - DIRECT ORDER FROM PRODUCT DETAILS
   ========================================================= */


/* ================= CONFIG ================= */

const API_URL = "https://rk-shop-1.onrender.com";

const FACEBOOK_URL = "https://www.facebook.com/";
const MESSENGER_URL = "https://m.me/";

const WHATSAPP_NUMBER = "8801948736873";


/* ================= GLOBAL DATA ================= */

let products = [];

let cart = [];

let currentProduct = null;

let currentCartCheckout = false;

let selectedRating = 5;


/* ================= START ================= */

document.addEventListener("DOMContentLoaded", function () {

    try {

        cart =
            JSON.parse(
                localStorage.getItem("rkshopCart")
            ) || [];

        if (!Array.isArray(cart)) {
            cart = [];
        }

    } catch (error) {

        cart = [];

    }


    setupSocialLinks();

    setupEvents();

    setupReviews();

    updateCartUI();

    loadProducts();


    const yearElement =
        document.getElementById("currentYear");

    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

});


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function $(id) {

    return document.getElementById(id);

}


/* =========================================================
   SOCIAL LINKS
   ========================================================= */

function setupSocialLinks() {

    const facebookPageLink =
        $("facebookPageLink");

    const messengerPageLink =
        $("messengerPageLink");

    const footerFacebookLink =
        $("footerFacebookLink");

    const footerMessengerLink =
        $("footerMessengerLink");


    if (facebookPageLink) {

        facebookPageLink.href =
            FACEBOOK_URL;

    }


    if (messengerPageLink) {

        messengerPageLink.href =
            MESSENGER_URL;

    }


    if (footerFacebookLink) {

        footerFacebookLink.href =
            FACEBOOK_URL;

    }


    if (footerMessengerLink) {

        footerMessengerLink.href =
            MESSENGER_URL;

    }

}


/* =========================================================
   EVENTS
   ========================================================= */

function setupEvents() {

    /* ================= SEARCH ================= */

    const searchBtn =
        $("searchBtn");

    const searchInput =
        $("searchInput");


    if (searchBtn) {

        searchBtn.addEventListener(
            "click",
            performSearch
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            performSearch
        );


        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch();

                }

            }
        );

    }


    /* ================= CART ================= */

    const cartBtn =
        $("cartBtn");

    const cartCloseBtn =
        $("cartCloseBtn");

    const cartCheckoutBtn =
        $("cartCheckoutBtn");


    if (cartBtn) {

        cartBtn.addEventListener(
            "click",
            openCart
        );

    }


    if (cartCloseBtn) {

        cartCloseBtn.addEventListener(
            "click",
            closeCart
        );

    }


    if (cartCheckoutBtn) {

        cartCheckoutBtn.addEventListener(
            "click",
            checkoutCart
        );

    }


    /* ================= ORDER MODAL ================= */

    const closeModalBtn =
        $("closeModalBtn");

    const checkoutMinusBtn =
        $("checkoutMinusBtn");

    const checkoutPlusBtn =
        $("checkoutPlusBtn");

    const deliveryArea =
        $("deliveryArea");

    const messengerOrderBtn =
        $("messengerOrderBtn");

    const whatsappOrderBtn =
        $("whatsappOrderBtn");


    if (closeModalBtn) {

        closeModalBtn.addEventListener(
            "click",
            closeOrderModal
        );

    }


    if (checkoutMinusBtn) {

        checkoutMinusBtn.addEventListener(
            "click",
            decreaseCheckoutQuantity
        );

    }


    if (checkoutPlusBtn) {

        checkoutPlusBtn.addEventListener(
            "click",
            increaseCheckoutQuantity
        );

    }


    if (deliveryArea) {

        deliveryArea.addEventListener(
            "change",
            updateOrderTotal
        );

    }


    if (messengerOrderBtn) {

        messengerOrderBtn.addEventListener(
            "click",
            function () {

                sendOrder("messenger");

            }
        );

    }


    if (whatsappOrderBtn) {

        whatsappOrderBtn.addEventListener(
            "click",
            function () {

                sendOrder("whatsapp");

            }
        );

    }


    /* ================= REVIEW ================= */

    const reviewForm =
        $("reviewForm");

    const starContainer =
        $("starContainer");


    if (reviewForm) {

        reviewForm.addEventListener(
            "submit",
            submitReview
        );

    }


    if (starContainer) {

        const stars =
            starContainer.querySelectorAll(
                "button"
            );


        stars.forEach(function (star) {

            star.addEventListener(
                "click",
                function () {

                    selectedRating =
                        Number(
                            star.dataset.rating
                        ) || 5;

                    updateStars();

                }
            );

        });

    }


    /* ================= MODAL OUTSIDE CLICK ================= */

    const cartModal =
        $("cartModal");

    const orderModal =
        $("orderModal");


    if (cartModal) {

        cartModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    cartModal
                ) {

                    closeCart();

                }

            }
        );

    }


    if (orderModal) {

        orderModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    orderModal
                ) {

                    closeOrderModal();

                }

            }
        );

    }

}


/* =========================================================
   LOAD PRODUCTS
   ========================================================= */

async function loadProducts() {

    const productGrid =
        $("productGrid");

    const productCount =
        $("productCount");


    try {

        showLoadingProducts();


        const response =
            await fetch(
                `${API_URL}/api/products`
            );


        if (!response.ok) {

            throw new Error(
                "Backend connection failed"
            );

        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(data.products)
        ) {

            throw new Error(
                data.message ||
                "Products পাওয়া যায়নি"
            );

        }


        products =
            data.products.map(
                function (product) {

                    return {

                        id:
                            String(product._id),

                        name:
                            product.name || "",

                        category:
                            product.category || "",

                        price:
                            Number(
                                product.price || 0
                            ),

                        image:
                            product.image || "",

                        images:
                            Array.isArray(product.images)
                                ? product.images
                                : (
                                    product.image
                                        ? [product.image]
                                        : []
                                ),

                        description:
                            product.description || "",

                        stock:
                            Number(
                                product.stock || 0
                            )

                    };

                }
            );


        syncCartWithProducts();

        displayProducts(products);

        updateCartUI();

        handleDirectOrder();


    } catch (error) {

        console.error(
            "Product loading error:",
            error
        );


        products = [];


        if (productGrid) {

            productGrid.innerHTML = `

                <div style="
                    grid-column:1/-1;
                    padding:40px;
                    text-align:center;
                    background:#fff;
                    border-radius:12px;
                ">

                    <h3>
                        ⚠️ Products load করা যায়নি
                    </h3>

                    <p style="
                        color:#777;
                        margin-top:8px;
                    ">

                        Backend server চালু আছে কিনা
                        check করুন।

                    </p>

                </div>

            `;

        }


        if (productCount) {

            productCount.textContent =
                "0 Products";

        }

    }

}


/* =========================================================
   STEP 4
   HANDLE DIRECT ORDER
   ========================================================= */

function handleDirectOrder() {

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const directOrder =
        urlParams.get("directOrder");


    if (directOrder !== "true") {

        return;

    }


    const savedOrder =
        sessionStorage.getItem(
            "rkshopDirectOrder"
        );


    if (!savedOrder) {

        return;

    }


    let orderData;


    try {

        orderData =
            JSON.parse(savedOrder);

    } catch (error) {

        console.error(
            "Direct order data error:",
            error
        );

        sessionStorage.removeItem(
            "rkshopDirectOrder"
        );

        return;

    }


    const product =
        findProduct(
            orderData.id
        );


    if (!product) {

        alert(
            "❌ Product পাওয়া যায়নি।"
        );

        sessionStorage.removeItem(
            "rkshopDirectOrder"
        );

        return;

    }


    const stock =
        Number(
            product.stock || 0
        );


    if (stock <= 0) {

        alert(
            "❌ এই product বর্তমানে Out of Stock."
        );

        sessionStorage.removeItem(
            "rkshopDirectOrder"
        );

        return;

    }


    let quantity =
        Number(
            orderData.quantity || 1
        );


    quantity =
        Math.max(
            1,
            Math.min(
                quantity,
                stock
            )
        );


    currentCartCheckout =
        false;


    setTimeout(
        function () {

            openOrderModal(
                product,
                quantity
            );

        },
        300
    );


    sessionStorage.removeItem(
        "rkshopDirectOrder"
    );


    if (
        window.history &&
        window.history.replaceState
    ) {

        window.history.replaceState(
            {},
            document.title,
            window.location.pathname
        );

    }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoadingProducts() {

    const productGrid =
        $("productGrid");


    if (!productGrid) return;


    productGrid.innerHTML = `

        <div style="
            grid-column:1/-1;
            padding:50px;
            text-align:center;
            color:#777;
        ">

            Loading products...

        </div>

    `;

}


/* =========================================================
   DISPLAY PRODUCTS
   ========================================================= */

function displayProducts(productList) {

    const productGrid =
        $("productGrid");

    const productCount =
        $("productCount");

    const noProductsMessage =
        $("noProductsMessage");


    if (!productGrid) return;


    productGrid.innerHTML = "";


    if (productCount) {

        productCount.textContent =
            `${productList.length} ${
                productList.length === 1
                    ? "Product"
                    : "Products"
            }`;

    }


    if (productList.length === 0) {

        if (noProductsMessage) {

            noProductsMessage.style.display =
                "block";

        }

        return;

    }


    if (noProductsMessage) {

        noProductsMessage.style.display =
            "none";

    }


    productList.forEach(function (product) {

        const card =
            document.createElement("div");


        card.className =
            "product-card";


        const stock =
            Number(product.stock || 0);


        const stockHTML =
            stock > 0

                ? `

                    <div class="stock-status stock-in">

                        ✅ In Stock (${stock})

                    </div>

                  `

                : `

                    <div class="stock-status stock-out">

                        ❌ Out of Stock

                    </div>

                  `;


        const safeImage =
            product.image ||
            "https://via.placeholder.com/500x500?text=RK+Shop";


        card.innerHTML = `

            <div class="product-image-box">

                <img
                    src="${escapeHTML(
                        safeImage
                    )}"
                    alt="${escapeHTML(
                        product.name
                    )}"
                    loading="lazy"
                    onerror="
                        this.src='https://via.placeholder.com/500x500?text=No+Image';
                    "
                >

            </div>


            <div class="product-info">

                <span class="product-category">

                    ${escapeHTML(
                        product.category ||
                        "Product"
                    )}

                </span>


                <h3 class="product-name">

                    ${escapeHTML(
                        product.name ||
                        "Unnamed Product"
                    )}

                </h3>


                <div class="product-price">

                    ৳${formatPrice(
                        product.price
                    )}

                </div>


                ${stockHTML}


                <div class="product-buttons">

                    <button
                        type="button"
                        class="view-details-btn"
                        data-action="details"
                        data-id="${escapeHTML(
                            product.id
                        )}"
                    >

                        👁 View Details

                    </button>


                    <button
                        type="button"
                        class="add-cart-btn"
                        data-action="cart"
                        data-id="${escapeHTML(
                            product.id
                        )}"
                        ${
                            stock <= 0
                                ? "disabled"
                                : ""
                        }
                    >

                        🛒 Add to Cart

                    </button>


                    <button
                        type="button"
                        class="buy-btn"
                        data-action="buy"
                        data-id="${escapeHTML(
                            product.id
                        )}"
                        ${
                            stock <= 0
                                ? "disabled"
                                : ""
                        }
                    >

                        ⚡ Buy Now

                    </button>

                </div>

            </div>

        `;


        productGrid.appendChild(card);

    });


    productGrid.onclick =
        function (event) {

            const button =
                event.target.closest(
                    "button[data-action]"
                );


            if (!button) return;


            const id =
                button.dataset.id;


            const action =
                button.dataset.action;


            if (!id) return;


            if (action === "details") {

                viewProductDetails(id);

            }


            if (action === "cart") {

                addToCart(id, 1);

            }


            if (action === "buy") {

                buyNow(id);

            }

        };

}


/* =========================================================
   VIEW DETAILS
   ========================================================= */

function viewProductDetails(productId) {

    if (!productId) return;


    window.location.href =
        `product-details.html?id=${
            encodeURIComponent(productId)
        }`;

}


/* =========================================================
   SEARCH
   ========================================================= */

function performSearch() {

    const searchInput =
        $("searchInput");


    if (!searchInput) return;


    const text =
        searchInput.value
            .trim()
            .toLowerCase();


    if (!text) {

        displayProducts(products);

        return;

    }


    const filteredProducts =
        products.filter(
            function (product) {

                return (

                    String(
                        product.name || ""
                    )
                    .toLowerCase()
                    .includes(text)

                    ||

                    String(
                        product.category || ""
                    )
                    .toLowerCase()
                    .includes(text)

                    ||

                    String(
                        product.description || ""
                    )
                    .toLowerCase()
                    .includes(text)

                );

            }
        );


    displayProducts(
        filteredProducts
    );

}


/* =========================================================
   FIND PRODUCT
   ========================================================= */

function findProduct(productId) {

    return products.find(
        function (product) {

            return String(product.id) ===
                String(productId);

        }
    );

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(
    productId,
    quantity = 1
) {

    const product =
        findProduct(productId);


    if (!product) {

        alert(
            "❌ Product পাওয়া যায়নি।"
        );

        return false;

    }


    const stock =
        Number(product.stock || 0);


    if (stock <= 0) {

        alert(
            "❌ এই product বর্তমানে Out of Stock."
        );

        return false;

    }


    const qty =
        Math.max(
            1,
            Number(quantity) || 1
        );


    const existing =
        cart.find(
            function (item) {

                return String(item.id) ===
                    String(product.id);

            }
        );


    if (existing) {

        existing.quantity =
            Math.min(
                Number(existing.quantity || 0) +
                qty,

                stock
            );

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                Number(product.price || 0),

            image:
                product.image || "",

            stock:
                stock,

            quantity:
                Math.min(
                    qty,
                    stock
                )

        });

    }


    saveCart();

    updateCartUI();


    alert(
        "✅ Product cart-এ যোগ হয়েছে!"
    );


    return true;

}


/* =========================================================
   BUY NOW
   ========================================================= */

function buyNow(productId) {

    const product =
        findProduct(productId);


    if (!product) {

        alert(
            "❌ Product পাওয়া যায়নি।"
        );

        return;

    }


    const stock =
        Number(product.stock || 0);


    if (stock <= 0) {

        alert(
            "❌ এই product বর্তমানে Out of Stock."
        );

        return;

    }


    currentCartCheckout =
        false;


    openOrderModal(
        product,
        1
    );

}


/* =========================================================
   CART SAVE
   ========================================================= */

function saveCart() {

    localStorage.setItem(
        "rkshopCart",
        JSON.stringify(cart)
    );

}


/* =========================================================
   CART TOTAL
   ========================================================= */

function getCartTotalItems() {

    return cart.reduce(
        function (total, item) {

            return total +
                Number(
                    item.quantity || 0
                );

        },
        0
    );

}


function getCartTotalAmount() {

    return cart.reduce(
        function (total, item) {

            return total +

                (
                    Number(
                        item.price || 0
                    )

                    *

                    Number(
                        item.quantity || 0
                    )
                );

        },
        0
    );

}


/* =========================================================
   CART UI
   ========================================================= */

function updateCartUI() {

    const cartCounter =
        $("cartCounter");

    const totalPrice =
        $("totalPrice");

    const cartTotalItems =
        $("cartTotalItems");

    const cartTotalAmount =
        $("cartTotalAmount");

    const cartCheckoutBtn =
        $("cartCheckoutBtn");


    const totalItems =
        getCartTotalItems();


    const totalAmount =
        getCartTotalAmount();


    if (cartCounter) {

        cartCounter.textContent =
            totalItems;

    }


    if (totalPrice) {

        totalPrice.textContent =
            `৳${formatPrice(
                totalAmount
            )}`;

    }


    if (cartTotalItems) {

        cartTotalItems.textContent =
            totalItems;

    }


    if (cartTotalAmount) {

        cartTotalAmount.textContent =
            `৳${formatPrice(
                totalAmount
            )}`;

    }


    if (cartCheckoutBtn) {

        cartCheckoutBtn.disabled =
            cart.length === 0;

    }

}


/* =========================================================
   OPEN CART
   ========================================================= */

function openCart() {

    renderCart();


    const cartModal =
        $("cartModal");


    if (!cartModal) return;


    cartModal.classList.add("show");


    cartModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   CLOSE CART
   ========================================================= */

function closeCart() {

    const cartModal =
        $("cartModal");


    if (!cartModal) return;


    cartModal.classList.remove(
        "show"
    );


    cartModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart() {

    const cartItems =
        $("cartItems");


    if (!cartItems) return;


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="cart-empty">

                🛒 Your cart is empty.

            </div>

        `;


        updateCartUI();

        return;

    }


    cartItems.innerHTML = "";


    cart.forEach(function (item) {

        const itemElement =
            document.createElement("div");


        itemElement.className =
            "cart-item";


        const image =
            item.image ||
            "https://via.placeholder.com/100x100?text=Product";


        itemElement.innerHTML = `

            <img
                class="cart-item-image"
                src="${escapeHTML(
                    image
                )}"
                alt="${escapeHTML(
                    item.name
                )}"
                onerror="
                    this.src='https://via.placeholder.com/100x100?text=No+Image';
                "
            >


            <div class="cart-item-info">

                <h4>

                    ${escapeHTML(
                        item.name
                    )}

                </h4>


                <p>

                    ৳${formatPrice(
                        item.price
                    )}

                </p>

            </div>


            <div class="cart-item-right">

                <div class="cart-quantity-control">

                    <button
                        type="button"
                        data-cart-action="minus"
                        data-id="${escapeHTML(
                            item.id
                        )}"
                    >

                        −

                    </button>


                    <strong>

                        ${item.quantity}

                    </strong>


                    <button
                        type="button"
                        data-cart-action="plus"
                        data-id="${escapeHTML(
                            item.id
                        )}"
                    >

                        +

                    </button>

                </div>


                <button
                    type="button"
                    class="remove-cart-item"
                    data-cart-action="remove"
                    data-id="${escapeHTML(
                        item.id
                    )}"
                >

                    🗑

                </button>

            </div>

        `;


        cartItems.appendChild(
            itemElement
        );

    });


    cartItems.onclick =
        function (event) {

            const button =
                event.target.closest(
                    "button[data-cart-action]"
                );


            if (!button) return;


            const id =
                button.dataset.id;


            const action =
                button.dataset.cartAction;


            if (action === "minus") {

                changeCartQuantity(
                    id,
                    -1
                );

            }


            if (action === "plus") {

                changeCartQuantity(
                    id,
                    1
                );

            }


            if (action === "remove") {

                removeFromCart(id);

                renderCart();

            }

        };


    updateCartUI();

}


/* =========================================================
   REMOVE CART
   ========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(
            function (item) {

                return String(item.id) !==
                    String(productId);

            }
        );


    saveCart();

    updateCartUI();

}


/* =========================================================
   CHANGE CART QUANTITY
   ========================================================= */

function changeCartQuantity(
    productId,
    change
) {

    const item =
        cart.find(
            function (cartItem) {

                return String(
                    cartItem.id
                ) ===
                String(productId);

            }
        );


    if (!item) return;


    const product =
        findProduct(productId);


    const stock =
        product
            ? Number(product.stock || 0)
            : Number(item.stock || 0);


    let quantity =
        Number(item.quantity || 1) +
        Number(change || 0);


    if (quantity <= 0) {

        removeFromCart(productId);

        renderCart();

        return;

    }


    if (stock > 0) {

        quantity =
            Math.min(
                quantity,
                stock
            );

    }


    item.quantity =
        quantity;


    saveCart();

    updateCartUI();

    renderCart();

}


/* =========================================================
   SYNC CART
   ========================================================= */

function syncCartWithProducts() {

    cart =
        cart.filter(
            function (item) {

                const product =
                    findProduct(item.id);


                if (!product) {

                    return false;

                }


                const stock =
                    Number(
                        product.stock || 0
                    );


                if (stock <= 0) {

                    return false;

                }


                item.name =
                    product.name;

                item.price =
                    Number(
                        product.price || 0
                    );

                item.image =
                    product.image || "";

                item.stock =
                    stock;

                item.quantity =
                    Math.min(
                        Number(
                            item.quantity || 1
                        ),
                        stock
                    );


                return true;

            }
        );


    saveCart();

}


/* =========================================================
   CART CHECKOUT
   ========================================================= */

function checkoutCart() {

    if (cart.length === 0) {

        alert(
            "🛒 আপনার cart empty."
        );

        return;

    }


    const firstItem =
        cart[0];


    const product =
        findProduct(
            firstItem.id
        );


    if (!product) {

        alert(
            "❌ Product পাওয়া যায়নি।"
        );

        return;

    }


    currentCartCheckout =
        true;


    openOrderModal(
        product,
        Number(
            firstItem.quantity || 1
        )
    );


    closeCart();

}


/* =========================================================
   ORDER MODAL
   ========================================================= */

function openOrderModal(
    product,
    quantity = 1
) {

    currentProduct =
        product;


    const orderModal =
        $("orderModal");


    if (!orderModal) {

        alert(
            "⚠️ Order modal পাওয়া যায়নি। index.html check করুন।"
        );

        return;

    }


    const modalProductName =
        $("modalProductName");

    const modalProductPrice =
        $("modalProductPrice");

    const checkoutQuantity =
        $("checkoutQuantity");

    const deliveryArea =
        $("deliveryArea");


    if (modalProductName) {

        modalProductName.textContent =
            product.name;

    }


    if (modalProductPrice) {

        modalProductPrice.textContent =
            `৳${formatPrice(
                product.price
            )}`;

    }


    const stock =
        Number(
            product.stock || 0
        );


    let qty =
        Number(quantity) || 1;


    qty =
        Math.max(
            1,
            Math.min(
                qty,
                stock
            )
        );


    if (checkoutQuantity) {

        checkoutQuantity.value =
            qty;

        checkoutQuantity.max =
            stock;

    }


    if (deliveryArea) {

        deliveryArea.value =
            "inside";

    }


    updateOrderTotal();


    orderModal.classList.add(
        "show"
    );


    orderModal.setAttribute(
        "aria-hidden",
        "false"
    );

}


/* =========================================================
   CLOSE ORDER MODAL
   ========================================================= */

function closeOrderModal() {

    const orderModal =
        $("orderModal");


    if (!orderModal) return;


    orderModal.classList.remove(
        "show"
    );


    orderModal.setAttribute(
        "aria-hidden",
        "true"
    );


    currentProduct =
        null;


    currentCartCheckout =
        false;

}


/* =========================================================
   CHECKOUT QUANTITY
   ========================================================= */

function decreaseCheckoutQuantity() {

    const checkoutQuantity =
        $("checkoutQuantity");


    if (!checkoutQuantity) return;


    let quantity =
        Number(
            checkoutQuantity.value
        ) || 1;


    if (quantity > 1) {

        quantity--;

    }


    checkoutQuantity.value =
        quantity;


    updateOrderTotal();

}


function increaseCheckoutQuantity() {

    const checkoutQuantity =
        $("checkoutQuantity");


    if (!checkoutQuantity) return;


    if (!currentProduct) return;


    let quantity =
        Number(
            checkoutQuantity.value
        ) || 1;


    const stock =
        Number(
            currentProduct.stock || 0
        );


    if (quantity < stock) {

        quantity++;

    }


    checkoutQuantity.value =
        quantity;


    updateOrderTotal();

}


/* =========================================================
   DELIVERY
   ========================================================= */

function getDeliveryCharge() {

    const deliveryArea =
        $("deliveryArea");


    if (!deliveryArea) {

        return 80;

    }


    return deliveryArea.value ===
        "outside"

        ? 130

        : 80;

}


/* =========================================================
   ORDER TOTAL
   ========================================================= */

function updateOrderTotal() {

    if (!currentProduct) return;


    const checkoutQuantity =
        $("checkoutQuantity");

    const deliveryCharge =
        $("deliveryCharge");

    const totalCost =
        $("totalCost");


    const quantity =
        Number(
            checkoutQuantity?.value || 1
        );


    const productTotal =
        Number(
            currentProduct.price || 0
        ) *
        quantity;


    const delivery =
        getDeliveryCharge();


    const total =
        productTotal +
        delivery;


    if (deliveryCharge) {

        deliveryCharge.textContent =
            `৳${formatPrice(
                delivery
            )}`;

    }


    if (totalCost) {

        totalCost.textContent =
            `৳${formatPrice(
                total
            )}`;

    }

}


/* =========================================================
   CUSTOMER VALIDATION
   ========================================================= */

function validateCustomer() {

    const customerName =
        $("customerName");

    const customerPhone =
        $("customerPhone");

    const customerAddress =
        $("customerAddress");

    const customerArea =
        $("customerArea");


    const name =
        customerName?.value.trim() || "";


    const phone =
        customerPhone?.value.trim() || "";


    const address =
        customerAddress?.value.trim() || "";


    const area =
        customerArea?.value.trim() || "";


    if (!name) {

        alert(
            "আপনার নাম দিন।"
        );

        customerName?.focus();

        return false;

    }


    if (!phone) {

        alert(
            "আপনার phone number দিন।"
        );

        customerPhone?.focus();

        return false;

    }


    const phonePattern =
        /^(?:\+?8801|01)[3-9]\d{8}$/;


    if (!phonePattern.test(phone)) {

        alert(
            "সঠিক Bangladesh phone number দিন।"
        );

        customerPhone?.focus();

        return false;

    }


    if (!address) {

        alert(
            "আপনার সম্পূর্ণ address দিন।"
        );

        customerAddress?.focus();

        return false;

    }


    if (!area) {

        alert(
            "আপনার area / district দিন।"
        );

        customerArea?.focus();

        return false;

    }


    return true;

}


/* =========================================================
   ORDER MESSAGE
   ========================================================= */

function createOrderMessage() {

    if (!currentProduct) {

        return "";

    }


    const checkoutQuantity =
        $("checkoutQuantity");

    const customerName =
        $("customerName");

    const customerPhone =
        $("customerPhone");

    const customerAddress =
        $("customerAddress");

    const customerArea =
        $("customerArea");


    const quantity =
        Number(
            checkoutQuantity?.value || 1
        );


    const delivery =
        getDeliveryCharge();


    const productTotal =
        Number(
            currentProduct.price || 0
        ) *
        quantity;


    const total =
        productTotal +
        delivery;


    const name =
        customerName?.value.trim() || "";


    const phone =
        customerPhone?.value.trim() || "";


    const address =
        customerAddress?.value.trim() || "";


    const area =
        customerArea?.value.trim() || "";


    return `

🛍️ RK Shop - New Order

📦 Product:
${currentProduct.name}

💰 Product Price:
৳${formatPrice(
    currentProduct.price
)}

🔢 Quantity:
${quantity}

🚚 Delivery:
৳${formatPrice(
    delivery
)}

💵 Total:
৳${formatPrice(
    total
)}

👤 Customer Name:
${name}

📞 Phone:
${phone}

📍 Area:
${area}

🏠 Address:
${address}

💳 Payment:
Cash on Delivery

    `.trim();

}


/* =========================================================
   SEND ORDER
   ========================================================= */

function sendOrder(type) {

    if (!currentProduct) {

        alert(
            "❌ Product পাওয়া যায়নি।"
        );

        return;

    }


    if (!validateCustomer()) {

        return;

    }


    const message =
        createOrderMessage();


    /* ================= WHATSAPP ================= */

    if (type === "whatsapp") {

        const url =
            `https://wa.me/${
                WHATSAPP_NUMBER
            }?text=${
                encodeURIComponent(
                    message
                )
            }`;


        window.open(
            url,
            "_blank"
        );


        completeOrder();

        return;

    }


    /* ================= MESSENGER ================= */

    if (type === "messenger") {

        copyText(message);


        window.open(
            MESSENGER_URL,
            "_blank"
        );


        alert(
            "✅ Order details copy হয়েছে। Messenger-এ paste করে Send করুন।"
        );


        completeOrder();

    }

}


/* =========================================================
   COMPLETE ORDER
   ========================================================= */

function completeOrder() {

    if (!currentProduct) return;


    const checkoutQuantity =
        $("checkoutQuantity");


    const quantity =
        Number(
            checkoutQuantity?.value || 1
        );


    const product =
        findProduct(
            currentProduct.id
        );


    if (product) {

        product.stock =
            Math.max(
                0,
                Number(
                    product.stock || 0
                ) -
                quantity
            );

    }


    const cartItem =
        cart.find(
            function (item) {

                return String(
                    item.id
                ) ===
                String(
                    currentProduct.id
                );

            }
        );


    if (cartItem) {

        cartItem.quantity =
            Math.max(
                0,
                Number(
                    cartItem.quantity || 0
                ) -
                quantity
            );


        if (
            cartItem.quantity === 0
        ) {

            cart =
                cart.filter(
                    function (item) {

                        return String(
                            item.id
                        ) !==
                        String(
                            currentProduct.id
                        );

                    }
                );

        }

    }


    saveCart();

    updateCartUI();

    displayProducts(
        products
    );

    closeOrderModal();

}


/* =========================================================
   COPY TEXT
   ========================================================= */

function copyText(text) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {

        navigator.clipboard
            .writeText(text)
            .catch(
                function () {}
            );

        return;

    }


    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        text;


    textarea.style.position =
        "fixed";


    textarea.style.left =
        "-9999px";


    document.body.appendChild(
        textarea
    );


    textarea.select();


    try {

        document.execCommand(
            "copy"
        );

    } catch (error) {

        console.log(
            "Copy failed"
        );

    }


    document.body.removeChild(
        textarea
    );

}


/* =========================================================
   REVIEWS
   ========================================================= */

function setupReviews() {

    updateStars();

    loadReviews();

}


function updateStars() {

    const starContainer =
        $("starContainer");


    if (!starContainer) return;


    const stars =
        starContainer.querySelectorAll(
            "button"
        );


    stars.forEach(
        function (star) {

            const rating =
                Number(
                    star.dataset.rating
                );


            star.classList.toggle(
                "selected",
                rating <= selectedRating
            );

        }
    );

}


function loadReviews() {

    const reviewsList =
        $("reviewsList");


    if (!reviewsList) return;


    let reviews = [];


    try {

        reviews =
            JSON.parse(
                localStorage.getItem(
                    "rkshopReviews"
                )
            ) || [];

    } catch (error) {

        reviews = [];

    }


    if (
        !Array.isArray(reviews) ||
        reviews.length === 0
    ) {

        reviewsList.innerHTML = `

            <div class="review-card">

                <p class="review-comment">

                    এখনো কোনো review নেই।
                    আপনার review প্রথমটি হতে পারে।

                </p>

            </div>

        `;

        return;

    }


    reviewsList.innerHTML = "";


    reviews
        .slice()
        .reverse()
        .forEach(
            function (review) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "review-card";


                const stars =
                    "★".repeat(
                        Number(
                            review.rating || 5
                        )
                    );


                card.innerHTML = `

                    <div class="review-stars">

                        ${stars}

                    </div>


                    <div class="review-name">

                        ${escapeHTML(
                            review.name
                        )}

                    </div>


                    <div class="review-comment">

                        ${escapeHTML(
                            review.comment
                        )}

                    </div>

                `;


                reviewsList.appendChild(
                    card
                );

            }
        );

}


function submitReview(event) {

    event.preventDefault();


    const reviewerName =
        $("reviewerName");

    const reviewerComment =
        $("reviewerComment");

    const reviewForm =
        $("reviewForm");


    const name =
        reviewerName?.value.trim() || "";


    const comment =
        reviewerComment?.value.trim() || "";


    if (!name || !comment) {

        alert(
            "Name এবং review লিখুন।"
        );

        return;

    }


    let reviews = [];


    try {

        reviews =
            JSON.parse(
                localStorage.getItem(
                    "rkshopReviews"
                )
            ) || [];

    } catch (error) {

        reviews = [];

    }


    reviews.push({

        name:
            name,

        rating:
            selectedRating,

        comment:
            comment,

        createdAt:
            new Date().toISOString()

    });


    localStorage.setItem(
        "rkshopReviews",
        JSON.stringify(
            reviews
        )
    );


    if (reviewForm) {

        reviewForm.reset();

    }


    selectedRating =
        5;


    updateStars();

    loadReviews();


    alert(
        "⭐ আপনার review যোগ হয়েছে!"
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   FORMAT PRICE
   ========================================================= */

function formatPrice(value) {

    return (
        Number(value) || 0
    ).toLocaleString(
        "en-BD"
    );

}
